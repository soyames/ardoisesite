import Icon from './Icon.jsx'
import Badge from './Badge.jsx'

const TONE_TEXT = {
  primary: 'text-primary-700',
  accent: 'text-accent-700',
  success: 'text-success-700',
  warning: 'text-warning-700',
  danger: 'text-danger-700',
}

const TONE_BADGE = {
  primary: 'neutral',
  accent: 'neutral',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
}

/**
 * Overview stat card - icon chip, uppercase label, big value, and an
 * optional "Review X ->" footer link, matching the stat-card pattern
 * every Stitch dashboard mockup uses (main_dashboard, rh_paie_dashboard,
 * cantine_dashboard, etc.). `featured` renders the dark "highlight"
 * variant Stitch uses for the single most important card in a row
 * (e.g. next payroll run, current canteen service).
 */
export default function StatCard({ label, value, hint, tone = 'primary', icon, badge, linkLabel, onLinkClick, featured = false }) {
  if (featured) {
    return (
      <div className="flex flex-col justify-between rounded-card border border-border bg-primary-950 p-5 text-white shadow-card">
        <div>
          {icon && <Icon name={icon} className="mb-2 text-3xl text-white/70" />}
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-white/70">{hint}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between rounded-card border border-border bg-surface-raised p-5 shadow-card">
      <div>
        <div className="flex items-start justify-between gap-2">
          {icon && <Icon name={icon} className={`text-3xl ${TONE_TEXT[tone]}`} />}
          {badge && <Badge tone={TONE_BADGE[tone]}>{badge}</Badge>}
        </div>
        <p className={`mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted`}>{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${TONE_TEXT[tone]}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
      {linkLabel && (
        <button
          type="button"
          onClick={onLinkClick}
          className="mt-4 flex items-center gap-1 text-left text-sm font-medium text-accent-700 transition hover:gap-2"
        >
          {linkLabel}
          <Icon name="arrow_forward" className="text-base" />
        </button>
      )}
    </div>
  )
}
