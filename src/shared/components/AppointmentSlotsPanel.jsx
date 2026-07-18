import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const appointments = useApiGet(`/api/students/appointments/?date=${date}`)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ start_time: '09:00', end_time: '09:30', is_blocked: false })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const createSlot = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/students/appointments/', { ...form, date })
      setForm({ start_time: '09:00', end_time: '09:30', is_blocked: false })
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
      await api.patch(`/api/students/appointments/${id}/`, { candidate_name: name })
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
      await api.patch(`/api/students/appointments/${id}/`, { candidate_name: '', candidate_contact: '' })
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
            <input type="time" required className={INPUT_CLASS} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <input type="time" required className={INPUT_CLASS} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={form.is_blocked} onChange={(e) => setForm({ ...form, is_blocked: e.target.checked })} />
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
                <span className="w-14 text-sm font-semibold text-ink">{slot.start_time.slice(0, 5)}</span>
                <div className="h-8 w-px bg-border" />
                {slot.status === 'blocked' && <span className="text-sm italic text-ink-muted">Pause / Preparation</span>}
                {slot.status === 'booked' && <span className="text-sm font-semibold text-ink">{slot.candidate_name}</span>}
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
