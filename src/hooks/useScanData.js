import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

/* ============================================================
   DATA SHAPES (backend ko bas yahi shape dena hai)

   Dashboard:
   {
     stats: { totalScans, openIssues, criticalSerious, lastScan } | null,
     scansOverTime: [{ label: 'Jan', value: 12 }, ...],
     severity: [{ level: 'critical'|'serious'|'moderate'|'minor', count }],
     recentScans: Scan[]
   }

   Scan (list item):
   { id, url, date (ISO string), status: 'completed'|'scanning'|'failed', issues: number }

   ScanDetail (Results, Fix Assistant, Report preview):
   {
     id, url, date, status,
     issues: [{
       id, ruleId, severity, wcagCriterion, description,
       affectedUsers, element, selector,
       fix: { explanation, before, after }
     }]
   }

   Report (list item): { id (same as scan id), title, url, date }

   API functions: src/api/client.js (real) | src/mock/mockApi.js (fake)
   ============================================================ */

// Scan "scanning" ho to har 1.5 sec mein dobara check karo
const isScanning = (data) => data?.status === 'scanning'
const noPoll = () => false

function useAsync(fetcher, shouldPoll = noPoll) {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    let timer
    fetcher()
      .then((data) => {
        if (!active) return
        setState({ status: 'success', data })
        if (shouldPoll(data)) timer = setTimeout(() => setTick((t) => t + 1), 1500)
      })
      .catch(() => active && setState({ status: 'error', data: null }))
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [fetcher, shouldPoll, tick])

  const retry = () => {
    setState({ status: 'loading', data: null })
    setTick((t) => t + 1)
  }

  return { ...state, retry }
}

export const useDashboardData = () => useAsync(api.getDashboard)
export const useHistoryData = () => useAsync(api.getHistory)
export const useReportsData = () => useAsync(api.getReports)
export const useLatestScan = () => useAsync(api.getLatestScan, isScanning)

export function useScan(id) {
  const fetcher = useCallback(() => api.getScan(id), [id])
  return useAsync(fetcher, isScanning)
}