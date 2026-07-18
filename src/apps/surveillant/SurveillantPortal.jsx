import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import QrScanner from '../../shared/components/QrScanner.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'

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

const INCIDENT_KINDS = [
  { value: 'behavior', label: 'Comportement' },
  { value: 'first_aid', label: 'Premiers secours' },
  { value: 'security', label: 'Securite' },
]

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'attendance', label: 'Appel' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'timelogs', label: 'Heures vacataires' },
]

export default function SurveillantPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Surveillance</h1>
        <p className="mt-1 text-sm text-ink-muted">Appel, discipline et confirmation des heures vacataires.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'discipline' && <DisciplineTab />}
      {tab === 'incidents' && <IncidentsTab />}
      {tab === 'timelogs' && <TimeLogsTab />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const openIncidents = useApiGet('/api/academics/incidents/?status=open')
  const pendingDetentions = useApiGet('/api/academics/discipline/list/')

  const detentionsAwaitingCheckIn = (pendingDetentions.data || []).filter(
    (d) => d.measure === 'detention' && d.status === 'approved' && !d.served_at
  )

  const loading = openIncidents.loading || pendingDetentions.loading

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble de la surveillance aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={() => onNavigate('attendance')} className="rounded-card border border-border bg-primary-950 p-4 text-left text-white transition hover:bg-primary-900">
          <p className="text-sm font-semibold">Faire l'appel</p>
          <p className="mt-1 text-xs text-white/70">Scanner ou saisir la presence</p>
        </button>
        <button onClick={() => onNavigate('incidents')} className="rounded-card border border-border bg-accent-600 p-4 text-left text-white transition hover:bg-accent-700">
          <p className="text-sm font-semibold">Signaler un incident</p>
          <p className="mt-1 text-xs text-white/70">{openIncidents.data?.length || 0} ouvert(s)</p>
        </button>
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Incidents ouverts" value={openIncidents.data?.length || 0} tone={openIncidents.data?.length > 0 ? 'accent' : 'success'} />
            <StatCard
              label="Heures de colle a pointer"
              value={detentionsAwaitingCheckIn.length}
              tone={detentionsAwaitingCheckIn.length > 0 ? 'accent' : 'success'}
            />
          </div>

          <Card>
            <CardHeader title="Fil des incidents" action={<button onClick={() => onNavigate('incidents')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir tout</button>} />
            <CardBody className="p-0">
              {(openIncidents.data || []).length === 0 && <div className="p-4"><EmptyState title="Aucun incident ouvert" /></div>}
              <ul className="divide-y divide-border">
                {(openIncidents.data || []).slice(0, 5).map((inc) => (
                  <li key={inc.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{inc.description}</p>
                      <Badge tone="warning">{INCIDENT_KINDS.find((k) => k.value === inc.kind)?.label || inc.kind}</Badge>
                    </div>
                    <p className="text-xs text-ink-muted">{inc.location} - {new Date(inc.occurred_at).toLocaleString('fr-FR')}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

function IncidentsTab() {
  const incidents = useApiGet('/api/academics/incidents/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ kind: 'behavior', description: '', location: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/academics/incidents/', {
        kind: form.kind, description: form.description, location: form.location,
        occurred_at: new Date().toISOString(),
      })
      setForm({ kind: 'behavior', description: '', location: '' })
      setShowForm(false)
      incidents.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const act = async (id, action) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/incidents/${id}/${action}/`, {})
      incidents.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  const STATUS_TONE = { open: 'warning', dismissed: 'neutral', resolved: 'success' }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Signaler un incident'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Nouvel incident" />
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select className={INPUT_CLASS} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {INCIDENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
              <input className={INPUT_CLASS} placeholder="Lieu (optionnel)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <textarea required className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="p-0">
          {incidents.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!incidents.loading && incidents.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun incident" /></div>}
          <ul className="divide-y divide-border">
            {incidents.data?.map((inc) => (
              <li key={inc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{inc.description}</p>
                    <p className="text-xs text-ink-muted">
                      {INCIDENT_KINDS.find((k) => k.value === inc.kind)?.label} - {inc.location} - {new Date(inc.occurred_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[inc.status]}>{inc.status}</Badge>
                </div>
                {inc.status === 'open' && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => act(inc.id, 'dismiss')} disabled={busy === inc.id}>Classer sans suite</Button>
                    <Button size="sm" onClick={() => act(inc.id, 'resolve')} disabled={busy === inc.id}>Resoudre</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
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
  const [form, setForm] = useState({ enrollment: '', date: new Date().toISOString().slice(0, 10), measure: 'warning', reason: '', hours: '', points_deducted: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const selectedStudent = roster.data?.find((r) => String(r.id) === String(form.enrollment))

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
        points_deducted: form.points_deducted ? Number(form.points_deducted) : 0,
      })
      setForm({ enrollment: '', date: new Date().toISOString().slice(0, 10), measure: 'warning', reason: '', hours: '', points_deducted: '' })
      setSuccess(true)
      roster.refetch()
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
          {selectedStudent && (
            <p className="text-xs text-ink-muted sm:col-span-2">
              Points de discipline actuels : <span className="font-semibold text-ink">{selectedStudent.discipline_score}</span>
            </p>
          )}
          <input required type="date" className={INPUT_CLASS} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <select className={INPUT_CLASS} value={form.measure} onChange={(e) => setForm({ ...form, measure: e.target.value })}>
            {MEASURES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {form.measure === 'detention' && (
            <input type="number" className={INPUT_CLASS} placeholder="Nombre d'heures" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Points a deduire (selon la gravite)</label>
            <input type="number" min="0" className={INPUT_CLASS} placeholder="ex: 2" value={form.points_deducted} onChange={(e) => setForm({ ...form, points_deducted: e.target.value })} />
          </div>
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
