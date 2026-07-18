import { useState } from 'react'
import Icon from './Icon.jsx'

const WEEKDAY_LABELS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']
const MONTH_LABEL_OPTS = { month: 'long', year: 'numeric' }

function toDateKey(d) {
  return d.toISOString().slice(0, 10)
}

function buildMonthCells(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0=Sun
  const gridStart = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

/**
 * Real month-grid calendar - the 7-column layout every Stitch calendar
 * mockup (master_calendar) uses, driven by real SchoolCalendarEvent
 * data (no invented recurrence/drag-drop - this app's calendar events
 * are simple date+label+kind rows, so the grid stays read-only plus a
 * day-select callback, matching what the backend actually models).
 */
export default function CalendarGrid({ events = [], selectedDate, onSelectDate }) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const eventsByDate = {}
  for (const ev of events) {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = []
    eventsByDate[ev.date].push(ev)
  }

  const cells = buildMonthCells(month)
  const today = toDateKey(new Date())

  const shiftMonth = (delta) => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  return (
    <div className="overflow-hidden rounded-card border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3">
        <p className="text-sm font-semibold capitalize text-ink">{month.toLocaleDateString('fr-FR', MONTH_LABEL_OPTS)}</p>
        <div className="flex gap-1">
          <button onClick={() => shiftMonth(-1)} className="rounded-control p-1 text-ink-muted hover:bg-surface-hover" aria-label="Mois precedent">
            <Icon name="chevron_left" />
          </button>
          <button onClick={() => shiftMonth(1)} className="rounded-control p-1 text-ink-muted hover:bg-surface-hover" aria-label="Mois suivant">
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-surface-raised">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="p-2 text-center text-[11px] font-semibold text-ink-muted">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const key = toDateKey(d)
          const inMonth = d.getMonth() === month.getMonth()
          const dayEvents = eventsByDate[key] || []
          const isSelected = selectedDate === key
          const isToday = key === today

          return (
            <button
              key={key}
              onClick={() => onSelectDate?.(key)}
              className={`flex min-h-[64px] flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition last:border-r-0 hover:bg-surface-hover ${
                isSelected ? 'bg-primary-950 text-white hover:bg-primary-900' : inMonth ? 'text-ink' : 'text-ink-muted/40'
              }`}
            >
              <span className={`text-xs ${isToday && !isSelected ? 'flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 font-bold text-primary-950' : ''}`}>
                {d.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className={`h-1.5 w-1.5 rounded-full ${ev.kind === 'holiday' ? 'bg-ink-muted' : 'bg-accent-500'}`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
