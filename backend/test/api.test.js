'use strict'

/*
 * API contract tests. Uses a controllable fake scanner so endpoint behaviour
 * (validation, statuses, mapping, dashboard maths, error honesty) can be
 * verified deterministically without launching a browser. The real browser
 * scan is covered by scanner.e2e.test.js.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const { buildConfig } = require('../src/config')
const { ScanStore } = require('../src/store')
const { createApp } = require('../src/app')

async function startApp({ scanner, allowLocalTargets = true, envOverrides = {} }) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'accessaudit-test-'))
  const config = buildConfig({ ...envOverrides, DATA_DIR: dataDir, ALLOW_LOCAL_TARGETS: allowLocalTargets ? 'true' : 'false' })
  const store = new ScanStore(config.dataDir)
  await store.init()
  const app = createApp({ store, config, scanner })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`
  return { server, baseUrl, store, close: () => new Promise((resolve) => server.close(resolve)) }
}

const SAMPLE_ISSUE = {
  id: 'image-alt-1',
  ruleId: 'image-alt',
  severity: 'critical',
  impact: 'critical',
  wcagCriterion: 'WCAG 1.1.1',
  description: 'Images must have alternative text',
  affectedUsers: 'Screen reader users cannot understand images that have no alternative text.',
  element: '<img src="x.jpg">',
  selector: 'body > img',
  fix: { explanation: 'Add an alt attribute.', before: '<img src="x.jpg">', after: null },
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  tags: ['wcag2a', 'wcag111'],
  affectedNodes: 1,
}

function okScanner() {
  return {
    getMetrics: () => ({ active: 0, queued: 0 }),
    runScan: async () => ({ issues: [SAMPLE_ISSUE], incomplete: [], passesCount: 3, httpStatus: 200, finalUrl: 'https://example.com/' }),
  }
}

function failingScanner(error) {
  return {
    getMetrics: () => ({ active: 0, queued: 0 }),
    runScan: async () => { throw error },
  }
}

async function pollUntilDone(baseUrl, id) {
  for (let i = 0; i < 40; i += 1) {
    const res = await fetch(`${baseUrl}/api/scans/${id}`)
    assert.equal(res.status, 200)
    const detail = await res.json()
    if (detail.status !== 'scanning') return detail
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('scan did not finish in time')
}

test('health endpoint reports real service status', async () => {
  const app = await startApp({ scanner: okScanner() })
  try {
    const res = await fetch(`${app.baseUrl}/api/health`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.status, 'ok')
    assert.equal(typeof body.scansStored, 'number')
    assert.equal(typeof body.uptimeSeconds, 'number')
  } finally { await app.close() }
})

test('POST /api/scans rejects missing, malformed and non-http URLs', async () => {
  const app = await startApp({ scanner: okScanner() })
  try {
    const cases = [
      { body: {}, code: 'INVALID_URL' },
      { body: { url: 'not a url' }, code: 'INVALID_URL' },
      { body: { url: 'ftp://example.com' }, code: 'UNSUPPORTED_PROTOCOL' },
      { body: { url: 'javascript:alert(1)' }, code: 'UNSUPPORTED_PROTOCOL' },
      { body: { url: 'file:///etc/passwd' }, code: 'UNSUPPORTED_PROTOCOL' },
    ]
    for (const c of cases) {
      const res = await fetch(`${app.baseUrl}/api/scans`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(c.body),
      })
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(c.body)}`)
      const body = await res.json()
      assert.equal(body.error.code, c.code)
      assert.ok(body.error.message.length > 0)
    }
  } finally { await app.close() }
})

test('POST /api/scans blocks private/internal targets (403)', async () => {
  const app = await startApp({ scanner: okScanner(), allowLocalTargets: false })
  try {
    const blocked = ['http://localhost:3000', 'http://127.0.0.1', 'http://169.254.169.254/', 'http://10.1.2.3/', 'http://192.168.0.1/']
    for (const url of blocked) {
      const res = await fetch(`${app.baseUrl}/api/scans`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      assert.equal(res.status, 403, `expected 403 for ${url}`)
      const body = await res.json()
      assert.equal(body.error.code, 'BLOCKED_TARGET')
    }
  } finally { await app.close() }
})

test('scan lifecycle: submit -> scanning -> completed with real mapped findings', async () => {
  const app = await startApp({ scanner: okScanner() })
  try {
    const post = await fetch(`${app.baseUrl}/api/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    assert.equal(post.status, 202)
    const created = await post.json()
    assert.ok(created.id && created.id.length > 10, 'genuine generated scan id expected')
    assert.equal(created.status, 'scanning')
    assert.equal(created.url, 'https://example.com/') // URL.href canonicalizes with trailing slash
    assert.ok(!Number.isNaN(Date.parse(created.date)), 'date must be ISO-8601')

    const detail = await pollUntilDone(app.baseUrl, created.id)
    assert.equal(detail.status, 'completed')
    assert.equal(detail.issues.length, 1)
    assert.equal(detail.issues[0].ruleId, 'image-alt')
    assert.equal(detail.issues[0].severity, 'critical')

    const history = await (await fetch(`${app.baseUrl}/api/scans`)).json()
    assert.ok(history.some((s) => s.id === created.id && s.issues === 1))

    const latest = await (await fetch(`${app.baseUrl}/api/scans/latest`)).json()
    assert.equal(latest.id, created.id)
    assert.equal(latest.status, 'completed')

    const reports = await (await fetch(`${app.baseUrl}/api/reports`)).json()
    const report = reports.find((r) => r.id === created.id)
    assert.ok(report, 'report should exist for completed scan')
    assert.equal(report.title, `Accessibility report: ${created.url}`)

    const dashboard = await (await fetch(`${app.baseUrl}/api/dashboard`)).json()
    assert.equal(dashboard.stats.totalScans, 1)
    assert.equal(dashboard.stats.openIssues, 1)
    assert.equal(dashboard.stats.criticalSerious, 1)
    const severityTotal = dashboard.severity.reduce((sum, s) => sum + s.count, 0)
    assert.equal(severityTotal, 1)
    assert.equal(dashboard.recentScans.length, 1)
    assert.equal(dashboard.scansOverTime.length, 6)
  } finally { await app.close() }
})

test('failed scans store an explicit failure and never fabricate findings', async () => {
  const err = Object.assign(new Error('The page could not be loaded: net::ERR_NAME_NOT_RESOLVED'), { code: 'NAVIGATION_FAILED' })
  const app = await startApp({ scanner: failingScanner(err) })
  try {
    const post = await fetch(`${app.baseUrl}/api/scans`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.org' }),
    })
    const created = await post.json()
    const detail = await pollUntilDone(app.baseUrl, created.id)
    assert.equal(detail.status, 'failed')
    assert.deepEqual(detail.issues, [], 'failed scans must not carry findings')
    assert.equal(detail.error.code, 'NAVIGATION_FAILED')
    assert.ok(detail.error.message.length > 0)

    const reports = await (await fetch(`${app.baseUrl}/api/reports`)).json()
    assert.equal(reports.find((r) => r.id === created.id), undefined)
    const dashboard = await (await fetch(`${app.baseUrl}/api/dashboard`)).json()
    assert.equal(dashboard.stats.openIssues, 0)
    const history = await (await fetch(`${app.baseUrl}/api/scans`)).json()
    const row = history.find((s) => s.id === created.id)
    assert.equal(row.status, 'failed')
    assert.equal(row.issues, null)
  } finally { await app.close() }
})

test('GET /api/scans/:id returns 404 for unknown ids', async () => {
  const app = await startApp({ scanner: okScanner() })
  try {
    const res = await fetch(`${app.baseUrl}/api/scans/does-not-exist`)
    assert.equal(res.status, 404)
    assert.equal((await res.json()).error.code, 'NOT_FOUND')
  } finally { await app.close() }
})

test('GET /api/scans/latest returns null when there are no scans', async () => {
  const app = await startApp({ scanner: okScanner() })
  try {
    const res = await fetch(`${app.baseUrl}/api/scans/latest`)
    assert.equal(res.status, 200)
    assert.equal(await res.json(), null)
  } finally { await app.close() }
})

test('unknown API endpoints return the standard error shape', async () => {
  const app = await startApp({ scanner: okScanner() })
  try {
    const res = await fetch(`${app.baseUrl}/api/nope`)
    assert.equal(res.status, 404)
    assert.equal((await res.json()).error.code, 'NOT_FOUND')
  } finally { await app.close() }
})

