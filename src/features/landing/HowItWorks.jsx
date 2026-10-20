import { Link2, Search, ListChecks, Sparkles, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'

const steps = [
  { icon: Link2, title: 'Enter URL', text: 'Add the website you want to scan.' },
  { icon: Search, title: 'Run Scan', text: 'Our engine analyzes your website for accessibility issues.' },
  { icon: ListChecks, title: 'View Results', text: 'See violations, affected elements and WCAG references.' },
  { icon: Sparkles, title: 'Get Fixes', text: 'Use AI assistance and recommended solutions.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-blue-50/60">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_2fr] lg:py-20">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-3.5 py-1.5 text-sm font-semibold text-primary-dark">
            Simple 4-Step Process
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-muted">Get from a URL to actionable insights in just a few steps.</p>
          <Button as="a" href="#scan" size="lg" className="mt-6">
            Start Scanning <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </div>

        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="relative text-center">
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface text-primary shadow-card">
                <Icon size={26} aria-hidden="true" />
                <span className="absolute -bottom-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-5 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{text}</p>
              {index < steps.length - 1 && (
                <ArrowRight
                  size={20}
                  aria-hidden="true"
                  className="absolute -right-4 top-5 hidden text-primary lg:block"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}