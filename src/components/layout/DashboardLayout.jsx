import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Plus,
  ListChecks,
  Wrench,
  History as HistoryIcon,
  FileText,
  BookOpen,
  Menu,
  X,
  User,
  ShieldCheck,
} from 'lucide-react'

const CHARACTER_SRC = '/dashboard-character.png'

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/scan', label: 'New Scan', icon: Plus },
  { to: '/results', label: 'Results', icon: ListChecks },
  { to: '/fix', label: 'Fix Assistant', icon: Wrench },
  { to: '/history', label: 'Scan History', icon: HistoryIcon },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/docs', label: 'Documentation', icon: BookOpen },
]

function SidebarContent({ mobile = false, onNavigate }) {
  const [imgOk, setImgOk] = useState(true)
  // Tablet par sirf icons (label screen reader ke liye rehta hai)
  const label = mobile ? '' : 'sr-only lg:not-sr-only'

  return (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        onClick={onNavigate}
        aria-label="AccessAudit AI home"
        className="flex items-center gap-2.5 px-4 py-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <span className={`leading-tight ${label}`}>
          <span className="block text-base font-extrabold text-ink">
            AccessAudit <span className="text-primary-dark">AI</span>
          </span>
          <span className="block text-xs text-muted">Scan. Understand. Fix.</span>
        </span>
      </Link>

      {/* Right padding nahi, taaki active tab sidebar ke edge tak pahunche */}
      <nav aria-label="Dashboard" className="flex-1 py-6 pl-3">
        <ul className="space-y-3">
          {nav.map(({ to, label: text, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/dashboard' || to === '/scan'}
                onClick={onNavigate}
                title={text}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 pl-4 pr-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'nav-active rounded-l-full bg-app font-bold text-primary-dark'
                      : 'mr-3 rounded-lg text-muted hover:bg-white/60 hover:text-ink'
                  }`
                }
              >
                <Icon size={20} className="shrink-0" aria-hidden="true" />
                <span className={label}>{text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

    
      <div
        className={`mx-3 mb-4 mt-4 rounded-2xl bg-white p-4 shadow-card ${
          mobile ? '' : 'hidden lg:block'
        } [@media(max-height:720px)]:hidden`}
      >
        {imgOk && (
          <img
            src={CHARACTER_SRC}
            alt=""
            aria-hidden="true"
            onError={() => setImgOk(false)}
            className="mb-2 h-36 w-full object-contain"
          />
        )}
        <p className="text-sm font-semibold text-ink">Need a report? Export your scan results.</p>
        <Link
          to="/reports"
          onClick={onNavigate}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <FileText size={16} aria-hidden="true" /> Get Report
        </Link>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-screen bg-app">
      <a href="#main" className="skip-link">Skip to main content</a>

      {/* Desktop + tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] bg-blue-100 md:block lg:w-64">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-blue-100 shadow-xl"
          >
            <button
              type="button"
              autoFocus
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-ink hover:bg-white/60"
            >
              <X size={22} aria-hidden="true" />
            </button>
            <SidebarContent mobile onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="md:pl-[76px] lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-ink hover:bg-subtle md:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={24} aria-hidden="true" />
            </button>
            <span className="text-base font-extrabold text-ink md:hidden">
              AccessAudit <span className="text-primary">AI</span>
            </span>
          </div>

          {/* Avatar placeholder: backend se user aane par yahan lagega */}
          <span
            role="img"
            aria-label="User profile placeholder"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted"
          >
            <User size={20} aria-hidden="true" />
          </span>
        </header>

        <main id="main" className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}