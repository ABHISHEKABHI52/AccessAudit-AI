'use strict'

/*
 * End-to-end acceptance test: REAL Playwright Chromium + axe-core.
 *
 * A controlled local fixture page (test/fixtures/inaccessible.html) with a
 * known missing-alt image is scanned through the actual scanning mechanism.
 * The test verifies axe-core reports the genuine `image-alt` violation and
 * that the API serves it in the frontend data contract.
 *
 * Also covers: failed navigation, navigation timeout, and blocked targets —
 * always producing explicit failures, never fabricated findings.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

const { buildConfig } = require('../src/config')
const { ScanStore } = require('../src/store')
const { createScanner } = require('../src/scanner')
const { createApp } = require('../src/app')
const { createFixtureServer } = require('./helpers/staticServer')

async function startApp(envOverrides = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'accessaudit-e2e-'))
  const config = buildConfig({
    ALLOW_LOCAL_TARGETS: 'true',
    NAVIGATION_TIMEOUT_MS: '15000',
    SCAN_TIMEOUT_MS: '45000',
    ...envOverrides,
    DATA_DIR: dataDir,
  })
  const store = new ScanStore(config.dataDir)
  await store.init()
  const scanner = createScanner(config)
  const app = createApp({ store, config, scanner })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) }
}

async function startScan(baseUrl, url) {
  const res = await fetch(`${baseUrl}/api/scans`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

async function pollUntilDone(baseUrl, id, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const res = await fetch(`${baseUrl}/api/scans/${id}`)
    const detail = await res.json()
    if (detail.status !== 'scanning') return detail
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('scan did not finish in time')
}

test('E2E: real Chromium + axe-core reports the known image-alt violation from the fixture page', async () => {
  const fixture = await createFixtureServer()
  const app = await startApp()
  try {
    const started = await startScan(app.baseUrl, `${fixture.baseUrl}/inaccessible.html`)
    assert.equal(started.status, 202)
    assert.equal(started.body.status, 'scanning')

    const detail = await pollUntilDone(app.baseUrl, started.body.id)
    assert.equal(detail.status, 'completed', `scan failed: ${JSON.stringify(detail.error)}`)

    const imageAlt = detail.issues.find((i) => i.ruleId === 'image-alt')
    assert.ok(imageAlt, `expected a genuine image-alt violation, got: ${detail.issues.map((i) => i.ruleId).join(', ')}`)

    // Contract fields the existing Results UI renders.
    assert.equal(imageAlt.severity, 'critical')
    assert.equal(imageAlt.impact, 'critical')
    assert.equal(imageAlt.description, 'Images must have alternative text')
    assert.equal(imageAlt.wcagCriterion, 'WCAG 1.1.1')
    assert.ok(imageAlt.selector && imageAlt.selector.includes('img'), 'selector should point at the img')
    assert.ok(imageAlt.element && imageAlt.element.includes('<img'), 'element should carry the offending HTML')
    assert.ok(imageAlt.fix.explanation.length > 0, 'rule-based fix explanation expected')
    assert.ok(imageAlt.fix.before.includes('<img'), 'fix.before should carry the actual HTML evidence')
    // image-alt has curated guidance: the explanation must clearly label the
    // after-code as a generic example pattern, not an automatic page edit.
    assert.ok(imageAlt.fix.explanation.includes('generic example pattern'))
    assert.ok(imageAlt.fix.after && imageAlt.fix.after.includes('alt='))

    // Original axe evidence preserved.
    assert.ok(imageAlt.helpUrl.includes('dequeuniversity.com'))
    assert.ok(Array.isArray(imageAlt.tags) && imageAlt.tags.includes('wcag2a'))
    assert.ok(imageAlt.affectedNodes >= 1)
    assert.ok(imageAlt.id && imageAlt.id.startsWith('image-alt'))

    // Other known violations on the page are detected too (real scan, not a canned list).
    const ruleIds = detail.issues.map((i) => i.ruleId)
    assert.ok(ruleIds.includes('button-name'), `expected button-name among ${ruleIds.join(', ')}`)
    assert.ok(ruleIds.includes('label'), `expected label among ${ruleIds.join(', ')}`)

    // History / dashboard now reflect this real completed scan.
    const history = await (await fetch(`${app.baseUrl}/api/scans`)).json()
    assert.equal(history[0].id, started.body.id)
    assert.equal(history[0].issues, detail.issues.length)
    const dashboard = await (await fetch(`${app.baseUrl}/api/dashboard`)).json()
    assert.equal(dashboard.stats.totalScans, 1)
    assert.equal(dashboard.stats.openIssues, detail.issues.length)
  } finally {
    fixture.server.close()
    await app.close()
  }
}, { timeout: 120000 })

test('E2E: navigation failure produces an explicit failed status with no findings', async () => {
  const app = await startApp()
  try {
    // Grab a port that is definitely closed by binding and releasing it.
    const probe = await createFixtureServer()
    const deadUrl = `${probe.baseUrl}/inaccessible.html`
    await new Promise((resolve) => probe.server.close(resolve))

    const started = await startScan(app.baseUrl, deadUrl)
    assert.equal(started.status, 202)
    const detail = await pollUntilDone(app.baseUrl, started.body.id, 30000)
    assert.equal(detail.status, 'failed')
    assert.deepEqual(detail.issues, [])
    assert.ok(detail.error && detail.error.code === 'NAVIGATION_FAILED', `unexpected error: ${JSON.stringify(detail.error)}`)
  } finally { await app.close() }
}, { timeout: 60000 })

test('E2E: a hanging page hits the navigation timeout and fails explicitly', async () => {
  const fixture = await createFixtureServer()
  const app = await startApp({ NAVIGATION_TIMEOUT_MS: '3000', SCAN_TIMEOUT_MS: '8000' })
  try {
    const started = await startScan(app.baseUrl, `${fixture.baseUrl}/hang`)
    assert.equal(started.status, 202)
    const detail = await pollUntilDone(app.baseUrl, started.body.id, 30000)
    assert.equal(detail.status, 'failed')
    assert.deepEqual(detail.issues, [])
    assert.ok(['NAVIGATION_FAILED', 'SCAN_TIMEOUT'].includes(detail.error.code), `unexpected error: ${JSON.stringify(detail.error)}`)
  } finally {
    fixture.server.close()
    await app.close()
  }
}, { timeout: 60000 })

test('E2E: private targets are refused before any browser launches', async () => {
  const fixture = await createFixtureServer()
  // App with default (secure) config: local targets blocked.
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'accessaudit-e2e-sec-'))
  const config = buildConfig({ DATA_DIR: dataDir, ALLOW_LOCAL_TARGETS: 'false' })
  const store = new ScanStore(config.dataDir)
  await store.init()
  const scanner = createScanner(config)
  const app = createApp({ store, config, scanner })
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`
  try {
    const started = await startScan(baseUrl, `${fixture.baseUrl}/inaccessible.html`)
    assert.equal(started.status, 403)
    assert.equal(started.body.error.code, 'BLOCKED_TARGET')
    assert.equal(store.count(), 0, 'blocked targets must not create scan records')
  } finally {
    fixture.server.close()
    await new Promise((resolve) => server.close(resolve))
  }
})

