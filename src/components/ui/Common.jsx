import { AlertCircle, RotateCw } from 'lucide-react'
import Button from './Button'

export function Card({ className = '', children, ...props }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface shadow-card ${className}`} {...props}>
      {children}
    </section>
  )
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-line ${className}`} />
}

export function PageHeader({ title, text }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
      {text && <p className="mt-1 text-muted">{text}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-muted">
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'We could not load this data.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-critical-bg text-critical">
        <AlertCircle size={26} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
          <RotateCw size={16} aria-hidden="true" /> Retry
        </Button>
      )}
    </div>
  )
}