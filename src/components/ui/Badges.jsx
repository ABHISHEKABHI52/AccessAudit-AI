import { Ban, Triangle, Diamond, Circle, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

// eslint-disable-next-line react-refresh/only-export-components
export const SEVERITY = {
  critical: { label: 'Critical', icon: Ban, badge: 'bg-critical-bg text-critical', ring: 'stroke-critical' },
  serious: { label: 'Serious', icon: Triangle, badge: 'bg-serious-bg text-serious', ring: 'stroke-serious' },
  moderate: { label: 'Moderate', icon: Diamond, badge: 'bg-moderate-bg text-moderate', ring: 'stroke-moderate' },
  minor: { label: 'Minor', icon: Circle, badge: 'bg-minor-bg text-minor', ring: 'stroke-minor' },
}

const STATUS = {
  completed: { label: 'Completed', icon: CheckCircle2, badge: 'bg-success-bg text-success' },
  scanning: { label: 'Scanning', icon: Loader2, badge: 'bg-blue-50 text-primary-dark', spin: true },
  failed: { label: 'Failed', icon: AlertCircle, badge: 'bg-critical-bg text-critical' },
}

function Badge({ meta, label }) {
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}>
      <Icon size={14} className={meta.spin ? 'animate-spin' : ''} aria-hidden="true" />
      {label ?? meta.label}
    </span>
  )
}

export function SeverityBadge({ level }) {
  const meta = SEVERITY[level]
  return meta ? <Badge meta={meta} /> : null
}

export function StatusBadge({ status }) {
  const meta = STATUS[status]
  return meta ? <Badge meta={meta} /> : <span className="text-sm text-muted">{status}</span>
}