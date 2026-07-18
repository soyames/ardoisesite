import Icon from './Icon.jsx'
import Badge from './Badge.jsx'

const ICON_BG = {
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
}

/**
 * Zebra-striped activity/event list - icon avatar + title + subtitle +
 * timestamp + optional status badge. Matches the "Recent Activity" /
 * "Pending Approvals" / "Demandes" pattern used across nearly every
 * Stitch dashboard mockup (main_dashboard, rh_paie_dashboard,
 * comptable_dashboard).
 */
export default function ActivityList({ items, emptyLabel = 'Rien a signaler.' }) {
  if (!items || items.length === 0) {
    return <p className="p-4 text-sm text-ink-muted">{emptyLabel}</p>
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <li key={item.id ?? i} className={`flex items-center gap-3 p-4 ${i % 2 === 1 ? 'bg-surface-hover/40' : ''}`}>
          {item.icon && (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ICON_BG[item.iconTone || 'primary']}`}>
              <Icon name={item.icon} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{item.title}</p>
            {item.subtitle && <p className="truncate text-xs text-ink-muted">{item.subtitle}</p>}
          </div>
          <div className="shrink-0 text-right">
            {item.timestamp && <p className="text-xs text-ink-muted">{item.timestamp}</p>}
            {item.badge && <Badge tone={item.badgeTone || 'neutral'}>{item.badge}</Badge>}
          </div>
        </li>
      ))}
    </ul>
  )
}
