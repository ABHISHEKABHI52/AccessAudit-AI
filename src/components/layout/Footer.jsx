import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
)

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const socials = [
  { label: 'GitHub', href: '#', icon: GithubIcon },
  { label: 'LinkedIn', href: '#', icon: LinkedinIcon },
  { label: 'X (Twitter)', href: '#', icon: XIcon },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-linear-to-b from-white via-blue-100 to-sky-200">
      {/* Decorative glass orbs (sirf design, screen reader ke liye hidden) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-300/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute right-24 top-16 h-8 w-8 rounded-full bg-linear-to-br from-blue-300 to-primary opacity-80 shadow-lg" />
        <div className="absolute left-16 bottom-20 h-5 w-5 rounded-full bg-linear-to-br from-blue-200 to-primary opacity-70" />
        <div className="absolute right-1/3 bottom-12 h-12 w-12 rounded-full border border-white/70 bg-white/30 backdrop-blur" />
      </div>

      <div className="container-page relative py-14">
        <div className="rounded-3xl border border-white/70 bg-white/55 p-6 shadow-card backdrop-blur-md sm:p-8">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <Logo />

            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-muted transition-colors hover:text-primary-dark"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    to="/dashboard"
                    className="text-sm font-semibold text-teal transition-colors hover:text-primary-dark"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs"
                    className="text-sm font-medium text-muted transition-colors hover:text-primary-dark"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </nav>

            <ul className="flex items-center gap-3">
              {socials.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-ink transition hover:-translate-y-0.5 hover:bg-white hover:text-primary-dark"
                  >
                    <Icon />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 border-t border-blue-200/70 pt-6 text-sm text-muted">
            © 2026 AccessAudit AI. Built for a more accessible web.
          </p>
        </div>
      </div>
    </footer>
  )
}