import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'What is AccessAudit AI?',
    a: 'AccessAudit AI is a web application that helps developers identify website accessibility problems, understand why they matter, and explore possible fixes.',
  },
  {
    q: 'Which accessibility standard does it follow?',
    a: 'Findings are mapped to WCAG (Web Content Accessibility Guidelines) criteria so you can see exactly which guideline an issue relates to.',
  },
  {
    q: 'Do I need to be an accessibility expert?',
    a: 'No. Every issue comes with a plain-language explanation of who is affected and a practical suggestion for fixing it.',
  },
  {
    q: 'Can I trust the suggested fixes?',
    a: 'Suggestions are a starting point. Always review the code and test with real assistive technologies before shipping.',
  },
  {
    q: 'Can I export my results?',
    a: 'Yes. The History & Reports section lets you preview and export a report of any past scan.',
  },
]

export default function Faq() {
  return (
    <section id="faq" className="bg-app">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-primary-dark">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-line bg-surface shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown
                  size={20}
                  aria-hidden="true"
                  className="shrink-0 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-5 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}