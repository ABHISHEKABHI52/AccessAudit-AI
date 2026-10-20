import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileText } from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui/Common'
import { useReportsData } from '../hooks/useScanData'
import ReportPreview from '../features/reports/ReportPreview'

function formatDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Reports() {
  const { status, data, retry } = useReportsData()
  const [open, setOpen] = useState(null) // report being previewed
  const reports = data ?? []

  return (
    <>
      <PageHeader title="Reports" text="Preview and export reports of your scans." />

      <Card aria-label="Reports list">
        {status === 'loading' ? (
          <div role="status" className="space-y-4 p-5">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            <span className="sr-only">Loading reports</span>
          </div>
        ) : status === 'error' ? (
          <ErrorState onRetry={retry} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            text="Reports are created from completed scans."
            action={<Button as={Link} to="/scan">Start a scan</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                    <FileText size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{r.title}</p>
                    <p className="break-all text-sm text-muted">
                      {r.url}{r.date ? ` · ${formatDate(r.date)}` : ''}
                    </p>
                  </div>
                </div>
                <Button type="button" onClick={() => setOpen(r)}>
                  <Eye size={16} aria-hidden="true" /> Preview &amp; Export
                  <span className="sr-only"> {r.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && <ReportPreview reportId={open.id} title={open.title} onClose={() => setOpen(null)} />}
    </>
  )
}