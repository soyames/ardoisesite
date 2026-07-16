import { useEffect, useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const TABS = [
  { key: 'grades', label: 'Notes' },
  { key: 'attendance', label: 'Presences' },
  { key: 'exampaper', label: "Epreuve" },
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
  const [tab, setTab] = useState('grades')

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

      {!myClasses.loading && (!myClasses.data || myClasses.data.length === 0) && (
        <EmptyState
          title="Aucune classe assignee"
          description="Contactez le Censeur si vous devriez avoir des classes ici."
        />
      )}

      {!myClasses.loading && myClasses.data?.length > 0 && (
        <>
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

          <div className="flex gap-1 border-b border-border">
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

          {selectedClass && tab === 'grades' && (
            <GradesPanel classSubject={selectedClass} examPeriods={examPeriods.data} />
          )}
          {selectedClass && tab === 'attendance' && <AttendancePanel classSubject={selectedClass} />}
          {selectedClass && tab === 'exampaper' && (
            <ExamPaperPanel classSubject={selectedClass} examPeriods={examPeriods.data} />
          )}
        </>
      )}
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
