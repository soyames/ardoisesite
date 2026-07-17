import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import QrScanner from '../../shared/components/QrScanner.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const ATTENDANCE_STATES = [
  { value: 'present', label: 'Present' },
  { value: 'absent_unexcused', label: 'Absent non justifie' },
  { value: 'absent_excused', label: 'Absent justifie' },
  { value: 'late', label: 'Retard' },
]

const MEASURES = [
  { value: 'warning', label: 'Avertissement' },
  { value: 'detention', label: "Heure(s) de colle" },
  { value: 'suspension', label: 'Suspension' },
  { value: 'expulsion', label: 'Renvoi' },
]

const TABS = [
  { key: 'attendance', label: 'Appel' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'timelogs', label: 'Heures vacataires' },
]

export default function SurveillantPortal() {
  const [tab, setTab] = useState('attendance')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Surveillance</h1>
        <p className="mt-1 text-sm text-ink-muted">Appel, discipline et confirmation des heures vacataires.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-b-2 border-primary-600 text-primary-700' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'discipline' && <DisciplineTab />}
      {tab === 'timelogs' && <TimeLogsTab />}
    </div>
  )
}

function AttendanceTab() {
  const classrooms = useApiGet('/api/students/classrooms/')
  const [classroomId, setClassroomId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [states, setStates] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const roster = useApiGet(`/api/students/roster/?classroom=${classroomId}`, { skip: !classroomId })
  const [scanError, setScanError] = useState(null)

  const markPresentByScan = (idCardCode) => {
    setScanError(null)
    const match = (roster.data || []).find((r) => r.id_card_code && r.id_card_code === idCardCode)
    if (!match) {
      setScanError("Cette carte ne correspond a aucun eleve de la classe selectionnee.")
      return
    }
    setStates({ ...states, [match.id]: 'present' })
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      const records = (roster.data || [])
        .filter((r) => states[r.id])
        .map((r) => ({
          local_uuid: crypto.randomUUID(),
          enrollment: r.id,
          date,
          state: states[r.id],
          created_offline: false,
        }))
      if (records.length === 0) {
        setError('Marquez au moins un eleve avant de valider.')
        return
      }
      await api.post('/api/academics/attendance/sync/', records)
      setSuccess(true)
      setStates({})
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Feuille d'appel" />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select className={INPUT_CLASS} value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
              <option value="">Choisir la classe...</option>
              {classrooms.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" className={INPUT_CLASS} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {classroomId && <QrScanner onScan={markPresentByScan} />}
          {scanError && <p className="text-sm text-danger-600">{scanError}</p>}
          {error && <p className="text-sm text-danger-600">{error}</p>}
          {success && <p className="text-sm text-success-600">Appel enregistre.</p>}

          {classroomId && roster.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {classroomId && !roster.loading && roster.data?.length === 0 && <EmptyState title="Aucun eleve dans cette classe" />}

          {classroomId && !roster.loading && roster.data?.length > 0 && (
            <div className="space-y-2">
              {roster.data.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-control border border-border p-2">
                  <p className="text-sm text-ink">{r.student_name} <span className="text-ink-muted">({r.matricule})</span></p>
                  <div className="flex flex-wrap gap-1">
                    {ATTENDANCE_STATES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStates({ ...states, [r.id]: s.value })}
                        className={`rounded-control px-2 py-1 text-xs ${
                          states[r.id] === s.value ? 'bg-primary-600 text-white' : 'bg-surface-raised text-ink-muted ring-1 ring-inset ring-border'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={submit} disabled={submitting}>{submitting ? 'Enregistrement...' : "Valider l'appel"}</Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function DisciplineTab() {
  const classrooms = useApiGet('/api/students/classrooms/')
  const [classroomId, setClassroomId] = useState('')
  const roster = useApiGet(`/api/students/roster/?classroom=${classroomId}`, { skip: !classroomId })
  const [form, setForm] = useState({ enrollment: '', date: new Date().toISOString().slice(0, 10), measure: 'warning', reason: '', hours: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await api.post('/api/academics/discipline/', {
        enrollment: Number(form.enrollment),
        date: form.date,
        measure: form.measure,
        reason: form.reason,
        hours: form.measure === 'detention' && form.hours ? Number(form.hours) : null,
      })
      setForm({ enrollment: '', date: new Date().toISOString().slice(0, 10), measure: 'warning', reason: '', hours: '' })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Signaler une mesure disciplinaire" subtitle="Avertissement/colle prennent effet immediatement; suspension/renvoi passent par l'approbation du Censeur." />
      <CardBody>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select required className={INPUT_CLASS} value={classroomId} onChange={(e) => { setClassroomId(e.target.value); setForm({ ...form, enrollment: '' }) }}>
            <option value="">Choisir la classe...</option>
            {classrooms.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select required className={INPUT_CLASS} value={form.enrollment} onChange={(e) => setForm({ ...form, enrollment: e.target.value })} disabled={!classroomId}>
            <option value="">Choisir l'eleve...</option>
            {roster.data?.map((r) => <option key={r.id} value={r.id}>{r.student_name}</option>)}
          </select>
          <input required type="date" className={INPUT_CLASS} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <select className={INPUT_CLASS} value={form.measure} onChange={(e) => setForm({ ...form, measure: e.target.value })}>
            {MEASURES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {form.measure === 'detention' && (
            <input type="number" className={INPUT_CLASS} placeholder="Nombre d'heures" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          )}
          <textarea required className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Motif" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
          {success && <p className="text-sm text-success-600 sm:col-span-2">Mesure enregistree.</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
        </form>
      </CardBody>
    </Card>
  )
}

function TimeLogsTab() {
  const pending = useApiGet('/api/hr/time-logs/?is_confirmed=false')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const confirm = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/hr/time-logs/${id}/confirm/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">Heures declarees par les vacataires, a rapprocher de l'emploi du temps avant paie.</p>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucune heure en attente de confirmation" />}
      {pending.data?.map((t) => (
        <Card key={t.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{t.staff_name} - {t.class_subject_label}</p>
              <p className="text-xs text-ink-muted">{t.date} - {t.hours} h</p>
            </div>
            <Button size="sm" onClick={() => confirm(t.id)} disabled={busy === t.id}>
              {busy === t.id ? 'Confirmation...' : 'Confirmer'}
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
