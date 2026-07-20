import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { toLocalDateString } from '../utils/date.js'
import { Card, CardHeader, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Spinner from '../ui/Spinner.jsx'
import Icon from '../ui/Icon.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

/**
 * Front-desk interview/visit slot management - the enrollment_appointments
 * Stitch screen's "Today's Slots" panel. Backed by the real
 * EnrollmentAppointment model (see apps/students/models.py) - a flat,
 * non-recurring slot list, not a full booking engine (that stays its
 * own separately-scoped build).
 */
export default function AppointmentSlotsPanel() {
  const [date, setDate] = useState(() => toLocalDateString())
  const appointments = useApiGet(`/api/students/appointments/?date=${date}`)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ startTime: '09:00', endTime: '09:30', isBlocked: false })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const createSlot = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/students/appointments/', { ...form, date })
      setForm({ startTime: '09:00', endTime: '09:30', isBlocked: false })
      setShowForm(false)
      appointments.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const assign = async (id) => {
    const name = window.prompt('Nom du candidat / de la famille :')
    if (!name) return
    setBusyId(id)
    try {
      await api.patch(`/api/students/appointments/${id}/`, { candidateName: name })
      appointments.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusyId(null)
    }
  }

  const clearSlot = async (id) => {
    setBusyId(id)
    try {
      await api.patch(`/api/students/appointments/${id}/`, { candidateName: '', candidateContact: '' })
      appointments.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Creneaux du jour"
        action={
          <div className="flex items-center gap-2">
            <input type="date" className="rounded-control border border-border bg-surface px-2 py-1 text-xs" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Creneau'}</Button>
          </div>
        }
      />
      <CardBody className="space-y-3">
        {showForm && (
          <form onSubmit={createSlot} className="grid grid-cols-1 gap-2 rounded-control border border-border p-3 sm:grid-cols-3">
            <input type="time" required className={INPUT_CLASS} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <input type="time" required className={INPUT_CLASS} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={form.isBlocked} onChange={(e) => setForm({ ...form, isBlocked: e.target.checked })} />
              Bloquer (pause / preparation)
            </label>
            {error && <p className="text-sm text-danger-600 sm:col-span-3">{error}</p>}
            <div className="sm:col-span-3">
              <Button size="sm" type="submit" disabled={submitting}>{submitting ? 'Creation...' : 'Ajouter le creneau'}</Button>
            </div>
          </form>
        )}

        {appointments.loading && <div className="flex justify-center py-6"><Spinner /></div>}
        {!appointments.loading && (appointments.data || []).length === 0 && (
          <p className="py-4 text-center text-sm text-ink-muted">Aucun creneau pour cette date.</p>
        )}

        <div className="space-y-2">
          {(appointments.data || []).map((slot) => (
            <div
              key={slot.id}
              className={`flex items-center justify-between rounded-control border p-3 ${
                slot.status === 'blocked' ? 'border-border bg-surface' :
                slot.status === 'booked' ? 'border-accent-300 bg-accent-50' : 'border-border bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-14 text-sm font-semibold text-ink">{slot.startTime.slice(0, 5)}</span>
                <div className="h-8 w-px bg-border" />
                {slot.status === 'blocked' && <span className="text-sm italic text-ink-muted">Pause / Preparation</span>}
                {slot.status === 'booked' && <span className="text-sm font-semibold text-ink">{slot.candidateName}</span>}
                {slot.status === 'available' && <span className="text-sm text-ink-muted">Disponible</span>}
              </div>
              {slot.status === 'blocked' && <Icon name="lock" className="text-ink-muted" />}
              {slot.status === 'booked' && (
                <button onClick={() => clearSlot(slot.id)} disabled={busyId === slot.id} className="text-xs font-medium text-accent-700 hover:underline">
                  Liberer
                </button>
              )}
              {slot.status === 'available' && (
                <Button size="sm" onClick={() => assign(slot.id)} disabled={busyId === slot.id}>Assigner</Button>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
