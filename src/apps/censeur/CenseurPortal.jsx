import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import CycleSwitcher from '../../shared/ui/CycleSwitcher.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'bulletins', label: 'Bulletins' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'calendrier', label: 'Calendrier' },
  { key: 'timelogs', label: 'Heures vacataires' },
  { key: 'exams', label: 'Epreuves' },
]

const DAYS = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
]

export default function CenseurPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Censorat</h1>
        <p className="mt-1 text-sm text-ink-muted">Approbation des bulletins, discipline, heures vacataires et epreuves.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'bulletins' && <BulletinsTab />}
      {tab === 'discipline' && <DisciplineTab />}
      {tab === 'calendrier' && <CalendrierTab />}
      {tab === 'timelogs' && <TimeLogsTab />}
      {tab === 'exams' && <ExamsTab />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const pendingBulletins = useApiGet('/api/academics/bulletins/pending-approval/')
  const pendingDiscipline = useApiGet('/api/academics/discipline/pending-approval/')
  const openIncidents = useApiGet('/api/academics/incidents/?status=open')
  const pendingTimeLogs = useApiGet('/api/hr/time-logs/?is_confirmed=false')

  const loading = pendingBulletins.loading || pendingDiscipline.loading || openIncidents.loading || pendingTimeLogs.loading

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble academique et disciplinaire.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button onClick={() => onNavigate('bulletins')} className="rounded-card border border-border bg-primary-950 p-4 text-left text-white transition hover:bg-primary-900">
          <p className="text-sm font-semibold">Approuver les bulletins</p>
          <p className="mt-1 text-xs text-white/70">{pendingBulletins.data?.length || 0} en attente</p>
        </button>
        <button onClick={() => onNavigate('discipline')} className="rounded-card border border-border bg-accent-600 p-4 text-left text-white transition hover:bg-accent-700">
          <p className="text-sm font-semibold">Revue disciplinaire</p>
          <p className="mt-1 text-xs text-white/70">{pendingDiscipline.data?.length || 0} en attente</p>
        </button>
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Bulletins en attente" value={pendingBulletins.data?.length || 0} tone={pendingBulletins.data?.length > 0 ? 'accent' : 'success'} />
            <StatCard label="Discipline en attente" value={pendingDiscipline.data?.length || 0} tone={pendingDiscipline.data?.length > 0 ? 'accent' : 'success'} />
            <StatCard label="Incidents ouverts" value={openIncidents.data?.length || 0} tone={openIncidents.data?.length > 0 ? 'accent' : 'success'} />
            <StatCard label="Heures a confirmer" value={pendingTimeLogs.data?.length || 0} tone={pendingTimeLogs.data?.length > 0 ? 'accent' : 'success'} />
          </div>

          <Card>
            <CardHeader title="Incidents recents" subtitle="Signales par la surveillance" />
            <CardBody className="p-0">
              {(openIncidents.data || []).length === 0 && <div className="p-4"><EmptyState title="Aucun incident ouvert" /></div>}
              <ul className="divide-y divide-border">
                {(openIncidents.data || []).slice(0, 5).map((inc) => (
                  <li key={inc.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{inc.description}</p>
                      <p className="text-xs text-ink-muted">{inc.location} - {new Date(inc.occurred_at).toLocaleString('fr-FR')}</p>
                    </div>
                    <Badge tone="warning">{inc.kind}</Badge>
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

function BulletinsTab() {
  const { user } = useAuth()
  const [cycle, setCycle] = useState('')
  const pending = useApiGet(`/api/academics/bulletins/pending-approval/?cycle=${cycle}`)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const approve = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/bulletins/${id}/approve/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CycleSwitcher userCycleScope={user?.cycle_scope} value={cycle} onChange={setCycle} />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucun bulletin en attente" />}
      {pending.data?.map((b) => (
        <Card key={b.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{b.student_name} - {b.exam_period_label}</p>
              <p className="text-xs text-ink-muted">Moyenne {b.average} - Rang {b.class_rank}/{b.class_size}</p>
            </div>
            <Button size="sm" onClick={() => approve(b.id)} disabled={busy === b.id}>
              {busy === b.id ? 'Validation...' : 'Approuver'}
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function DisciplineTab() {
  const { user } = useAuth()
  const [cycle, setCycle] = useState('')
  const pending = useApiGet(`/api/academics/discipline/pending-approval/?cycle=${cycle}`)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [rejectReason, setRejectReason] = useState({})

  const approve = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/discipline/${id}/approve/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  const reject = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/academics/discipline/${id}/reject/`, { reason: rejectReason[id] || '' })
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CycleSwitcher userCycleScope={user?.cycle_scope} value={cycle} onChange={setCycle} />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucune mesure en attente" />}
      {pending.data?.map((d) => (
        <Card key={d.id}>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{d.student_name}</p>
                <p className="text-xs text-ink-muted">{d.date} - {d.measure} - {d.reason}</p>
                <p className="text-xs text-ink-muted">
                  Signale par {d.issued_by_name}
                  {d.points_deducted > 0 && <span> &bull; -{d.points_deducted} pts discipline</span>}
                </p>
              </div>
              <Badge tone="warning">{d.measure}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <input
                className={INPUT_CLASS}
                placeholder="Motif du rejet (optionnel)"
                value={rejectReason[d.id] || ''}
                onChange={(e) => setRejectReason({ ...rejectReason, [d.id]: e.target.value })}
              />
              <Button size="sm" variant="danger" onClick={() => reject(d.id)} disabled={busy === d.id}>Rejeter</Button>
              <Button size="sm" onClick={() => approve(d.id)} disabled={busy === d.id}>Approuver</Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function CalendrierTab() {
  const classrooms = useApiGet('/api/students/classrooms/')
  const classSubjects = useApiGet('/api/academics/class-subjects/')
  const staff = useApiGet('/api/hr/staff/')
  const academicYears = useApiGet('/api/auth/academic-years/')
  const [classroomId, setClassroomId] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const currentYear = academicYears.data?.find((y) => y.is_current) || academicYears.data?.[0]

  const slotsQuery = new URLSearchParams()
  if (classroomId) slotsQuery.set('classroom', classroomId)
  if (teacherId) slotsQuery.set('teacher', teacherId)
  const slots = useApiGet(`/api/academics/timetable-slots/?${slotsQuery.toString()}`)
  const events = useApiGet(`/api/academics/calendar-events/?academic_year=${currentYear?.id || ''}`, { skip: !currentYear })

  const [showSlotForm, setShowSlotForm] = useState(false)
  const [slotForm, setSlotForm] = useState({ class_subject: '', day_of_week: '0', start_time: '08:00', end_time: '09:00' })
  const [slotError, setSlotError] = useState(null)
  const [submittingSlot, setSubmittingSlot] = useState(false)

  const classSubjectOptions = classSubjects.data || []

  const submitSlot = async (e) => {
    e.preventDefault()
    if (!currentYear) return
    setSubmittingSlot(true)
    setSlotError(null)
    try {
      await api.post('/api/academics/timetable-slots/', {
        academic_year: currentYear.id,
        class_subject: Number(slotForm.class_subject),
        day_of_week: Number(slotForm.day_of_week),
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
      })
      setShowSlotForm(false)
      slots.refetch()
    } catch (err) {
      setSlotError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmittingSlot(false)
    }
  }

  const upcomingEvents = (events.data || [])
    .filter((ev) => new Date(ev.date) >= new Date(new Date().toDateString()))
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">Classe</label>
          <select className={INPUT_CLASS} value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
            <option value="">Toutes les classes</option>
            {classrooms.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">Enseignant</label>
          <select className={INPUT_CLASS} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Tous les enseignants</option>
            {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowSlotForm((v) => !v)}>{showSlotForm ? 'Fermer' : '+ Nouveau creneau'}</Button>
        </div>
      </div>

      {showSlotForm && (
        <Card>
          <CardHeader title="Nouveau creneau" subtitle="La classe et l'enseignant sont deduits de la matiere choisie." />
          <CardBody>
            <form onSubmit={submitSlot} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                required className={`sm:col-span-2 ${INPUT_CLASS}`}
                value={slotForm.class_subject}
                onChange={(e) => setSlotForm({ ...slotForm, class_subject: e.target.value })}
              >
                <option value="">Choisir classe + matiere...</option>
                {classSubjectOptions.map((cs) => (
                  <option key={cs.id} value={cs.id}>{cs.classroom_name} - {cs.subject_name}</option>
                ))}
              </select>
              <select className={INPUT_CLASS} value={slotForm.day_of_week} onChange={(e) => setSlotForm({ ...slotForm, day_of_week: e.target.value })}>
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="time" className={INPUT_CLASS} value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} />
                <input type="time" className={INPUT_CLASS} value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} />
              </div>
              {slotError && <p className="text-sm text-danger-600 sm:col-span-2">{slotError}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submittingSlot || !currentYear}>{submittingSlot ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader title="Jours non enseignes a venir" />
          <CardBody className="flex flex-wrap gap-2">
            {upcomingEvents.map((ev) => (
              <Badge key={ev.id} tone={ev.kind === 'holiday' ? 'neutral' : 'warning'}>
                {ev.date} - {ev.label}
              </Badge>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="p-0">
          {slots.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!slots.loading && slots.data?.length === 0 && (
            <div className="p-4"><EmptyState title="Aucun creneau" description="Aucun creneau ne correspond a ces filtres." /></div>
          )}
          <div className="divide-y divide-border">
            {DAYS.map((day) => {
              const dayRows = (slots.data || [])
                .filter((s) => s.day_of_week === day.value)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
              if (dayRows.length === 0) return null
              return (
                <div key={day.value} className="p-4">
                  <p className="text-sm font-semibold text-ink mb-2">{day.label}</p>
                  <ul className="space-y-2">
                    {dayRows.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm">
                        <span className="text-ink">{s.start_time.slice(0, 5)}-{s.end_time.slice(0, 5)} - {s.classroom_name} - {s.subject_name}</span>
                        <span className="text-ink-muted text-xs">{s.teacher_name || 'Sans enseignant'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
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

function ExamsTab() {
  const exams = useApiGet('/api/academics/exam-papers/')

  return (
    <Card>
      <CardHeader title="Epreuves" subtitle="Suivi de redaction et de saisie, lecture seule." />
      <CardBody className="p-0">
        {exams.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!exams.loading && exams.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune epreuve" /></div>}
        <ul className="divide-y divide-border">
          {exams.data?.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">{e.class_label} - {e.subject_name}</p>
                <p className="text-xs text-ink-muted">{e.exam_period_label} - Redige par {e.drafted_by_name || '-'}</p>
              </div>
              <Badge tone={e.status === 'TYPED' ? 'success' : e.status === 'SUBMITTED' ? 'warning' : 'neutral'}>{e.status}</Badge>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
