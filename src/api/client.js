// TODO(backend): har function ko real API call se bharo.
// Function ke naam aur return shape wahi rakhna (shape useScanData.js ke upar likha hai).

export async function getDashboard() {
  // return await fetch('/api/dashboard').then((r) => r.json())
  return { stats: null, scansOverTime: [], severity: [], recentScans: [] }
}

export async function getHistory() {
  // return await fetch('/api/scans').then((r) => r.json())
  return []
}

export async function getReports() {
  // return await fetch('/api/reports').then((r) => r.json())
  return []
}

export async function getScan(id) {
  // return await fetch(`/api/scans/${id}`).then((r) => r.json())
  void id
  return null
}

export async function getLatestScan() {
  // return await fetch('/api/scans/latest').then((r) => r.json())
  return null
}

// Naya scan shuru kare, aur { id } return kare
export async function startScan(url) {
  // return await fetch('/api/scans', { method: 'POST', body: JSON.stringify({ url }) }).then((r) => r.json())
  void url
  throw new Error('Backend not connected')
}