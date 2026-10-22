'use strict'

/*
 * Accessibility scan service: launches a controlled headless Chromium through
 * Playwright, navigates to the target with a bounded timeout, injects axe-core,
 * and returns normalized results. Every request the page makes is filtered
 * through the SSRF guard (see urlGuard.js). Browser resources are always
 * closed, and failures produce explicit error codes — never fabricated results.
 */

const { chromium } = require('playwright')
const axeCore = require('axe-core')
const { resolveTarget, isUrlAllowedForBrowser, GuardError } = require('./urlGuard')
const { mapAxeResults } = require('./axeMapper')

const USER_AGENT = 'AccessAuditAI/1.0 (+accessibility scanner; contact: site owner)'

class ScanError extends Error {
  constructor(code, message, cause) {
    super(message)
    this.name = 'ScanError'
    this.code = code
    if (cause) this.cause = cause
  }
}

class Semaphore {
  constructor(limit) {
    this.limit = limit
    this.active = 0
    this.waiting = []
  }

  acquire() {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (this.active < this.limit) {
          this.active += 1
          resolve()
        } else {
          this.waiting.push(tryAcquire)
        }
      }
      tryAcquire()
    })
  }

  release() {
    this.active -= 1
    const next = this.waiting.shift()
    if (next) next()
  }
}

/** Short, safe error text (no stack traces) for storage and API responses. */
function safeErrorMessage(err) {
  const firstLine = String(err?.message ?? err ?? 'Unknown error').split('\n')[0]
  return firstLine.length > 200 ? `${firstLine.slice(0, 199)}…` : firstLine
}

function createScanner(config) {
  const semaphore = new Semaphore(config.maxConcurrentScans)

  async function scanInBrowser(url, currentBrowser) {
    // Re-resolve the target right before launch to shrink the DNS rebinding window.
    try {
      await resolveTarget(url, { allowLocal: config.allowLocalTargets })
    } catch (err) {
      if (err instanceof GuardError) throw new ScanError(err.code, err.message, err)
      throw new ScanError('TARGET_UNRESOLVED', safeErrorMessage(err), err)
    }

    currentBrowser.browser = await chromium.launch({ headless: true })
    const browser = currentBrowser.browser

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 900 },
      javaScriptEnabled: true,
      bypassCSP: false,
      ignoreHTTPSErrors: false,
    })

    // Restrict the browser's network access: non-http(s) schemes, internal
    // hostnames and private IP literals are aborted. Playwright routes also
    // cover redirects, so redirect destinations are revalidated too.
    await context.route('**/*', async (route) => {
      const requestUrl = route.request().url()
      try {
        const allowed = await isUrlAllowedForBrowser(requestUrl, { allowLocal: config.allowLocalTargets })
        return allowed ? route.continue() : route.abort('blockedbyclient')
      } catch {
        return route.abort('failed')
      }
    })

    const page = await context.newPage()
    page.setDefaultNavigationTimeout(config.navigationTimeoutMs)
    page.setDefaultTimeout(config.navigationTimeoutMs)

    let response
    try {
      // domcontentloaded keeps us bounded; we never wait for networkidle,
      // which can hang forever on pages with continuous background traffic.
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: config.navigationTimeoutMs })
      // Give scripts a short window to reach a usable DOM before auditing.
      await page
        .waitForLoadState('load', { timeout: Math.min(5000, config.navigationTimeoutMs) })
        .catch(() => {})
    } catch (err) {
      throw new ScanError('NAVIGATION_FAILED', `The page could not be loaded: ${safeErrorMessage(err)}`, err)
    }

    if (!response) {
      throw new ScanError('NAVIGATION_FAILED', 'The page did not return a response.')
    }
    // Note: even a 200 response does not guarantee the page fully rendered; we
    // still run the audit on the DOM that actually exists and record httpStatus.

    await page.addScriptTag({ content: axeCore.source })

    let axeResults
    try {
      axeResults = await page.evaluate(async () => {
        if (typeof window.axe === 'undefined') throw new Error('axe-core was not injected')
        return window.axe.run(document, { resultTypes: ['violations', 'incomplete', 'passes'] })
      })
    } catch (err) {
      throw new ScanError('AUDIT_FAILED', `The accessibility audit could not run: ${safeErrorMessage(err)}`, err)
    }

    const mapped = mapAxeResults(axeResults)
    return { ...mapped, httpStatus: response.status(), finalUrl: page.url() }
  }

  /**
   * Runs one full scan with concurrency limiting and an overall timeout.
   * Resolves with the mapped result or rejects with a ScanError.
   */
  async function runScan({ url }) {
    await semaphore.acquire()
    const currentBrowser = { browser: null }
    try {
      const scanPromise = scanInBrowser(url, currentBrowser)
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          if (currentBrowser.browser) currentBrowser.browser.close().catch(() => {})
          reject(new ScanError('SCAN_TIMEOUT', `The scan exceeded the ${Math.round(config.scanTimeoutMs / 1000)}s time limit and was stopped.`))
        }, config.scanTimeoutMs)
        scanPromise.finally(() => clearTimeout(timer)).catch(() => {})
      })
      return await Promise.race([scanPromise, timeoutPromise])
    } finally {
      semaphore.release()
      if (currentBrowser.browser) await currentBrowser.browser.close().catch(() => {})
    }
  }

  function getMetrics() {
    return { active: semaphore.active, queued: semaphore.waiting.length }
  }

  return { runScan, getMetrics }
}

module.exports = { createScanner, ScanError }
