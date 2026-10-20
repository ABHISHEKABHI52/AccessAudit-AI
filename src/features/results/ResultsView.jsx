import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ListChecks, Search, Wrench } from 'lucide-react'
import Button from '../../components/ui/Button'
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/ui/Common'
import { SEVERITY, SeverityBadge, StatusBadge } from '../../components/ui/Badges'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import IssueDetail from './IssueDetail'

const ORDER = ['critical', 'serious', 'moderate', 'minor']

function formatDate(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ResultsView({ mode = 'results', scan, status, onRetry }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isFix = mode === 'fix'
  const title = isFix ? 'Fix Assistant' : 'Scan Results'
  const subtitle = isFix
    ? 'Pick an issue to see why it matters and how to fix it.'
    : 'Findings from your accessibility scan.'

  const issues = useMemo(
    () => [...(scan?.issues ?? [])].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity)),
    [scan],
  )

  const counts = useMemo(() => {
    const c = { critical: 0, serious: 0, moderate: 0, minor: 0 }
    issues.forEach((i) => {
      if (c[i.severity] !== undefined) c[i.severity] += 1
    })
    return c
  }, [issues])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return issues.filter(
      (i) =>
        (level === 'all' || i.severity === level) &&
        (!q ||
          [i.description, i.ruleId, i.wcagCriterion, i.selector]
            .filter(Boolean)
            .some((t) => t.toLowerCase().includes(q))),
    )
  }, [issues, query, level])

  const selected =
    filtered.find((i) => i.id === selectedId) ?? (isFix && isDesktop ? filtered[0] : null) ?? null

  function pick(id) {
    setSelectedId(id)
    if (!isDesktop) setDialogOpen(true)
  }

  /* ---------- non-ready states ---------- */
  const header = <PageHeader title={title} text={subtitle} />

  if (status === 'loading') {
    return (
      <>
        {header}
        <Card className="p-5">
          <div role="status" className="space-y-4">
            <Skeleton className="h-6 w-60" />
            <div className="grid gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            <span className="sr-only">Loading scan results</span>
          </div>
        </Card>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        {header}
        <Card><ErrorState message="We could not load this scan." onRetry={onRetry} /></Card>
      </>
    )
  }

  if (!scan) {
    return (
      <>
        {header}
        <Card>
          <EmptyState
            icon={ListChecks}
            title="No scan data yet"
            text="Run a scan and its findings will appear here."
            action={<Button as={Link} to="/scan">Start a scan</Button>}
          />
        </Card>
      </>
    )
  }

  if (scan.status === 'scanning') {
    return (
      <>
        {header}
        <Card className="p-8 text-center">
          <div role="status">
            <p className="text-lg font-bold text-ink">Scanning {scan.url}</p>
            <p className="mt-1 text-muted">This can take a moment. Results will appear automatically.</p>
            <div className="mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        </Card>
      </>
    )
  }

  if (scan.status === 'failed') {
    return (
      <>
        {header}
        <Card>
          <ErrorState message={`The scan of ${scan.url} failed. Please try again.`} onRetry={onRetry} />
        </Card>
      </>
    )
  }

  /* ---------- ready ---------- */
  return (
    <>
      {header}

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="break-all text-lg font-bold text-ink">{scan.url}</p>
            <p className="text-sm text-muted">{formatDate(scan.date)}</p>
          </div>
          <StatusBadge status={scan.status} />
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ORDER.map((l) => {
            const { label, icon: Icon, badge } = SEVERITY[l]
            return (
              <li key={l} className={`rounded-xl p-3 ${badge}`}>
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                  <Icon size={14} aria-hidden="true" /> {label}
                </p>
                <p className="mt-1 text-2xl font-extrabold">{counts[l]}</p>
              </li>
            )
          })}
        </ul>
      </Card>

      {issues.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title="No issues found"
            text="The scan did not report any accessibility issues. Manual testing is still recommended."
          />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card aria-label="Issues list">
            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="issue-search" className="mb-1.5 block text-sm font-semibold text-ink">
                  Search issues
                </label>
                <div className="relative">
                  <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    id="issue-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rule, WCAG criterion or selector"
                    className="w-full rounded-lg border border-control bg-surface py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-muted-soft"
                  />
                </div>
              </div>

              <div role="group" aria-label="Filter by severity" className="flex flex-wrap gap-2">
                {[{ key: 'all', label: 'All', count: issues.length }, ...ORDER.map((l) => ({ key: l, label: SEVERITY[l].label, count: counts[l] }))].map(
                  (f) => (
                    <button
                      key={f.key}
                      type="button"
                      aria-pressed={level === f.key}
                      onClick={() => setLevel(f.key)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                        level === f.key
                          ? 'border-primary bg-primary text-white'
                          : 'border-control bg-surface text-ink hover:bg-subtle'
                      }`}
                    >
                      {f.label} ({f.count})
                    </button>
                  ),
                )}
              </div>

              <p aria-live="polite" className="text-sm text-muted">
                Showing {filtered.length} of {issues.length} issues
              </p>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon={Search} title="No matching issues" text="Try a different search or filter." />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {filtered.map((issue) => {
                  const active = selected?.id === issue.id
                  return (
                    <li key={issue.id}>
                      <button
                        type="button"
                        onClick={() => pick(issue.id)}
                        aria-current={active ? 'true' : undefined}
                        className={`block w-full px-5 py-4 text-left transition-colors ${
                          active ? 'bg-blue-50' : 'hover:bg-subtle'
                        }`}
                      >
                        <SeverityBadge level={issue.severity} />
                        <p className="mt-2 font-semibold text-ink">{issue.description}</p>
                        <p className="mt-1 text-sm text-muted">
                          {[issue.wcagCriterion, issue.ruleId].filter(Boolean).join(' · ')}
                        </p>
                        {issue.selector && (
                          <p className="mt-1 truncate font-mono text-xs text-muted">{issue.selector}</p>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          {isDesktop && (
            <Card aria-label="Issue details" className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {selected ? (
                <IssueDetail issue={selected} />
              ) : (
                <EmptyState
                  icon={Wrench}
                  title="Select an issue"
                  text="Choose an issue from the list to see the explanation and suggested fix."
                />
              )}
            </Card>
          )}
        </div>
      )}

      {/* Mobile / tablet: full-screen details */}
      {!isDesktop && dialogOpen && selected && (
        <MobileDialog onClose={() => setDialogOpen(false)}>
          <IssueDetail issue={selected} onClose={() => setDialogOpen(false)} />
        </MobileDialog>
      )}
    </>
  )
}

function MobileDialog({ children, onClose }) {
  useEscape(onClose)
  return (
    <div role="dialog" aria-modal="true" aria-label="Issue details" className="fixed inset-0 z-50 overflow-y-auto bg-surface">
      {children}
    </div>
  )
}

import { useEffect } from 'react'
function useEscape(handler) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && handler()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handler])
}