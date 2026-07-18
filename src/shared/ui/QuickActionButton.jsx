import Icon from './Icon.jsx'

/**
 * Icon + title + one-line description action button - the "Quick
 * Actions" row pattern in every Stitch dashboard mockup.
 */
export default function QuickActionButton({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-card border border-border bg-surface-raised p-4 text-left shadow-card transition hover:bg-surface-hover active:scale-[0.98]"
    >
      <Icon name={icon} filled className="text-3xl text-accent-600" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mt-0.5 truncate text-xs text-ink-muted">{description}</p>}
      </div>
    </button>
  )
}
