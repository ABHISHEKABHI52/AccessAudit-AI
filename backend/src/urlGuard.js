'use strict'

/*
 * URL security guard (SSRF protection).
 *
 * The scanner must never be usable as an open proxy into internal networks or
 * cloud metadata services. Every scan target is validated before a browser is
 * launched, and every request the scanned page makes is re-validated inside the
 * browser session (protocol + hostname + resolved addresses).
 *
 * Documented limitation: DNS results are cached for 60s, so a hostname that
 * changes its DNS answer between the pre-check and the browser request
 * (classic DNS rebinding) has a reduced but non-zero window. Resolution of a
 * request that times out is treated as unsafe for subresources.
 */

const dns = require('node:dns').promises
const net = require('node:net')

const DNS_CACHE_TTL_MS = 60000
const DNS_CACHE_MAX = 500
const DNS_LOOKUP_TIMEOUT_MS = 5000

class GuardError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'GuardError'
    this.code = code
  }
}

function normalizeHostname(hostname) {
  let h = String(hostname || '').trim().toLowerCase()
  if (h.endsWith('.')) h = h.slice(0, -1)
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1)
  return h
}

function isBlockedIPv4(ip) {
  const parts = ip.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = parts
  if (a === 0) return true
  if (a === 10) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 0) return true
  if (a === 192 && b === 168) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a >= 224) return true // multicast + reserved + broadcast
  return false
}

function isBlockedIPv6(ip) {
  const addr = ip.toLowerCase().split('%')[0]
  if (addr === '::' || addr === '::1') return true
  if (addr.startsWith('::ffff:')) {
    const v4 = addr.slice('::ffff:'.length)
    if (net.isIPv4(v4)) return isBlockedIPv4(v4)
    return true // other IPv4-mapped forms treated as unsafe
  }
  const firstGroup = parseInt(addr.split(':')[0] || '0', 16)
  if (Number.isNaN(firstGroup)) return true
  if ((firstGroup & 0xfe00) === 0xfc00) return true // fc00::/7 unique local
  if ((firstGroup & 0xffc0) === 0xfe80) return true // fe80::/10 link local
  if ((firstGroup & 0xffc0) === 0xfec0) return true // fec0::/10 site local
  return false
}

function isLoopbackIp(ip) {
  if (net.isIPv4(ip)) return ip.startsWith('127.')
  if (net.isIPv6(ip)) {
    const addr = ip.toLowerCase().split('%')[0]
    return addr === '::1' || addr.startsWith('::ffff:127.')
  }
  return false
}

function isBlockedIpLiteral(host) {
  if (net.isIPv4(host)) return isBlockedIPv4(host)
  if (net.isIPv6(host)) return isBlockedIPv6(host)
  return false
}

const BLOCKED_HOSTNAME_SUFFIXES = ['.local', '.internal', '.home.arpa', '.lan', '.localhost']
const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata', 'metadata.google.internal'])

function assertHostnameAllowed(hostname, { allowLocal = false } = {}) {
  const host = normalizeHostname(hostname)

  if (net.isIP(host)) {
    if (allowLocal && isLoopbackIp(host)) return
    if (isBlockedIpLiteral(host)) {
      throw new GuardError('BLOCKED_TARGET', 'The URL points to a private or internal network address, which cannot be scanned.')
    }
    return
  }

  if (host === 'localhost' || host.endsWith('.localhost')) {
    if (allowLocal) return
    throw new GuardError('BLOCKED_TARGET', 'The URL points to a private or internal network address, which cannot be scanned.')
  }

  if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new GuardError('BLOCKED_TARGET', 'The URL points to a private or internal network address, which cannot be scanned.')
  }

  if (!host.includes('.')) {
    // Single-label names ("intranet", "router", ...) almost always refer to internal hosts.
    throw new GuardError('BLOCKED_TARGET', 'Single-label hostnames are not allowed.')
  }
}

/**
 * Parse and validate a user-supplied scan target. Synchronous checks only
 * (protocol, credentials, hostname blocklist). Call resolveTarget afterwards
 * for the DNS check.
 */
function parseScanTarget(raw, opts = {}) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new GuardError('INVALID_URL', 'A URL is required.')
  }
  let url
  try {
    url = new URL(raw.trim())
  } catch {
    throw new GuardError('INVALID_URL', 'The URL could not be parsed.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new GuardError('UNSUPPORTED_PROTOCOL', 'Only http:// and https:// URLs can be scanned.')
  }
  if (url.username || url.password) {
    throw new GuardError('INVALID_URL', 'URLs with embedded credentials are not allowed.')
  }
  const host = normalizeHostname(url.hostname)
  if (!host) {
    throw new GuardError('INVALID_URL', 'The URL must include a hostname.')
  }
  assertHostnameAllowed(host, opts)
  return url
}

const dnsCache = new Map() // hostname -> { expiresAt, addresses }

async function lookupCached(hostname) {
  const now = Date.now()
  const hit = dnsCache.get(hostname)
  if (hit && hit.expiresAt > now) return hit.addresses

  const addresses = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('DNS lookup timed out')), DNS_LOOKUP_TIMEOUT_MS)
    dns.lookup(hostname, { all: true }).then(
      (result) => { clearTimeout(timer); resolve(result.map((r) => r.address)) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })

  if (dnsCache.size >= DNS_CACHE_MAX) dnsCache.clear()
  dnsCache.set(hostname, { expiresAt: now + DNS_CACHE_TTL_MS, addresses })
  return addresses
}

/**
 * Full target validation: synchronous checks plus a DNS resolution check so a
 * public-looking hostname that resolves to a private address is rejected.
 */
async function resolveTarget(raw, opts = {}) {
  const url = parseScanTarget(raw, opts)
  const host = normalizeHostname(url.hostname)

  if (net.isIP(host)) return url // literal addresses already validated above

  let addresses
  try {
    addresses = await lookupCached(host)
  } catch (err) {
    throw new GuardError('TARGET_UNRESOLVED', `The hostname "${host}" could not be resolved (${err.message}).`)
  }

  for (const address of addresses) {
    if (opts.allowLocal && isLoopbackIp(address)) continue
    if (isBlockedIpLiteral(address)) {
      throw new GuardError('BLOCKED_TARGET', 'The hostname resolves to a private or internal network address, which cannot be scanned.')
    }
  }
  return url
}

const DNS_CHECK_TIMEOUT_MS = 3000

/**
 * Per-request check used inside the browser session (initial navigation,
 * redirects and subresources). Returns true only for http(s) URLs whose host
 * is not internal. DNS failures/timeouts for subresources are treated as
 * unsafe (fail closed).
 */
async function isUrlAllowedForBrowser(raw, opts = {}) {
  let url
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (url.username || url.password) return false

  const host = normalizeHostname(url.hostname)
  try {
    assertHostnameAllowed(host, opts)
  } catch {
    return false
  }

  if (net.isIP(host)) return true

  try {
    const addresses = await Promise.race([
      lookupCached(host),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), DNS_CHECK_TIMEOUT_MS)),
    ])
    return addresses.some((address) => {
      if (opts.allowLocal && isLoopbackIp(address)) return true
      return !isBlockedIpLiteral(address)
    })
  } catch {
    return false
  }
}

module.exports = {
  GuardError,
  parseScanTarget,
  resolveTarget,
  isUrlAllowedForBrowser,
  assertHostnameAllowed,
  isBlockedIpLiteral,
  normalizeHostname,
}

