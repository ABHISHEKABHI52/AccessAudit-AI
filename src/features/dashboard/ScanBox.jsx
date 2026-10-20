import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import { Card } from '../../components/ui/Common'
import { isValidUrl } from '../../utils/url'
import { api } from '../../api'

export default function ScanBox({ initialUrl = '', heading = 'Scan a website' }) {
  const id = useId()
  const navigate = useNavigate()
  const [url, setUrl] = useState(initialUrl)
  const [status, setStatus] = useState('idle') // idle | invalid | loading | failed

  async function handleSubmit(e) {
    e.preventDefault()
    const value = url.trim()
    if (!isValidUrl(value)) {
      setStatus('invalid')
      return
    }
    setStatus('loading')
    try {
      const { id: scanId } = await api.startScan(value)
      navigate(`/results/${scanId}`)
    } catch {
      setStatus('failed')
    }
  }

  const ready = initialUrl && status === 'idle' && url === initialUrl

  return (
    <Card aria-labelledby={`${id}-title`} className="p-5 sm:p-6">
      <h2 id={`${id}-title`} className="text-base font-bold text-ink">{heading}</h2>

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <label htmlFor={`${id}-url`} className="mb-2 block text-sm font-semibold text-ink">
          Website URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id={`${id}-url`}
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (status !== 'idle') setStatus('idle')
            }}
            placeholder="https://example.com"
            aria-invalid={status === 'invalid'}
            aria-describedby={`${id}-msg`}
            className={`w-full rounded-lg border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted-soft ${
              status === 'invalid' ? 'border-critical' : 'border-control'
            }`}
          />
          <Button type="submit" size="lg" disabled={status === 'loading'} className="shrink-0">
            {status === 'loading' ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Starting...
              </>
            ) : (
              <>
                Start Scan <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        <div id={`${id}-msg`} aria-live="polite" className="mt-2 min-h-6 text-sm">
          {ready && (
            <p className="text-muted">
              Ready to scan <strong className="font-semibold text-ink">{initialUrl}</strong>
            </p>
          )}
          {status === 'invalid' && (
            <p className="flex items-center gap-1.5 font-medium text-critical">
              <AlertCircle size={16} aria-hidden="true" />
              Please enter a valid website URL, for example example.com
            </p>
          )}
          {status === 'failed' && (
            <p className="flex items-center gap-1.5 font-medium text-critical">
              <AlertCircle size={16} aria-hidden="true" />
              Could not start the scan. Please try again.
            </p>
          )}
        </div>
      </form>
    </Card>
  )
}
