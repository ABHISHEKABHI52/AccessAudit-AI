import { Search, Lightbulb, Code2, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Search,
    color: 'bg-primary',
    title: 'Scan & Detect',
    text: 'Find accessibility barriers across your website with powerful automated checks.',
  },
  {
    icon: Lightbulb,
    color: 'bg-teal',
    title: 'Understand the Impact',
    text: 'Get clear explanations of why issues matter and how they affect real users.',
  },
  {
    icon: Code2,
    color: 'bg-serious',
    title: 'Get Practical Fixes',
    text: 'Receive step-by-step guidance and code examples to fix issues quickly.',
  },
  {
    icon: Sparkles,
    color: 'bg-violet-600',
    title: 'AI-Powered Assistance',
    text: 'Ask questions and get AI-generated explanations for complex issues.',
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-surface">
      <div className="container-page py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-primary-dark">
            Why AccessAudit AI?
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Built for developers. Designed for a more inclusive web.
          </h2>
          <p className="mt-4 text-lg text-muted">
            Go beyond automated checks with clear insights, actionable fixes, and AI-powered
            recommendations.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, color, title, text }) => (
            <li
              key={title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-card transition-transform hover:-translate-y-1"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${color}`}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}