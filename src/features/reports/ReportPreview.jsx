import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, Printer, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { ErrorState, Skeleton } from '../../components/ui/Common'
import { SEVERITY, SeverityBadge } from '../../components/ui/Badges'
import { useScan } from '../../hooks/useScanData'

const ORDER = ['critical', 'serious', 'moderate', 'minor']

function formatDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString()
}

export default function ReportPreview({ reportId, title, onClose }) {
  const { status, data: scan, retry } = useScan(reportId)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const issues = [...(scan?.issues ?? [])].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity),
  )
  const count = (l) => issues.filter((i) => i.severity === l).length

  function downloadJson() {
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `accessaudit-report-${scan.id}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMessage('Report downloaded as JSON.')
  }

  return createPortal(
    <div className="print-root fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Report preview: ${title}`}
        className="report-panel mx-auto max-w-4xl rounded-2xl bg-surface shadow-xl"
      >
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="text-lg font-bold text-ink">Report preview</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={status !== 'success' || !scan} onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Print / Save as PDF
            </Button>
            <Button type="button" disabled={status !== 'success' || !scan} onClick={downloadJson}>
              <Download size={16} aria-hidden="true" /> Download JSON
            </Button>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close report preview"
              className="rounded-lg p-2 text-ink hover:bg-subtle"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
        </div>

        <p role="status" className="no-print px-4 pt-2 text-sm text-success">{message}</p>

        <div className="p-6 sm:p-8">
          {status === 'loading' ? (
            <div role="status" className="space-y-4">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-32 w-full" />
              <span className="sr-only">Loading report</span>
            </div>
          ) : status === 'error' ? (
            <ErrorState message="We could not load this report." onRetry={retry} />
          ) : !scan ? (
            <p className="text-muted">Report data is not available.</p>
          ) : (
            <article>
              <h1 className="text-2xl font-extrabold text-ink">Accessibility report</h1>
              <p className="mt-1 break-all text-lg font-semibold text-ink">{scan.url}</p>
              <p className="text-sm text-muted">Scanned on {formatDate(scan.date)}</p>

              <h2 className="mt-8 text-base font-bold text-ink">Summary</h2>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <li className="rounded-xl border border-line p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">Total</p>
                  <p className="mt-1 text-2xl font-extrabold text-ink">{issues.length}</p>
                </li>
                {ORDER.map((l) => {
                  const { label, icon: Icon, badge } = SEVERITY[l]
                  return (
                    <li key={l} className={`rounded-xl p-3 ${badge}`}>
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                        <Icon size={14} aria-hidden="true" /> {label}
                      </p>
                      <p className="mt-1 text-2xl font-extrabold">{count(l)}</p>
                    </li>
                  )
                })}
              </ul>

              <h2 className="mt-8 text-base font-bold text-ink">Findings</h2>
              {issues.length === 0 ? (
                <p className="mt-2 text-muted">No issues were reported for this scan.</p>
              ) : (
                <ol className="mt-3 space-y-4">
                  {issues.map((i, n) => (
                    <li key={i.id} className="break-inside-avoid rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink">{n + 1}.</span>
                        <SeverityBadge level={i.severity} />
                        <span className="font-semibold text-ink">{i.description}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {[i.wcagCriterion, i.ruleId].filter(Boolean).join(' · ')}
                      </p>
                      {i.selector && <p className="mt-1 break-all font-mono text-xs text-muted">{i.selector}</p>}
                      {i.fix?.explanation && (
                        <p className="mt-2 text-sm text-ink">
                          <strong>Suggested fix:</strong> {i.fix.explanation}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </article>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}