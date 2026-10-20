import { useId } from 'react'
import { Card, ErrorState, Skeleton } from '../../components/ui/Common'
import { SEVERITY } from '../../components/ui/Badges'

const LEVELS = ['critical', 'serious', 'moderate', 'minor']

export default function SeverityDonut({ title = 'Issues by severity', data = [], status = 'success', onRetry, className = '' }) {
  const id = useId()
  const countOf = (level) => data.find((d) => d.level === level)?.count ?? 0
  const total = LEVELS.reduce((sum, l) => sum + countOf(l), 0)
  const hasData = total > 0

  const segments = LEVELS.map((level, index) => {
    const count = countOf(level)
    const pct = hasData ? (count / total) * 100 : 0
    const before = LEVELS.slice(0, index).reduce(
      (sum, l) => sum + (hasData ? (countOf(l) / total) * 100 : 0),
      0,
    )
    return { level, count, pct, offset: 25 - before }
  })

  return (
    <Card aria-labelledby={id} className={`p-5 ${className}`}>
      <h2 id={id} className="text-base font-bold text-ink">{title}</h2>

      {status === 'loading' ? (
        <div role="status" className="mt-4 flex flex-col items-center gap-4">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <span className="sr-only">Loading chart</span>
        </div>
      ) : status === 'error' ? (
        <ErrorState onRetry={onRetry} />
      ) : (
        <div className="mt-4 flex flex-col items-center gap-5">
          <svg viewBox="0 0 42 42" className="h-40 w-40" aria-hidden="true">
            <circle cx="21" cy="21" r="15.9155" fill="none" strokeWidth="6" className="stroke-line" />
            {segments.map(
              ({ level, pct, offset }) =>
                pct > 0 && (
                  <circle
                    key={level}
                    cx="21"
                    cy="21"
                    r="15.9155"
                    fill="none"
                    strokeWidth="6"
                    className={SEVERITY[level].ring}
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeDashoffset={offset}
                  />
                ),
            )}
            <text x="21" y="22.5" textAnchor="middle" className="fill-ink" style={{ fontSize: 7, fontWeight: 800 }}>
              {hasData ? total : '—'}
            </text>
          </svg>

          {!hasData && <p className="text-sm font-medium text-muted">No data yet</p>}

          <ul className="w-full space-y-2">
            {segments.map(({ level, count, pct }) => {
              const { label, icon: Icon, badge } = SEVERITY[level]
              return (
                <li key={level} className="flex items-center justify-between text-sm">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
                    <Icon size={14} aria-hidden="true" /> {label}
                  </span>
                  <span className="font-semibold text-ink">
                    {hasData ? `${count} (${Math.round(pct)}%)` : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}