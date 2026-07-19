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
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'
import CalendarGrid from '../../shared/ui/CalendarGrid.jsx'
import WeeklyTimetableGrid from '../../shared/ui/WeeklyTimetableGrid.jsx'
import StructureTab from './StructureTab.jsx'
import LetterheadSettings from '../../shared/components/LetterheadSettings.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'structure', label: 'Classes & Matières' },
  { key: 'bulletins', label: 'Bulletins' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'calendrier', label: 'Calendrier' },
  { key: 'planification', label: 'Planification' },
  { key: 'timelogs', label: 'Heures vacataires' },
  { key: 'exams', label: 'Epreuves' },
  { key: 'letterhead', label: 'Lettre a en-tete' },
]

const AVAILABILITY_STATUS = {
  submitted: { label: 'Soumis', tone: 'neutral' },
  drafted: { label: 'Brouillon envoye', tone: 'warning' },
  approved: { label: 'Approuve', tone: 'success' },
}

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
        <p className="mt-1 text-sm text-ink-muted">Approbation des bulletins, discipline, heures vacataires, classes, matières et épreuves.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'structure' && <StructureTab />}
      {tab === 'bulletins' && <BulletinsTab />}
      {tab === 'discipline' && <DisciplineTab />}
      {tab === 'calendrier' && <CalendrierTab />}
      {tab === 'planification' && <PlanificationTab />}
      {tab === 'timelogs' && <TimeLogsTab />}
      {tab === 'exams' && <ExamsTab />}
      {tab === 'letterhead' && <LetterheadSettings />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const pendingBulletins = useApiGet('/api/academics/bulletins/pending-approval/')
  const pendingDiscipline = useApiGet('/api/academics/discipline/pending-approval/')
  const openIncidents = useApiGet('/api/academics/incidents/?status=open')
  const pendingTimeLogs = useApiGet('/api/hr/time-logs/?is_confirmed=false')
  const summary = useApiGet('/api/academics/bulletins/school-summary/')

  const loading = pendingBulletins.loading || pendingDiscipline.loading || openIncidents.loading || pendingTimeLogs.loading || summary.loading

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Censorat</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble academique et disciplinaire.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickActionButton icon="fact_check" title="Approuver les bulletins" description={`${pendingBulletins.data?.length || 0} en attente`} onClick={() => onNavigate('bulletins')} />
        <QuickActionButton icon="gavel" title="Revue disciplinaire" description={`${pendingDiscipline.data?.length || 0} en attente`} onClick={() => onNavigate('discipline')} />
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="fact_check" label="Bulletins en attente" value={pendingBulletins.data?.length || 0} tone={pendingBulletins.data?.length > 0 ? 'warning' : 'success'} />
            <StatCard icon="gavel" label="Discipline en attente" value={pendingDiscipline.data?.length || 0} tone={pendingDiscipline.data?.length > 0 ? 'warning' : 'success'} />
            <StatCard icon="emergency" label="Incidents ouverts" value={openIncidents.data?.length || 0} tone={openIncidents.data?.length > 0 ? 'warning' : 'success'} />
            <StatCard icon="schedule" label="Heures a confirmer" value={pendingTimeLogs.data?.length || 0} tone={pendingTimeLogs.data?.length > 0 ? 'warning' : 'success'} />
          </div>

          {summary.data?.overall_average != null && (
            <Card>
              <CardHeader title="Performance moyenne" subtitle="Derniere periode d'examen avec bulletins" />
              <CardBody>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-ink">{summary.data.overall_average}<span className="text-base font-normal text-ink-muted">/20</span></p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{ width: `${Math.min(100, (summary.data.overall_average / 20) * 100)}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {summary.data?.levels?.length > 0 && (
            <Card>
              <CardHeader title="Repartition des notes par niveau" />
              <CardBody className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-ink-muted">
                      <th className="p-3">Niveau</th>
                      <th className="p-3">Moyenne</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.data.levels.map((row) => (
                      <tr key={row.level}>
                        <td className="p-3 text-ink">{row.level_label}</td>
                        <td className="p-3 tabular-nums text-ink">{row.average}/20</td>
                        <td className="p-3">
                          <Badge tone={row.status === 'on_track' ? 'success' : 'warning'}>
                            {row.status === 'on_track' ? 'Sur la bonne voie' : 'A surveiller'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

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
    <div className="space-y-4">
      <GenerateBulletinsForm onGenerated={() => pending.refetch()} />

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
              <p className="text-xs text-ink-muted">
                Moyenne {b.average} - Rang {b.class_rank}/{b.class_size}
                {b.discipline_score != null && ` - ${b.discipline_score} pts discipline`}
              </p>
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

function GenerateBulletinsForm({ onGenerated }) {
  const classrooms = useApiGet('/api/students/classrooms/')
  const examPeriods = useApiGet('/api/academics/exam-periods/')
  const [classroomId, setClassroomId] = useState('')
  const [examPeriodId, setExamPeriodId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const generate = async () => {
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.post('/api/academics/bulletins/generate/', {
        classroom: Number(classroomId), exam_period: Number(examPeriodId),
      })
      setResult(res.length)
      onGenerated?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Generer les bulletins" subtitle="Calcule la moyenne, le rang, la presence et les points de discipline pour chaque eleve ayant des notes saisies." />
      <CardBody className="flex flex-wrap items-end gap-3">
        <select className={INPUT_CLASS} value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
          <option value="">Choisir la classe...</option>
          {classrooms.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={INPUT_CLASS} value={examPeriodId} onChange={(e) => setExamPeriodId(e.target.value)}>
          <option value="">Choisir la periode...</option>
          {examPeriods.data?.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <Button size="sm" onClick={generate} disabled={!classroomId || !examPeriodId || submitting}>
          {submitting ? 'Generation...' : 'Generer'}
        </Button>
        {error && <p className="w-full text-sm text-danger-600">{error}</p>}
        {result != null && <p className="w-full text-sm text-success-600">{result} bulletin(s) genere(s).</p>}
      </CardBody>
    </Card>
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
  const [selectedDate, setSelectedDate] = useState(null)

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

  const selectedDayEvents = selectedDate ? (events.data || []).filter((ev) => ev.date === selectedDate) : []

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
            {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
          </select>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowSlotForm((v) => !v)}>{showSlotForm ? 'Fermer' : '+ Nouveau creneau'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarGrid events={events.data || []} selectedDate={selectedDate} onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)} />
        </div>
        <Card>
          <CardHeader title={selectedDate ? new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Selectionnez un jour'} />
          <CardBody className="space-y-2">
            {selectedDate && selectedDayEvents.length === 0 && <p className="text-sm text-ink-muted">Aucun evenement ce jour.</p>}
            {selectedDayEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-control border border-border p-2">
                <p className="text-sm text-ink">{ev.label}</p>
                <Badge tone={ev.kind === 'holiday' ? 'neutral' : 'warning'}>{ev.kind === 'holiday' ? 'Ferie' : 'Evenement'}</Badge>
              </div>
            ))}
            {!selectedDate && <p className="text-sm text-ink-muted">Cliquez un jour dans le calendrier pour voir ses evenements.</p>}
          </CardBody>
        </Card>
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
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upcomingEvents.map((ev) => {
              const d = new Date(ev.date)
              return (
                <div key={ev.id} className="flex items-center gap-3 rounded-card border border-border p-3 transition hover:shadow-elevated">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-control bg-surface">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-lg font-bold text-ink">{d.getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <Badge tone={ev.kind === 'holiday' ? 'neutral' : 'warning'}>{ev.kind === 'holiday' ? 'Ferie' : 'Evenement'}</Badge>
                    <p className="mt-1 truncate text-sm font-medium text-ink">{ev.label}</p>
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}

      {slots.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!slots.loading && slots.data?.length === 0 && (
        <EmptyState title="Aucun creneau" description="Aucun creneau ne correspond a ces filtres." />
      )}
      {!slots.loading && slots.data?.length > 0 && <WeeklyTimetableGrid slots={slots.data} />}
    </div>
  )
}

function PlanificationTab() {
  const submissions = useApiGet('/api/hr/teacher-availability/')
  const conflicts = useApiGet('/api/hr/timetable-conflicts/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const review = async (id, newStatus) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/hr/teacher-availability/${id}/review/`, { status: newStatus })
      submissions.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Conflits d'emploi du temps"
          subtitle="Detectes automatiquement a partir des creneaux reels (meme enseignant ou meme salle, horaires qui se chevauchent)."
        />
        <CardBody className="p-0">
          {conflicts.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!conflicts.loading && (conflicts.data || []).length === 0 && (
            <div className="p-4"><EmptyState title="Aucun conflit detecte" /></div>
          )}
          <ul className="divide-y divide-border">
            {(conflicts.data || []).map((c, i) => (
              <li key={i} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-sm text-ink">{c.detail_a}</p>
                  <p className="text-sm text-ink">{c.detail_b}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {c.kind === 'teacher' ? `Meme enseignant : ${c.teacher_name}` : `Meme salle : ${c.classroom_name}`}
                  </p>
                </div>
                <Badge tone="warning">{c.kind === 'teacher' ? 'Enseignant' : 'Salle'}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Soumissions des enseignants" subtitle="Preferences pour la prochaine planification." />
        <CardBody className="p-0">
          {error && <p className="p-4 text-sm text-danger-600">{error}</p>}
          {submissions.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!submissions.loading && (submissions.data || []).length === 0 && (
            <div className="p-4"><EmptyState title="Aucune soumission" /></div>
          )}
          <ul className="divide-y divide-border">
            {(submissions.data || []).map((s) => {
              const status = AVAILABILITY_STATUS[s.status] || { label: s.status, tone: 'neutral' }
              return (
                <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.staff_name}{s.subject_name && ` - ${s.subject_name}`}</p>
                    <p className="text-sm text-ink-muted">{s.notes}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {s.hours_requested != null && `${s.hours_requested} h souhaitees - `}
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {s.status === 'submitted' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => review(s.id, 'drafted')} disabled={busy === s.id}>
                          Brouillon envoye
                        </Button>
                        <Button size="sm" onClick={() => review(s.id, 'approved')} disabled={busy === s.id}>
                          Approuver
                        </Button>
                      </>
                    )}
                    {s.status === 'drafted' && (
                      <Button size="sm" onClick={() => review(s.id, 'approved')} disabled={busy === s.id}>
                        Approuver
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
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
