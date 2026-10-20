import { AlertTriangle, Users, X } from 'lucide-react'
import { SeverityBadge } from '../../components/ui/Badges'
import CodeBlock from '../../components/ui/CodeBlock'

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h3>
      <div className="mt-2 space-y-3 text-ink">{children}</div>
    </section>
  )
}

export default function IssueDetail({ issue, onClose }) {
  const fix = issue.fix ?? {}

  return (
    <article aria-label={`Issue details: ${issue.ruleId ?? issue.description}`} className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <SeverityBadge level={issue.severity} />
          <h2 className="text-xl font-extrabold text-ink">{issue.description}</h2>
          {issue.ruleId && <p className="font-mono text-sm text-muted">{issue.ruleId}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close issue details"
            className="shrink-0 rounded-lg p-2 text-ink hover:bg-subtle"
          >
            <X size={22} aria-hidden="true" />
          </button>
        )}
      </div>

      {issue.wcagCriterion && (
        <Section title="WCAG criterion">
          <p>{issue.wcagCriterion}</p>
        </Section>
      )}

      {issue.affectedUsers && (
        <Section title="Who is affected">
          <p className="flex items-start gap-2">
            <Users size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
            {issue.affectedUsers}
          </p>
        </Section>
      )}

      {(issue.element || issue.selector) && (
        <Section title="Affected element">
          {issue.selector && (
            <p className="break-all rounded-lg bg-subtle px-3 py-2 font-mono text-sm">{issue.selector}</p>
          )}
          {issue.element && <CodeBlock label="HTML" code={issue.element} />}
        </Section>
      )}

      <Section title="Fix Assistant">
        {fix.explanation ? (
          <p>{fix.explanation}</p>
        ) : (
          <p className="text-muted">No fix suggestion is available for this issue yet.</p>
        )}
        {fix.before && <CodeBlock label="Before" code={fix.before} tone="before" />}
        {fix.after && <CodeBlock label="After" code={fix.after} tone="after" />}

        <p className="flex items-start gap-2 rounded-lg bg-serious-bg px-3 py-2.5 text-sm text-serious">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          Suggestions are a starting point. Review the code and test with real assistive technology before shipping.
        </p>
      </Section>
    </article>
  )
}