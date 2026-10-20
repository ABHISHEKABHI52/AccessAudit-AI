import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CodeBlock({ label, code, tone = 'neutral' }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const head = {
    neutral: 'bg-slate-800 text-slate-200',
    before: 'bg-critical-bg text-critical',
    after: 'bg-success-bg text-success',
  }[tone]

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className={`flex items-center justify-between px-4 py-2 ${head}`}>
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-subtle"
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy code'}
          <span className="sr-only"> {label}</span>
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-label={`${label} code`}
        className="overflow-x-auto bg-navy p-4 font-mono text-[13px] leading-relaxed text-slate-100"
      >
        <code>{code}</code>
      </pre>
      <span role="status" className="sr-only">{copied ? `${label} copied to clipboard` : ''}</span>
    </div>
  )
}