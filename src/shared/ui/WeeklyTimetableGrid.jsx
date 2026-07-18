import { Fragment } from 'react'

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * Real weekly timetable grid - time rows x day columns, each cell a
 * colored block for that TimetableSlot - matches
 * school_teaching_calendar_admin/view_only's layout. Rows are the
 * distinct start times actually present in `slots` (no invented
 * draft/conflict states - TimetableSlot has neither field, so this
 * only ever shows real, already-approved slots).
 */
export default function WeeklyTimetableGrid({ slots = [], onSelectSlot }) {
  const startTimes = [...new Set(slots.map((s) => s.start_time))].sort()

  if (startTimes.length === 0) {
    return <p className="p-6 text-center text-sm text-ink-muted">Aucun creneau a afficher.</p>
  }

  const slotAt = (dayValue, startTime) =>
    slots.filter((s) => s.day_of_week === dayValue && s.start_time === startTime)

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <div className="grid min-w-[720px] grid-cols-[64px_repeat(6,1fr)]">
        <div className="border-b border-r border-border bg-surface-raised" />
        {DAY_LABELS.map((label) => (
          <div key={label} className="border-b border-r border-border bg-surface-raised p-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-muted last:border-r-0">
            {label}
          </div>
        ))}

        {startTimes.map((time) => (
          <Fragment key={time}>
            <div className="border-b border-r border-border p-2 text-right text-xs text-ink-muted">
              {time.slice(0, 5)}
            </div>
            {DAY_LABELS.map((_, dayIdx) => {
              const cellSlots = slotAt(dayIdx, time)
              return (
                <div key={`${time}-${dayIdx}`} className="min-h-[56px] space-y-1 border-b border-r border-border p-1 last:border-r-0">
                  {cellSlots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectSlot?.(s)}
                      className="block w-full rounded-control border-l-4 border-accent-500 bg-accent-50 p-1.5 text-left transition hover:bg-accent-100"
                    >
                      <p className="truncate text-xs font-semibold text-accent-800">{s.subject_name}</p>
                      <p className="truncate text-[11px] text-ink-muted">{s.classroom_name}</p>
                    </button>
                  ))}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
