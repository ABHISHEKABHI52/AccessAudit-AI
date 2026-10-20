import { ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function FinalCta() {
  return (
    <section className="bg-surface">
      <div className="container-page py-16">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-300 via-blue-200 to-sky-200 px-6 py-16 text-center sm:px-12">
          {/* Sirf background glow, text pe koi effect nahi */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Ready to make your website accessible?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink/80">
              Scan your site, understand the barriers, and start fixing them today.
            </p>
            <Button as="a" href="#scan" size="lg" className="mt-8">
              Scan a Website <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}