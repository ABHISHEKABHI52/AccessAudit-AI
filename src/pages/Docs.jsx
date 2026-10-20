import { ExternalLink } from 'lucide-react'
import { Card, PageHeader } from '../components/ui/Common'
import { SEVERITY } from '../components/ui/Badges'

const steps = [
  ['New Scan', 'Enter a website URL and start the scan.'],
  ['Results', 'Review findings, filter by severity, and search by rule or WCAG criterion.'],
  ['Fix Assistant', 'Open an issue to see who is affected and a suggested before/after fix.'],
  ['Reports', 'Preview a report, then print it as PDF or download it as JSON.'],
]

const meaning = {
  critical: 'Blocks some users completely from using a feature. Fix first.',
  serious: 'Causes major difficulty for many users. Fix soon.',
  moderate: 'Causes some difficulty or confusion. Plan to fix.',
  minor: 'Small annoyance or best-practice gap. Fix when possible.',
}

export default function Docs() {
  return (
    <>
      <PageHeader title="Documentation" text="How to use AccessAudit AI." />

      <Card aria-labelledby="docs-steps" className="p-6">
        <h2 id="docs-steps" className="text-lg font-bold text-ink">How it works</h2>
        <ol className="mt-4 space-y-3">
          {steps.map(([name, text], i) => (
            <li key={name} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-ink"><strong>{name}:</strong> <span className="text-muted">{text}</span></p>
            </li>
          ))}
        </ol>
      </Card>

      <Card aria-labelledby="docs-severity" className="p-6">
        <h2 id="docs-severity" className="text-lg font-bold text-ink">Severity levels</h2>
        <ul className="mt-4 space-y-3">
          {Object.entries(SEVERITY).map(([key, { label, icon: Icon, badge }]) => (
            <li key={key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <span className={`inline-flex w-28 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
                <Icon size={14} aria-hidden="true" /> {label}
              </span>
              <span className="text-muted">{meaning[key]}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card aria-labelledby="docs-wcag" className="p-6">
        <h2 id="docs-wcag" className="text-lg font-bold text-ink">WCAG reference</h2>
        <p className="mt-2 text-muted">
          Automated tools find only part of all accessibility problems. Always test with a keyboard and a screen reader too.
        </p>
        <a
          href="https://www.w3.org/WAI/WCAG22/quickref/"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          WCAG 2.2 Quick Reference <ExternalLink size={16} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Card>
    </>
  )
}