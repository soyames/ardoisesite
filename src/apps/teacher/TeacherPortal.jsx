import { useEffect, useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import MonEspaceRH from '../../shared/components/MonEspaceRH.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'
import WeeklyTimetableGrid from '../../shared/ui/WeeklyTimetableGrid.jsx'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'grades', label: 'Notes' },
  { key: 'attendance', label: 'Presences' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'exampaper', label: "Epreuve" },
  { key: 'timetable', label: 'Emploi du temps' },
  { key: 'availability', label: 'Disponibilites' },
  { key: 'rh', label: 'Mon espace RH' },
]

const AVAILABILITY_STATUS = {
  submitted: { label: 'Soumis', tone: 'neutral' },
  drafted: { label: 'Brouillon envoye', tone: 'warning' },
  approved: { label: 'Approuve', tone: 'success' },
}

const MEASURES = [
  { value: 'warning', label: 'Avertissement' },
  { value: 'detention', label: "Heure(s) de colle" },
  { value: 'suspension', label: 'Suspension' },
  { value: 'expulsion', label: 'Renvoi' },
]

/**
 * Grade entry, attendance, and exam paper drafting -- the offline-
 * sensitive flows the backend's local_uuid/created_offline/synced_at
 * fields exist for (see ardoise/apps/core/models.py:TimeStampedModel).
 * This first pass posts straight to the sync endpoints while online;
 * a real offline queue (IndexedDB + background sync) is flagged as
 * not-yet-built rather than faked -- see the code comment on
 * submitGradeEntries below.
 */
export default function TeacherPortal() {
  const myClasses = useApiGet('/api/academics/my-classes/')
  const examPeriods = useApiGet('/api/academics/exam-periods/')
  const [classSubjectId, setClassSubjectId] = useState(null)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    if (!classSubjectId && myClasses.data?.length > 0) {
      setClassSubjectId(myClasses.data[0].id)
    }
  }, [myClasses.data, classSubjectId])

  const selectedClass = myClasses.data?.find((c) => c.id === classSubjectId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mes classes</h1>
        <p className="mt-1 text-sm text-ink-muted">Notes, presences et epreuves pour vos classes.</p>
      </div>

      {myClasses.loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!myClasses.loading && (
        <>
          {myClasses.data?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {myClasses.data.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClassSubjectId(c.id)}
                  className={`rounded-control px-4 py-2 text-sm font-medium transition ${
                    classSubjectId === c.id ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  {c.classroom_name} - {c.subject_name}
                </button>
              ))}
            </div>
          )}

          <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === 'dashboard' && <DashboardTab myClasses={myClasses.data} onNavigate={setTab} />}
          {tab === 'timetable' && <TimetablePanel />}
          {tab === 'availability' && <AvailabilityPanel />}

          {tab !== 'rh' && tab !== 'dashboard' && tab !== 'timetable' && tab !== 'availability' && (!myClasses.data || myClasses.data.length === 0) && (
            <EmptyState
              title="Aucune classe assignee"
              description="Contactez le Censeur si vous devriez avoir des classes ici."
            />
          )}

          {selectedClass && tab === 'grades' && (
            <GradesPanel classSubject={selectedClass} examPeriods={examPeriods.data} />
          )}
          {selectedClass && tab === 'attendance' && <AttendancePanel classSubject={selectedClass} />}
          {selectedClass && tab === 'discipline' && <DisciplinePanel classSubject={selectedClass} />}
          {selectedClass && tab === 'exampaper' && (
            <ExamPaperPanel classSubject={selectedClass} examPeriods={examPeriods.data} />
          )}
          {tab === 'rh' && <MonEspaceRH />}
        </>
      )}
    </div>
  )
}

function DashboardTab({ myClasses, onNavigate }) {
  const examPapers = useApiGet('/api/academics/exam-papers/')
  const draftPapers = (examPapers.data || []).filter((p) => p.status === 'draft')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Mes classes</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble de vos classes.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickActionButton icon="edit_note" title="Saisir les notes" description="Notes pour la classe selectionnee" onClick={() => onNavigate('grades')} />
        <QuickActionButton icon="how_to_reg" title="Faire l'appel" description="Enregistrer la presence" onClick={() => onNavigate('attendance')} />
        <QuickActionButton icon="schedule" title="Emploi du temps" description="Voir mes creneaux" onClick={() => onNavigate('timetable')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon="school" label="Classes assignees" value={myClasses?.length || 0} />
        <StatCard icon="quiz" label="Epreuves en brouillon" value={draftPapers.length} tone={draftPapers.length > 0 ? 'warning' : 'success'} />
      </div>
    </div>
  )
}

function TimetablePanel() {
  const slots = useApiGet('/api/academics/timetable-slots/?teacher=me')

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink">Mon emploi du temps</p>
        <p className="text-xs text-ink-muted">Vos creneaux d'enseignement pour la semaine.</p>
      </div>
      {slots.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!slots.loading && (slots.data || []).length === 0 && (
        <EmptyState title="Aucun creneau assigne" description="Contactez le Censeur si vous devriez avoir des creneaux ici." />
      )}
      {!slots.loading && (slots.data || []).length > 0 && <WeeklyTimetableGrid slots={slots.data} />}
    </div>
  )
}

function AvailabilityPanel() {
  const submissions = useApiGet('/api/hr/teacher-availability/')
  const [notes, setNotes] = useState('')
  const [hoursRequested, setHoursRequested] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/teacher-availability/', {
        notes,
        hours_requested: hoursRequested ? Number(hoursRequested) : null,
      })
      setNotes('')
      setHoursRequested('')
      submissions.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Soumettre mes disponibilites"
          subtitle="Preferences pour la prochaine planification (ex: matinees pour la 3eme, pas le mercredi apres-midi)."
        />
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Vos preferences pour le prochain trimestre..."
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Heures souhaitees (optionnel)</label>
                <input
                  type="number"
                  min="0"
                  value={hoursRequested}
                  onChange={(e) => setHoursRequested(e.target.value)}
                  className="w-32 rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <Button type="submit" disabled={submitting || !notes.trim()}>
                {submitting ? 'Envoi...' : 'Soumettre'}
              </Button>
            </div>
            {error && <p className="text-sm text-danger-600">{error}</p>}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mes soumissions" />
        <CardBody className="p-0">
          {submissions.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!submissions.loading && (submissions.data || []).length === 0 && (
            <div className="p-4"><EmptyState title="Aucune soumission" description="Vos disponibilites soumises apparaitront ici." /></div>
          )}
          <ul className="divide-y divide-border">
            {(submissions.data || []).map((s) => {
              const status = AVAILABILITY_STATUS[s.status] || { label: s.status, tone: 'neutral' }
              return (
                <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-ink">{s.notes}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {s.hours_requested != null && `${s.hours_requested} h souhaitees - `}
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </li>
              )
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function useRoster(classroomId) {
  return useApiGet(classroomId ? `/api/students/roster/?classroom=${classroomId}` : null, { skip: !classroomId })
}

function GradesPanel({ classSubject, examPeriods }) {
  const roster = useRoster(classSubject.classroom_id)
  const [examPeriodId, setExamPeriodId] = useState(examPeriods?.[0]?.id ?? '')
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!examPeriodId && examPeriods?.length > 0) setExamPeriodId(examPeriods[0].id)
  }, [examPeriods, examPeriodId])

  async function handleSave() {
    setSaving(true)
    setResult(null)
    // Online-only for this first pass: posts straight through
    // /api/academics/grade-entries/sync/ while connected. The upsert-
    // by-local_uuid shape already supports a real offline queue
    // (write to IndexedDB, retry this same POST on reconnect) -- that
    // queue itself is not built yet, flagged rather than faked.
    const entries = Object.entries(scores)
      .filter(([, score]) => score !== '' && score !== undefined)
      .map(([enrollmentId, score]) => ({
        local_uuid: crypto.randomUUID(),
        enrollment: Number(enrollmentId),
        class_subject: classSubject.id,
        exam_period: Number(examPeriodId),
        score,
        max_score: 20,
        created_offline: false,
      }))
    try {
      const res = await api.post('/api/academics/grade-entries/sync/', entries)
      setResult(res.results)
    } catch (err) {
      setResult([{ status: 'error', detail: err instanceof ApiError ? err.message : 'Echec' }])
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Saisie des notes"
        subtitle="Notes sur 20"
        action={
          <select
            value={examPeriodId}
            onChange={(e) => setExamPeriodId(e.target.value)}
            className="rounded-control border border-border bg-surface px-2 py-1 text-xs"
          >
            {examPeriods?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        }
      />
      <CardBody>
        {roster.loading && <Spinner />}
        {!roster.loading && (!roster.data || roster.data.length === 0) && <EmptyState title="Aucun eleve dans cette classe" />}
        {!roster.loading && roster.data?.length > 0 && (
          <div className="space-y-2">
            {roster.data.map((student) => (
              <div key={student.id} className="flex items-center justify-between gap-3 rounded-control border border-border p-2.5">
                <p className="text-sm text-ink">
                  {student.student_name} <span className="text-ink-muted">({student.matricule})</span>
                  {student.discipline_score != null && (
                    <span className={`ml-2 text-xs ${student.discipline_score < 10 ? 'text-danger-600' : 'text-ink-muted'}`}>
                      &bull; {student.discipline_score} pts discipline
                    </span>
                  )}
                </p>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={scores[student.id] ?? ''}
                  onChange={(e) => setScores((s) => ({ ...s, [student.id]: e.target.value }))}
                  className="w-20 rounded-control border border-border bg-surface px-2 py-1 text-sm text-right outline-none focus:border-primary-500"
                />
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving} className="mt-2">
              {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
            </Button>
            {result && (
              <p className="text-xs text-ink-muted">
                {result.filter((r) => r.status !== 'error').length} enregistree(s), {result.filter((r) => r.status === 'error').length} erreur(s).
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

const ATTENDANCE_STATES = [
  { value: 'present', label: 'Present', tone: 'success' },
  { value: 'absent_excused', label: 'Absent (justifie)', tone: 'warning' },
  { value: 'absent_unexcused', label: 'Absent (non justifie)', tone: 'danger' },
  { value: 'late', label: 'Retard', tone: 'warning' },
]

function AttendancePanel({ classSubject }) {
  const roster = useRoster(classSubject.classroom_id)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [states, setStates] = useState({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSave() {
    setSaving(true)
    setResult(null)
    const entries = Object.entries(states).map(([enrollmentId, state]) => ({
      local_uuid: crypto.randomUUID(),
      enrollment: Number(enrollmentId),
      date,
      class_subject: classSubject.id,
      state,
      created_offline: false,
    }))
    try {
      const res = await api.post('/api/academics/attendance/sync/', entries)
      setResult(res.results)
    } catch (err) {
      setResult([{ status: 'error', detail: err instanceof ApiError ? err.message : 'Echec' }])
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Appel"
        action={
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-control border border-border bg-surface px-2 py-1 text-xs"
          />
        }
      />
      <CardBody>
        {roster.loading && <Spinner />}
        {!roster.loading && roster.data?.length > 0 && (
          <div className="space-y-2">
            {roster.data.map((student) => (
              <div key={student.id} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border p-2.5">
                <p className="text-sm text-ink">{student.student_name}</p>
                <div className="flex flex-wrap gap-1">
                  {ATTENDANCE_STATES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStates((prev) => ({ ...prev, [student.id]: s.value }))}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        states[student.id] === s.value ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving} className="mt-2">
              {saving ? 'Enregistrement...' : "Enregistrer l'appel"}
            </Button>
            {result && (
              <p className="text-xs text-ink-muted">
                {result.filter((r) => r.status !== 'error').length} enregistree(s), {result.filter((r) => r.status === 'error').length} erreur(s).
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function ExamPaperPanel({ classSubject, examPeriods }) {
  const [examPeriodId, setExamPeriodId] = useState('')
  const [content, setContent] = useState('')
  const [paper, setPaper] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!examPeriodId && examPeriods?.length > 0) setExamPeriodId(examPeriods[0].id)
  }, [examPeriods, examPeriodId])

  async function handleSaveDraft() {
    setBusy(true)
    setError('')
    try {
      const res = await api.post('/api/academics/exam-papers/draft/', {
        class_subject: classSubject.id,
        exam_period: Number(examPeriodId),
        draft_content: content,
      })
      setPaper(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Echec')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit() {
    if (!paper) return
    setBusy(true)
    setError('')
    try {
      const res = await api.post(`/api/academics/exam-papers/${paper.id}/submit/`)
      setPaper(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Echec')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Epreuve"
        subtitle="Redigez le contenu, puis soumettez pour la saisie par le/la secretaire."
        action={
          <select
            value={examPeriodId}
            onChange={(e) => setExamPeriodId(e.target.value)}
            className="rounded-control border border-border bg-surface px-2 py-1 text-xs"
          >
            {examPeriods?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        }
      />
      <CardBody className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          placeholder="Ecrivez les questions/instructions de l'epreuve ici..."
          disabled={paper?.status && paper.status !== 'draft'}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary-500 disabled:opacity-60"
        />

        {paper && <Badge tone={paper.status === 'draft' ? 'neutral' : 'success'}>{paper.status}</Badge>}
        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSaveDraft} disabled={busy || (paper && paper.status !== 'draft')}>
            Enregistrer le brouillon
          </Button>
          <Button onClick={handleSubmit} disabled={busy || !paper || paper.status !== 'draft'}>
            Soumettre pour saisie
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function DisciplinePanel({ classSubject }) {
  const roster = useRoster(classSubject.classroom_id)
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
      <CardHeader title="Signaler une mesure disciplinaire" subtitle="Avertissement/colle prennent effet immediatement; suspension/renvoi passent par l'approbation du Censeur ou du Surveillant." />
      <CardBody>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select required className="rounded-control border border-border bg-surface px-3 py-2 text-sm" value={form.enrollment} onChange={(e) => setForm({ ...form, enrollment: e.target.value })}>
            <option value="">Choisir l'eleve...</option>
            {roster.data?.map((r) => <option key={r.id} value={r.id}>{r.student_name}</option>)}
          </select>
          {selectedStudent && (
            <p className="text-xs text-ink-muted">
              Points de discipline actuels : <span className="font-semibold text-ink">{selectedStudent.discipline_score}</span>
            </p>
          )}
          <input required type="date" className="rounded-control border border-border bg-surface px-3 py-2 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <select className="rounded-control border border-border bg-surface px-3 py-2 text-sm" value={form.measure} onChange={(e) => setForm({ ...form, measure: e.target.value })}>
            {MEASURES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {form.measure === 'detention' && (
            <input type="number" className="rounded-control border border-border bg-surface px-3 py-2 text-sm" placeholder="Nombre d'heures" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Points a deduire (selon la gravite)</label>
            <input type="number" min="0" className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm" placeholder="ex: 2" value={form.points_deducted} onChange={(e) => setForm({ ...form, points_deducted: e.target.value })} />
          </div>
          <textarea required className="rounded-control border border-border bg-surface px-3 py-2 text-sm sm:col-span-2" placeholder="Motif" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
          {success && <p className="text-sm text-success-600 sm:col-span-2">Mesure enregistree.</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
        </form>
      </CardBody>
    </Card>
  )
}
