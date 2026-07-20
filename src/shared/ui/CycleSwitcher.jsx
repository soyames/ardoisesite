import Badge from './Badge.jsx'

/**
 * Which cycle (Primaire/Secondaire) the data on screen belongs to - see
 * the 2026-07-17-cycle-scope-wiring CEO plan's "cycle switcher" cherry-
 * pick. A cycle-scoped user (Director/Censeur with cycleScope set) only
 * ever sees their own cycle - no switcher needed, just the badge so it's
 * never ambiguous. A blank-cycleScope user (Founder/Auditor - "oversees
 * both") gets the 3-way toggle to voluntarily narrow their view; the
 * chosen value is passed by the caller as `?cycle=` on the relevant
 * list endpoints (pending-approvals, leave-requests, staff-directory,
 * timetable-slots, loans - see those views' own docstrings for which
 * ones honor it).
 */
const LABELS = { primary: 'Primaire', secondary: 'Secondaire', '': 'Tous les cycles' }

export default function CycleSwitcher({ userCycleScope, value, onChange }) {
  if (userCycleScope) {
    return <Badge tone="info">{LABELS[userCycleScope]}</Badge>
  }

  return (
    <div className="inline-flex rounded-control border border-border bg-surface-raised p-0.5">
      {['', 'primary', 'secondary'].map((opt) => (
        <button
          key={opt || 'all'}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1 text-xs font-medium rounded-control transition ${
            value === opt ? 'bg-primary-600 text-white' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {LABELS[opt]}
        </button>
      ))}
    </div>
  )
}
