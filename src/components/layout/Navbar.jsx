import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

const links = [
  { label: 'Home', href: '#home', id: 'home' },
  { label: 'Features', href: '#features', id: 'features' },
  { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
  { label: 'FAQ', href: '#faq', id: 'faq' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('home')

  // Scroll par shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Jis section pe ho, wahi link highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id))
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    links.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const linkBase = 'rounded-full px-4 py-2 text-sm font-semibold transition-colors'

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-gradient-to-r from-white via-blue-50/80 to-white backdrop-blur transition-shadow ${
        scrolled ? 'border-blue-100 shadow-card' : 'border-line'
      }`}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo />

        {/* Desktop links */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-white/70 p-1">
            {links.map((link) => {
              const isActive = active === link.id
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? 'location' : undefined}
                    className={`${linkBase} block ${
                      isActive
                        ? 'bg-blue-50 text-primary-dark shadow-card'
                        : 'text-muted hover:bg-subtle hover:text-ink'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
            <li>
              <Link
                to="/dashboard"
                className={`${linkBase} flex items-center gap-1.5 text-teal hover:bg-subtle`}
              >
                <LayoutDashboard size={16} aria-hidden="true" /> Dashboard
              </Link>
            </li>
          </ul>
        </nav>

        <div className="hidden md:block">
          <Button as="a" href="#scan">
            Get Started <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-ink hover:bg-subtle md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-line bg-surface md:hidden">
          <ul className="space-y-1 px-4 py-4">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-subtle"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-teal hover:bg-subtle"
              >
                <LayoutDashboard size={18} aria-hidden="true" /> Dashboard
              </Link>
            </li>
            <li className="pt-2">
              <Button as="a" href="#scan" className="w-full" onClick={() => setOpen(false)}>
                Get Started <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}