'use strict'

/*
 * Express API for AccessAudit AI.
 *
 * Endpoints:
 *   GET  /api/health        service status
 *   POST /api/scans         start a scan   -> { id, url, status: 'scanning', date }
 *   GET  /api/scans         history (newest first)
 *   GET  /api/scans/latest  most recent scan or null
 *   GET  /api/scans/:id     one scan (status + findings when complete)
 *   GET  /api/dashboard     statistics computed from real stored scans
 *   GET  /api/reports       one report per completed scan
 *
 * Error format: { error: { code, message } } — never stack traces.
 */

const express = require('express')
const cors = require('cors')
const { resolveTarget, GuardError } = require('./urlGuard')

const SEVERITY_LEVELS = ['critical', 'serious', 'moderate', 'minor']

function timeAgo(isoDate) {
  const ms = Date.now() - new Date(isoDate).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function listItem(record) {
  return {
    id: record.id,
    url: record.url,
    date: record.date,
    status: record.status,
    issues: record.status === 'completed' ? record.issues.length : null,
  }
}

function detailItem(record) {
  return {
    id: record.id,
    url: record.url,
    date: record.date,
    status: record.status,
    issues: record.status === 'completed' ? record.issues : [],
    completedAt: record.completedAt ?? null,
    error: record.status === 'failed' ? record.error ?? null : null,
  }
}

function createApp({ store, config, scanner }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  const corsOptions = {
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) callback(null, true)
      else callback(null, false)
    },
  }
  app.use(cors(corsOptions))
  app.use(express.json({ limit: '16kb' }))

  app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff')
    next()
  })

  // Simple per-IP rate limit for starting scans.
  const scanStarts = new Map()
  function rateLimitOk(ip) {
    const now = Date.now()
    const recent = (scanStarts.get(ip) ?? []).filter((t) => now - t < config.rateLimitWindowMs)
    if (recent.length >= config.rateLimitMaxScans) {
      scanStarts.set(ip, recent)
      return false
    }
    recent.push(now)
    scanStarts.set(ip, recent)
    return true
  }

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      scansStored: store.count(),
    })
  })

  app.post('/api/scans', async (req, res) => {
    let parsed
    try {
      parsed = await resolveTarget(req.body?.url, { allowLocal: config.allowLocalTargets })
      if (!rateLimitOk(req.ip)) {
        return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many scans started. Please wait a minute and try again.' } })
      }
      const { active, queued } = scanner.getMetrics()
      if (active + queued >= config.maxConcurrentScans + config.maxQueueLength) {
        return res.status(429).json({ error: { code: 'SCAN_QUEUE_FULL', message: 'The scanner is busy right now. Please try again shortly.' } })
      }
    } catch (err) {
      if (err instanceof GuardError) {
        const status = err.code === 'BLOCKED_TARGET' ? 403 : 400
        return res.status(status).json({ error: { code: err.code, message: err.message } })
      }
      console.error('[api] Scan validation failed:', err)
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be processed.' } })
    }

    const now = new Date().toISOString()
    const record = {
      id: store.newId(),
      url: parsed.href,
      date: now,
      status: 'scanning',
      completedAt: null,
      issues: [],
      error: null,
    }
    store.create(record)

    // Run the scan in the background; the request responds immediately.
    scanner
      .runScan({ id: record.id, url: record.url })
      .then((result) => {
        store.update(record.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          issues: result.issues,
          incomplete: result.incomplete,
          passesCount: result.passesCount,
          httpStatus: result.httpStatus,
          finalUrl: result.finalUrl,
          engine: result.engine,
        })
      })
      .catch((err) => {
        console.error(`[scan ${record.id}] Failed: ${err.message}`)
        store.update(record.id, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          issues: [],
          error: { code: err.code ?? 'SCAN_FAILED', message: err.message ?? 'The scan failed.' },
        })
      })

    res.status(202).json({ id: record.id, url: record.url, status: 'scanning', date: record.date })
  })

  app.get('/api/scans', (req, res) => {
    res.json(store.list().map(listItem))
  })

  // NOTE: /latest must be registered before /:id.
  app.get('/api/scans/latest', (req, res) => {
    const latest = store.list()[0] ?? null
    res.json(latest ? detailItem(latest) : null)
  })

  app.get('/api/scans/:id', (req, res) => {
    const record = store.get(req.params.id)
    if (!record) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Scan not found.' } })
    return res.json(detailItem(record))
  })

  app.get('/api/dashboard', (req, res) => {
    const scans = store.list()

    // "Open issues" = findings of the latest completed scan per website.
    const latestCompletedByUrl = new Map()
    for (const scan of scans) {
      if (scan.status === 'completed' && !latestCompletedByUrl.has(scan.url)) latestCompletedByUrl.set(scan.url, scan)
    }
    const open = [...latestCompletedByUrl.values()].flatMap((scan) => scan.issues)
    const countBy = (level) => open.filter((issue) => issue.severity === level).length

    // Scans over the last 6 calendar months, from real stored scans only.
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i), 1)
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), value: 0 }
    })
    for (const scan of scans) {
      const d = new Date(scan.date)
      const month = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
      if (month) month.value += 1
    }

    res.json({
      stats: {
        totalScans: scans.length,
        openIssues: open.length,
        criticalSerious: countBy('critical') + countBy('serious'),
        lastScan: scans[0] ? timeAgo(scans[0].date) : null,
      },
      scansOverTime: months.map(({ label, value }) => ({ label, value })),
      severity: SEVERITY_LEVELS.map((level) => ({ level, count: countBy(level) })),
      recentScans: scans.slice(0, 5).map(listItem),
    })
  })

  app.get('/api/reports', (req, res) => {
    const reports = store
      .list()
      .filter((scan) => scan.status === 'completed')
      .map((scan) => ({
        id: scan.id,
        title: `Accessibility report: ${scan.url}`,
        url: scan.url,
        date: scan.date,
      }))
    res.json(reports)
  })

  app.use('/api', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } })
  })

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } })
    }
    console.error('[api] Unhandled error:', err)
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error.' } })
  })

  return app
}

module.exports = { createApp }

