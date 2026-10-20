import { useId } from 'react'
import { Card, ErrorState, Skeleton } from '../../components/ui/Common'

const W = 600
const H = 260
const pad = { l: 44, r: 12, t: 12, b: 32 }

export default function BarChart({ title, data = [], status = 'success', onRetry, className = '' }) {
  const id = useId()
  const hasData = data.length > 0
  const rawMax = Math.max(...data.map((d) => d.value), 1)
  const max = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const step = iw / Math.max(data.length, 1)
  const bw = Math.min(step * 0.6, 48)
  const labelEvery = Math.ceil(data.length / 12) || 1

  return (
    <Card aria-labelledby={id} className={`p-5 ${className}`}>
      <h2 id={id} className="text-base font-bold text-ink">{title}</h2>

      {status === 'loading' ? (
        <div role="status" className="mt-4">
          <Skeleton className="h-64 w-full" />
          <span className="sr-only">Loading chart</span>
        </div>
      ) : status === 'error' ? (
        <ErrorState onRetry={onRetry} />
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => {
              const y = pad.t + (ih * i) / 4
              return (
                <g key={i}>
                  <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="stroke-line" strokeWidth="1" />
                  {hasData && (
                    <text x={pad.l - 8} y={y + 4} textAnchor="end" className="fill-muted" style={{ fontSize: 11 }}>
                      {Math.round((max * (4 - i)) / 4)}
                    </text>
                  )}
                </g>
              )
            })}

            {data.map((d, i) => {
              const h = (d.value / max) * ih
              const x = pad.l + i * step + (step - bw) / 2
              return (
                <g key={`${d.label}-${i}`}>
                  <rect x={x} y={pad.t + ih - h} width={bw} height={h} rx="4" className="fill-primary" />
                  {i % labelEvery === 0 && (
                    <text x={x + bw / 2} y={H - 10} textAnchor="middle" className="fill-muted" style={{ fontSize: 11 }}>
                      {d.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {!hasData && (
            <p className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted">
              No data yet
            </p>
          )}

          {/* Screen reader ke liye table version */}
          {hasData && (
            <table className="sr-only">
              <caption>{title}</caption>
              <thead>
                <tr><th scope="col">Period</th><th scope="col">Scans</th></tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={`${d.label}-${i}`}><td>{d.label}</td><td>{d.value}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  )
}