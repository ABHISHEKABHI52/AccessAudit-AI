import { Card, Skeleton } from '../../components/ui/Common'

export default function StatCard({ label, value, icon: Icon, status = 'success' }) {
  const empty = value === null || value === undefined || value === ''

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-subtle text-muted">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>

      {status === 'loading' ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <span className="sr-only">Loading</span>
        </>
      ) : empty || status === 'error' ? (
        <p className="mt-2 text-3xl font-extrabold text-muted-soft">
          <span aria-hidden="true">—</span>
          <span className="sr-only">No data</span>
        </p>
      ) : (
        <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
      )}
    </Card>
  )
}