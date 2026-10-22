// Tests for the real API client. Run with: npm test (node --test src/api/)
// Network access is mocked via globalThis.fetch — these tests verify request
// construction, response parsing and that failures throw honest errors
// instead of silently returning fake data.

import test from 'node:test'
import assert from 'node:assert/strict'

import { getDashboard, getHistory, getReports, getScan, getLatestScan, startScan, ApiError } from './client.js'

const realFetch = globalThis.fetch

function mockFetch(handler) {
  const calls = []
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    return handler(String(url), options)
  }
  return calls
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

test.afterEach(() => {
  globalThis.fetch = realFetch
})

test('startScan POSTs the URL to /api/scans and returns the created record', async () => {
  const created = { id: 'abc-123', url: 'https://example.com', status: 'scanning', date: '2026-01-01T00:00:00.000Z' }
  const calls = mockFetch(async () => jsonResponse(created, 202))

  const result = await startScan('https://example.com')

  assert.equal(calls.length, 1)
  assert.ok(calls[0].url.endsWith('/api/scans'))
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(calls[0].options.body), { url: 'https://example.com' })
  assert.deepEqual(result, created)
})

test('getScan requests /api/scans/:id and returns the scan detail', async () => {
  const detail = { id: 'abc-123', url: 'https://example.com', date: '2026-01-01T00:00:00.000Z', status: 'completed', issues: [] }
  const calls = mockFetch(async () => jsonResponse(detail))

  const result = await getScan('abc-123')

  assert.ok(calls[0].url.endsWith('/api/scans/abc-123'))
  assert.equal(calls[0].options.method, 'GET')
  assert.deepEqual(result, detail)
})

test('getScan returns null when the scan does not exist (404)', async () => {
  mockFetch(async () => jsonResponse({ error: { code: 'NOT_FOUND', message: 'Scan not found.' } }, 404))
  assert.equal(await getScan('missing'), null)
})

test('getLatestScan returns null when the backend reports no scans', async () => {
  mockFetch(async () => jsonResponse(null))
  assert.equal(await getLatestScan(), null)
})

test('getHistory, getReports and getDashboard return parsed JSON', async () => {
  mockFetch(async (url) => {
    if (url.endsWith('/api/scans')) return jsonResponse([{ id: '1' }])
    if (url.endsWith('/api/reports')) return jsonResponse([{ id: '1', title: 'Report' }])
    return jsonResponse({ stats: { totalScans: 1 }, scansOverTime: [], severity: [], recentScans: [] })
  })
  assert.deepEqual(await getHistory(), [{ id: '1' }])
  assert.deepEqual(await getReports(), [{ id: '1', title: 'Report' }])
  assert.equal((await getDashboard()).stats.totalScans, 1)
})

test('HTTP errors throw ApiError with the backend message — never fake data', async () => {
  mockFetch(async () => jsonResponse({ error: { code: 'BLOCKED_TARGET', message: 'The URL points to a private or internal network address, which cannot be scanned.' } }, 403))

  await assert.rejects(
    () => startScan('http://127.0.0.1'),
    (err) => err instanceof ApiError && err.status === 403 && err.code === 'BLOCKED_TARGET' && err.message.includes('private or internal'),
  )
})

test('network failures throw an honest "could not reach" error', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(
    () => getDashboard(),
    (err) => err instanceof ApiError && /could not reach/i.test(err.message),
  )
})

test('timeouts throw an honest timeout error', async () => {
  globalThis.fetch = async () => {
    const err = new Error('aborted')
    err.name = 'AbortError'
    throw err
  }
  await assert.rejects(
    () => getHistory(),
    (err) => err instanceof ApiError && /timed out/i.test(err.message),
  )
})

test('invalid JSON in a 200 response throws instead of returning garbage', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => '<html>not json</html>' })
  await assert.rejects(
    () => getReports(),
    (err) => err instanceof ApiError && /invalid response/i.test(err.message),
  )
})
