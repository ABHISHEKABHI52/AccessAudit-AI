import { Link, useLocation } from 'react-router-dom'
import { Globe, Bug, ShieldAlert, Clock } from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, EmptyState, PageHeader } from '../components/ui/Common'
import { useDashboardData } from '../hooks/useScanData'
import ScanBox from '../features/dashboard/ScanBox'
import StatCard from '../features/dashboard/StatCard'
import BarChart from '../features/dashboard/BarChart'
import SeverityDonut from '../features/dashboard/SeverityDonut'
import ScansTable from '../features/dashboard/ScansTable'

export default function Overview() {
  const { state } = useLocation() // landing se aaya hua URL
  const { status, data, retry } = useDashboardData()
  const d = data ?? {}
  const stats = d.stats ?? {}

  const cards = [
    { label: 'Total Scans', value: stats.totalScans, icon: Globe },
    { label: 'Open Issues', value: stats.openIssues, icon: Bug },
    { label: 'Critical / Serious', value: stats.criticalSerious, icon: ShieldAlert },
    { label: 'Last Scan', value: stats.lastScan, icon: Clock },
  ]

  return (
    <>
      <PageHeader title="Dashboard" text="Your accessibility scans at a glance." />

      <ScanBox initialUrl={state?.url ?? ''} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} status={status} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BarChart
          title="Scans over time"
          data={d.scansOverTime ?? []}
          status={status}
          onRetry={retry}
          className="lg:col-span-2"
        />
        <SeverityDonut data={d.severity ?? []} status={status} onRetry={retry} />
      </div>

      <Card aria-labelledby="recent-title">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 id="recent-title" className="text-base font-bold text-ink">Recent Scans</h2>
          <Link to="/history" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-2">
          <ScansTable
            caption="Recent scans"
            scans={d.recentScans ?? []}
            status={status}
            onRetry={retry}
            empty={
              <EmptyState
                icon={Globe}
                title="No scans yet"
                text="Run your first scan to see results here."
                action={
                  <Button as={Link} to="/scan">
                    Start your first scan
                  </Button>
                }
              />
            }
          />
        </div>
      </Card>
    </>
  )
}