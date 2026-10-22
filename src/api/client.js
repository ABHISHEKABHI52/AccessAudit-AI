// Real API client for the AccessAudit backend (see backend/).
// Base URL comes from VITE_API_BASE_URL (see .env.example); default matches
// the backend's default port. No mock data, no silent fallbacks: failures
// throw with an honest message that the UI surfaces to the user.

const BASE_URL = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')
const DEFAULT_TIMEOUT_MS = 20000
const START_SCAN_TIMEOUT_MS = 30000

export class ApiError extends Error {
  constructor(message, { status = null, code = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request(path, { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.')
    }
    throw new ApiError('Could not reach the AccessAudit backend. Please check that the backend server is running.')
  } finally {
    clearTimeout(timer)
  }

  const text = await response.text().catch(() => '')
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (response.ok) throw new ApiError('Received an invalid response from the server.')
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || `Request failed (status ${response.status}).`
    throw new ApiError(message, { status: response.status, code: data?.error?.code ?? null })
  }

  return data
}

export async function getDashboard() {
  return (await request('/api/dashboard')) ?? { stats: null, scansOverTime: [], severity: [], recentScans: [] }
}

export async function getHistory() {
  return (await request('/api/scans')) ?? []
}

export async function getReports() {
  return (await request('/api/reports')) ?? []
}

/** Returns the scan detail, or null when the scan does not exist. */
export async function getScan(id) {
  try {
    return (await request(`/api/scans/${encodeURIComponent(id)}`)) ?? null
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

/** Returns the most recent scan detail, or null when no scans exist yet. */
export async function getLatestScan() {
  return (await request('/api/scans/latest')) ?? null
}

/** Starts a scan and returns the created record: { id, url, status, date }. */
export async function startScan(url) {
  return await request('/api/scans', { method: 'POST', body: { url }, timeoutMs: START_SCAN_TIMEOUT_MS })
}
