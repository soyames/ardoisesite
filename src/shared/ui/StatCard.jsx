export default function StatCard({ label, value, hint, tone = 'primary' }) {
  const toneClasses = {
    primary: 'text-primary-700',
    accent: 'text-accent-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    danger: 'text-danger-700',
  }[tone]

  return (
    <div className="rounded-card border border-border bg-surface-raised p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
