import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="AccessAudit AI home">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
        <ShieldCheck size={22} aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold ${light ? 'text-white' : 'text-ink'}`}>
          AccessAudit <span className={light ? 'text-blue-400' : 'text-primary'}>AI</span>
        </span>
        <span className={`block text-xs ${light ? 'text-slate-300' : 'text-muted'}`}>
          Scan. Understand. Fix.
        </span>
      </span>
    </Link>
  )
}