'use strict'

/*
 * Backend configuration.
 * All values come from environment variables with safe defaults (see .env.example).
 */

const path = require('node:path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

function intFromEnv(env, name, fallback) {
  const raw = env[name]
  if (raw === undefined || raw === '') return fallback
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function buildConfig(env = process.env) {
  return {
    port: intFromEnv(env, 'PORT', 8000),

    // Where scan records are persisted (JSON file store).
    dataDir: env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(__dirname, '..', 'data'),

    // TEST ONLY. When true, loopback targets (localhost / 127.0.0.1 / ::1) may be
    // scanned. This exists so the automated test suite can scan a controlled local
    // fixture page. Never enable it on a shared or publicly reachable deployment.
    allowLocalTargets: env.ALLOW_LOCAL_TARGETS === 'true',

    // Bounded navigation + whole-scan timeouts so pages with continuous traffic
    // cannot hang a scan forever (we deliberately never wait for networkidle).
    navigationTimeoutMs: intFromEnv(env, 'NAVIGATION_TIMEOUT_MS', 30000),
    scanTimeoutMs: intFromEnv(env, 'SCAN_TIMEOUT_MS', 60000),

    // Resource limits.
    maxConcurrentScans: intFromEnv(env, 'MAX_CONCURRENT_SCANS', 2),
    maxQueueLength: intFromEnv(env, 'MAX_QUEUE_LENGTH', 20),

    // Simple per-IP rate limit for starting new scans.
    rateLimitWindowMs: intFromEnv(env, 'RATE_LIMIT_WINDOW_MS', 60000),
    rateLimitMaxScans: intFromEnv(env, 'RATE_LIMIT_MAX_SCANS', 20),

    // CORS: only the local frontend dev origins are allowed by default.
    allowedOrigins: (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}

module.exports = { buildConfig }
