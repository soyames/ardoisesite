/**
 * Shared tab bar for every role portal - replaces the copy-pasted
 * tab-bar JSX each portal used to hand-roll (CashierPortal, TeacherPortal,
 * CanteenPortal, etc. all had their own near-identical version).
 * Styling flows entirely through the Academic Precision tokens in
 * index.css, so restyling every portal's nav is a one-file change here,
 * not N files.
 */
export default function PortalTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm font-medium transition ${
            active === t.key
              ? 'border-b-2 border-primary-600 text-primary-700'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
