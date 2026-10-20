import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Search } from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, EmptyState, PageHeader } from '../components/ui/Common'
import { useHistoryData } from '../hooks/useScanData'
import ScansTable from '../features/dashboard/ScansTable'

export default function History() {
  const { status, data, retry } = useHistoryData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const scans = data ?? []
  const filtered = scans.filter(
    (s) =>
      (filter === 'all' || s.status === filter) &&
      s.url.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const empty =
    scans.length === 0 ? (
      <EmptyState
        icon={Clock}
        title="No scan history yet"
        text="Scans you run will be listed here."
        action={<Button as={Link} to="/scan">Start a scan</Button>}
      />
    ) : (
      <EmptyState icon={Search} title="No matching scans" text="Try a different search or filter." />
    )

  return (
    <>
      <PageHeader title="Scan History" text="All your previous scans." />

      <Card aria-label="Scan history list">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="history-search" className="mb-1.5 block text-sm font-semibold text-ink">
              Search
            </label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="history-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by website"
                className="w-full rounded-lg border border-control bg-surface py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted-soft"
              />
            </div>
          </div>

          <div>
            <label htmlFor="history-status" className="mb-1.5 block text-sm font-semibold text-ink">
              Status
            </label>
            <select
              id="history-status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-control bg-surface px-3 py-2.5 text-sm text-ink sm:w-44"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="scanning">Scanning</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <p aria-live="polite" className="px-5 pb-2 text-sm text-muted">
          {status === 'success' && scans.length > 0 && `${filtered.length} of ${scans.length} scans`}
        </p>

        <ScansTable caption="Scan history" scans={filtered} status={status} onRetry={retry} empty={empty} />
      </Card>
    </>
  )
}