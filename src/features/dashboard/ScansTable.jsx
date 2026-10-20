import { Link } from 'react-router-dom'
import { ErrorState, Skeleton } from '../../components/ui/Common'
import { StatusBadge } from '../../components/ui/Badges'

function formatDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ScansTable({ scans = [], status = 'success', onRetry, empty, caption = 'Scans' }) {
  if (status === 'error') return <ErrorState onRetry={onRetry} />

  if (status === 'loading') {
    return (
      <div role="status" className="space-y-4 p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
        <span className="sr-only">Loading scans</span>
      </div>
    )
  }

  if (scans.length === 0) return empty ?? null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-5 py-3 font-semibold">Website</th>
            <th scope="col" className="px-5 py-3 font-semibold">Date</th>
            <th scope="col" className="px-5 py-3 font-semibold">Status</th>
            <th scope="col" className="px-5 py-3 font-semibold">Issues</th>
            <th scope="col" className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s) => (
            <tr key={s.id} className="border-b border-line last:border-0">
              <td className="px-5 py-3.5 font-medium text-ink">{s.url}</td>
              <td className="px-5 py-3.5 text-muted">{formatDate(s.date)}</td>
              <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
              <td className="px-5 py-3.5 text-ink">{s.issues ?? '—'}</td>
              <td className="px-5 py-3.5">
                <Link to={`/results/${s.id}`} className="font-semibold text-primary hover:underline">
                  View<span className="sr-only"> results for {s.url}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}