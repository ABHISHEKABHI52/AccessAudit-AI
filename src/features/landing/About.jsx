import { Users, ShieldCheck, Heart, Code2 } from 'lucide-react'

const points = [
  { icon: Users, color: 'text-primary', title: 'More Reach', text: 'Make your content usable for everyone.' },
  { icon: ShieldCheck, color: 'text-teal', title: 'Better SEO', text: 'Accessibility improves search engine visibility.' },
  { icon: Heart, color: 'text-critical', title: 'Greater Impact', text: 'Create a more inclusive web for all.' },
  { icon: Code2, color: 'text-violet-600', title: 'Developer Friendly', text: 'Clear guidance, real examples, faster fixes.' },
]

export default function About() {
  return (
    <section id="about" className="bg-surface">
      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1fr_2fr] lg:py-20">
        <div>
          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-primary-dark">
            Accessible Web. Better For Everyone.
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Build a more inclusive internet, together.
          </h2>
          <p className="mt-4 text-muted">
            Accessibility isn&apos;t just a checklist. It&apos;s a better experience for every user,
            on every device, for every ability.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ icon: Icon, color, title, text }) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <Icon size={28} className={color} aria-hidden="true" />
              <h3 className="mt-3 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}