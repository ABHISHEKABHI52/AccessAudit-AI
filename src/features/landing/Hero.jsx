import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Zap,
  Code2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MousePointer2,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { isValidUrl } from '../../utils/url'

const SPLINE_URL = 'https://my.spline.design/interactiveaiwebsite-LGkGugHdxfuKLbPdprlIHooC/'

// Sirf ye 2 numbers badlo (px)
const TOP_CROP = 120 // upar ka grey hissa chhupata hai
const BOTTOM_CROP = 150 // neeche ka "Built with Spline" tag + arrow chhupata hai

const trust = [
  { icon: ShieldCheck, title: 'WCAG Compliant', text: 'Checks' },
  { icon: Zap, title: 'AI-Powered', text: 'Guidance' },
  { icon: Code2, title: 'Developer', text: 'Focused' },
]

export default function Hero() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | error | loading | done
  const [interactive, setInteractive] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const value = url.trim()

    if (!isValidUrl(value)) {
      setStatus('error')
      return
    }

    // Doosri click: URL sahi hai aur "done" ho chuka hai, to dashboard kholo
    if (status === 'done') {
      navigate('/dashboard', { state: { url: value } })
      return
    }

    // Pehli click: 2 sec loading, phir green message
    setStatus('loading')
    setTimeout(() => setStatus('done'), 2000)
  }

  return (
    <section id="home" className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-app">
      {/* 3D background (sirf lg+ screens) */}
      <div className="absolute inset-0 hidden overflow-hidden lg:block">
        <iframe
          src={SPLINE_URL}
          title="Interactive 3D cubes illustration"
          loading="lazy"
          tabIndex={-1}
          style={{ top: -TOP_CROP, height: `calc(100% + ${TOP_CROP + BOTTOM_CROP}px)` }}
          className={`absolute left-0 w-full border-0 ${interactive ? '' : 'pointer-events-none'}`}
        />

        <button
          type="button"
          aria-pressed={interactive}
          onClick={() => setInteractive(!interactive)}
          className={`absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-card ${
            interactive
              ? 'border-primary bg-primary text-white'
              : 'border-control bg-surface text-ink hover:bg-subtle'
          }`}
        >
          <MousePointer2 size={16} aria-hidden="true" />
          {interactive ? 'Interaction on (click to stop)' : 'Interact with 3D'}
        </button>
      </div>

      {/* Content */}
      <div className="container-page pointer-events-none relative z-10 flex min-h-[calc(100vh-72px)] items-center py-14 lg:py-20">
        <div className="pointer-events-auto max-w-xl lg:w-1/2">
          <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-primary-dark">
            AI-Powered Website Accessibility Analyzer
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl xl:text-6xl">
            Make your website more <span className="text-teal">accessible.</span>
          </h1>

          <p className="mt-5 text-lg text-muted">
            Identify accessibility barriers, understand their impact, and discover practical ways
            to improve your website.
          </p>

          <form id="scan" onSubmit={handleSubmit} noValidate className="mt-8">
            <label htmlFor="site-url" className="mb-2 block text-sm font-semibold text-ink">
              Website URL
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="site-url"
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  if (status !== 'idle') setStatus('idle')
                }}
                placeholder="https://example.com"
                aria-invalid={status === 'error'}
                aria-describedby="url-message"
                className={`w-full rounded-lg border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted-soft ${
                  status === 'error' ? 'border-critical' : 'border-control'
                }`}
              />
              <Button type="submit" size="lg" disabled={status === 'loading'} className="shrink-0">
                {status === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Scanning...
                  </>
                ) : (
                  <>
                    Scan a Website <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>

            <div id="url-message" aria-live="polite" className="mt-2 min-h-6 text-sm">
              {status === 'error' && (
                <p className="flex items-center gap-1.5 font-medium text-critical">
                  <AlertCircle size={16} aria-hidden="true" />
                  Please enter a valid website URL, for example example.com
                </p>
              )}
              {status === 'done' && (
                <p className="flex items-center gap-1.5 font-medium text-success">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  URL looks good. Click Scan a Website again to open the dashboard.
                </p>
              )}
            </div>
          </form>

          <div className="mt-3">
            <Button as="a" href="#how-it-works" variant="outline" size="lg">
              How It Works <Play size={16} aria-hidden="true" />
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {trust.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <Icon size={28} className="text-muted" aria-hidden="true" />
                <span className="text-sm font-medium leading-tight text-muted">
                  {title}
                  <br />
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}