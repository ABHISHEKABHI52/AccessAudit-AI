'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const {
  GuardError,
  parseScanTarget,
  assertHostnameAllowed,
  isBlockedIpLiteral,
  normalizeHostname,
} = require('../src/urlGuard')

test('parseScanTarget accepts a valid https URL', () => {
  const url = parseScanTarget('https://example.com/page?q=1')
  assert.equal(url.href, 'https://example.com/page?q=1')
})

test('parseScanTarget rejects missing / malformed URLs', () => {
  for (const bad of [undefined, null, '', '   ', 'not a url', 'example']) {
    assert.throws(() => parseScanTarget(bad), (err) => err instanceof GuardError && err.code === 'INVALID_URL')
  }
})

test('parseScanTarget rejects non-http(s) protocols', () => {
  for (const bad of ['ftp://example.com', 'javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,x']) {
    assert.throws(() => parseScanTarget(bad), (err) => err instanceof GuardError && err.code === 'UNSUPPORTED_PROTOCOL')
  }
})

test('parseScanTarget rejects URLs with embedded credentials', () => {
  assert.throws(() => parseScanTarget('https://user:pass@example.com'), (err) => err.code === 'INVALID_URL')
})

test('parseScanTarget blocks private/internal targets (SSRF)', () => {
  const blocked = [
    'http://localhost:3000',
    'http://sub.localhost',
    'http://127.0.0.1',
    'http://127.8.8.8:8080',
    'http://10.0.0.5',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://192.168.1.10',
    'http://169.254.169.254/latest/meta-data/', // cloud metadata
    'http://100.64.0.1', // CGNAT
    'http://[::1]',
    'http://[fc00::1]',
    'http://[fe80::1]',
    'http://metadata.google.internal/',
    'http://intranet/',
    'http://printer.local/',
  ]
  for (const url of blocked) {
    assert.throws(() => parseScanTarget(url), (err) => err instanceof GuardError && err.code === 'BLOCKED_TARGET', `expected ${url} to be blocked`)
  }
})

test('allowLocal permits loopback but still blocks metadata and other private ranges', () => {
  const opts = { allowLocal: true }
  parseScanTarget('http://127.0.0.1:9999/fixture', opts)
  parseScanTarget('http://localhost:9999/fixture', opts)
  for (const bad of ['http://169.254.169.254/', 'http://10.0.0.5/', 'http://192.168.0.1/']) {
    assert.throws(() => parseScanTarget(bad, opts), (err) => err.code === 'BLOCKED_TARGET')
  }
})

test('isBlockedIpLiteral detects private IPv4 and IPv6 literals', () => {
  assert.equal(isBlockedIpLiteral('8.8.8.8'), false)
  assert.equal(isBlockedIpLiteral('93.184.216.34'), false)
  assert.equal(isBlockedIpLiteral('127.0.0.1'), true)
  assert.equal(isBlockedIpLiteral('169.254.169.254'), true)
  assert.equal(isBlockedIpLiteral('::1'), true)
  assert.equal(isBlockedIpLiteral('::ffff:127.0.0.1'), true)
  assert.equal(isBlockedIpLiteral('2606:4700::1111'), false)
})

test('assertHostnameAllowed rejects single-label and internal suffixes', () => {
  assert.throws(() => assertHostnameAllowed('router'), (err) => err.code === 'BLOCKED_TARGET')
  assert.throws(() => assertHostnameAllowed('db.internal'), (err) => err.code === 'BLOCKED_TARGET')
  assert.throws(() => assertHostnameAllowed('nas.lan'), (err) => err.code === 'BLOCKED_TARGET')
  assert.doesNotThrow(() => assertHostnameAllowed('example.com'))
})

test('normalizeHostname strips brackets, dots and case', () => {
  assert.equal(normalizeHostname('[::1]'), '::1')
  assert.equal(normalizeHostname('Example.COM.'), 'example.com')
})
