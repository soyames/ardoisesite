import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import LetterheadSettings from '../../shared/components/LetterheadSettings.jsx'
import Encaissement from '../../shared/components/Encaissement.jsx'
import AppointmentSlotsPanel from '../../shared/components/AppointmentSlotsPanel.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'students', label: 'Eleves' },
  { key: 'parents', label: 'Parents' },
  { key: 'guardianships', label: 'Tutelle' },
  { key: 'enrollments', label: 'Inscriptions' },
  { key: 'appointments', label: 'Rendez-vous' },
  { key: 'encaissement', label: 'Encaissement' },
  { key: 'letterhead', label: 'Lettre a en-tete' },
]

/**
 * Secretary's registration flow: create a Student, link them to an
 * existing Parent via Guardianship, then Enrollment places the student
 * into a classroom for an academic year. Parents are never created
 * here - they register themselves on the marketplace, and accepting
 * that request (Founder/Director's "Demandes d'inscription" panel) is
 * what creates the Parent + Student + Guardianship + Enrollment rows
 * together (see core/api_views.py:MarketplaceEnrollmentAcceptView).
 * The Parents tab below is a read-only directory for front-desk lookup.
 */
export default function SecretaryPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Secretariat</h1>
        <p className="mt-1 text-sm text-ink-muted">Inscription des eleves, parents, et affectation en classe.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'students' && <StudentsTab />}
      {tab === 'parents' && <ParentsTab />}
      {tab === 'guardianships' && <GuardianshipsTab />}
      {tab === 'enrollments' && <EnrollmentsTab />}
      {tab === 'appointments' && <AppointmentSlotsPanel />}
      {tab === 'encaissement' && <Encaissement />}
      {tab === 'letterhead' && <LetterheadSettings />}
    </div>
  )
}

/**
 * Landing view for the portal - a real snapshot (active students, parent
 * directory size, active enrollments) built entirely from the same three
 * endpoints the other tabs already call, plus guardianships (already used
 * by GuardianshipsTab) to surface students still missing a linked parent.
 * No new backend endpoints, no invented "activity log" - the recent-activity
 * feed is just the latest real enrollments.
 */
function DashboardTab({ onNavigate }) {
  const { user } = useAuth()
  const students = useApiGet('/api/students/students/')
  const parents = useApiGet('/api/students/parents/')
  const enrollments = useApiGet('/api/students/enrollments/')
  const guardianships = useApiGet('/api/students/guardianships/')

  const totalStudents = students.data?.length ?? 0
  const activeStudents = students.data?.filter((s) => (s.status || 'active') === 'active').length ?? 0
  const totalParents = parents.data?.length ?? 0
  const totalEnrollments = enrollments.data?.length ?? 0
  const activeEnrollments = enrollments.data?.filter((e) => e.is_active).length ?? 0

  const linkedStudentIds = new Set((guardianships.data ?? []).map((g) => g.student))
  const unlinkedCount = (students.data ?? []).filter((s) => !linkedStudentIds.has(s.id)).length

  const recentEnrollments = [...(enrollments.data ?? [])].sort((a, b) => b.id - a.id).slice(0, 5)

  const firstName = user?.first_name || user?.name?.split(' ')[0] || 'Secretaire'

  const recentEnrollmentItems = recentEnrollments.map((e) => ({
    id: e.id,
    icon: 'school',
    iconTone: e.is_active ? 'success' : 'primary',
    title: e.student_name,
    subtitle: `${e.classroom_name} - inscrit le ${e.enrolled_on}`,
    badge: e.is_active ? 'Actif' : 'Inactif',
    badgeTone: e.is_active ? 'success' : 'neutral',
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Secretariat</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bienvenue, {firstName}</h2>
        <p className="mt-1 text-sm text-ink-muted">Voici un apercu de l'activite au secretariat aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickActionButton icon="person_add" title="Nouvel eleve" description="Enregistrer un eleve dans l'ecole" onClick={() => onNavigate('students')} />
        <QuickActionButton icon="school" title="Nouvelle inscription" description="Affecter un eleve a une classe" onClick={() => onNavigate('enrollments')} />
        <QuickActionButton icon="family_restroom" title="Lier un tuteur" description="Associer un eleve a un parent" onClick={() => onNavigate('guardianships')} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => onNavigate('students')} className="w-full text-left">
          <StatCard
            icon="groups"
            label="Eleves actifs"
            value={students.loading ? '...' : activeStudents}
            hint={`${totalStudents} au total - voir les eleves`}
            tone="primary"
          />
        </button>
        <button type="button" onClick={() => onNavigate('parents')} className="w-full text-left">
          <StatCard
            icon="family_restroom"
            label="Parents"
            value={parents.loading ? '...' : totalParents}
            hint="Annuaire - voir les parents"
            tone="primary"
          />
        </button>
        <button type="button" onClick={() => onNavigate('enrollments')} className="w-full text-left">
          <StatCard
            icon="school"
            label="Inscriptions actives"
            value={enrollments.loading ? '...' : activeEnrollments}
            hint={`${totalEnrollments} au total - voir les inscriptions`}
            tone="success"
          />
        </button>
      </div>

      {!guardianships.loading && !students.loading && unlinkedCount > 0 && (
        <button
          type="button"
          onClick={() => onNavigate('guardianships')}
          className="flex w-full items-center justify-between rounded-card border border-accent-200 bg-accent-50 px-4 py-3 text-left transition hover:bg-accent-100"
        >
          <span className="text-sm font-medium text-accent-700">
            {unlinkedCount} eleve{unlinkedCount > 1 ? 's' : ''} sans tuteur lie{unlinkedCount > 1 ? 's' : ''} - urgent
          </span>
          <span className="text-xs font-medium text-accent-700">Lier maintenant &rarr;</span>
        </button>
      )}

      <Card>
        <CardHeader title="Activite recente" subtitle="Dernieres inscriptions enregistrees" />
        {enrollments.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!enrollments.loading && <ActivityList items={recentEnrollmentItems} emptyLabel="Aucune activite recente." />}
      </Card>
    </div>
  )
}

function StudentsTab() {
  const students = useApiGet('/api/students/students/')
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ matricule: '', first_name: '', last_name: '', sex: 'M', date_of_birth: '', birth_place: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/students/students/', form)
      setForm({ matricule: '', first_name: '', last_name: '', sex: 'M', date_of_birth: '', birth_place: '' })
      setShowForm(false)
      students.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  if (selectedId) {
    return <StudentProfile studentId={selectedId} onBack={() => setSelectedId(null)} onUpdated={students.refetch} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouvel eleve'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Nouvel eleve" />
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required className={INPUT_CLASS} placeholder="Matricule (ex: STU-0002)" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} />
              <select className={INPUT_CLASS} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
              <input required className={INPUT_CLASS} placeholder="Prenom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <input type="date" className={INPUT_CLASS} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              <input className={INPUT_CLASS} placeholder="Lieu de naissance" value={form.birth_place} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} />
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="p-0">
          {students.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!students.loading && students.data?.length === 0 && (
            <div className="p-4"><EmptyState title="Aucun eleve enregistre" /></div>
          )}
          <ul className="divide-y divide-border">
            {students.data?.map((s) => (
              <li
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-surface-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{s.last_name} {s.first_name}</p>
                    <p className="text-xs text-ink-muted">{s.matricule} {s.date_of_birth && `- ne(e) le ${s.date_of_birth}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status || 'active'}</Badge>
                  <Icon name="chevron_right" className="text-ink-muted" />
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function StudentProfile({ studentId, onBack, onUpdated }) {
  const student = useApiGet(`/api/students/students/${studentId}/`)
  const enrollments = useApiGet(`/api/students/enrollments/?student=${studentId}`)
  const guardianships = useApiGet(`/api/students/guardianships/?student=${studentId}`)
  const currentEnrollment = enrollments.data?.find((e) => e.is_active) || enrollments.data?.[0]
  const bulletins = useApiGet(currentEnrollment ? `/api/academics/bulletins/?enrollment=${currentEnrollment.id}` : null, { skip: !currentEnrollment })
  const attendance = useApiGet(currentEnrollment ? `/api/academics/attendance/?enrollment=${currentEnrollment.id}` : null, { skip: !currentEnrollment })

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const startEditing = () => {
    setForm({
      matricule: student.data.matricule, first_name: student.data.first_name, last_name: student.data.last_name,
      sex: student.data.sex, date_of_birth: student.data.date_of_birth || '', birth_place: student.data.birth_place || '',
    })
    setEditing(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/api/students/students/${studentId}/`, form)
      setEditing(false)
      student.refetch()
      onUpdated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSaving(false)
    }
  }

  const absenceCount = attendance.data?.filter((a) => a.state.startsWith('absent')).length ?? 0

  if (student.loading) {
    return <div className="flex justify-center py-10"><Spinner /></div>
  }
  if (!student.data) {
    return <EmptyState title="Eleve introuvable" />
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
        <Icon name="arrow_back" className="text-base" /> Retour aux eleves
      </button>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {student.data.first_name?.[0]}{student.data.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">{student.data.last_name} {student.data.first_name}</h2>
              <p className="text-sm text-ink-muted">
                {student.data.matricule} - {currentEnrollment?.classroom_name || 'Non inscrit(e)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={student.data.status === 'active' ? 'success' : 'neutral'}>{student.data.status || 'active'}</Badge>
            <Button size="sm" variant="secondary" onClick={startEditing}>Modifier</Button>
          </div>
        </CardBody>
      </Card>

      {editing && (
        <Card>
          <CardHeader title="Modifier la fiche eleve" />
          <CardBody>
            <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required className={INPUT_CLASS} placeholder="Matricule" value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} />
              <select className={INPUT_CLASS} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
              <input required className={INPUT_CLASS} placeholder="Prenom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <input type="date" className={INPUT_CLASS} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              <input className={INPUT_CLASS} placeholder="Lieu de naissance" value={form.birth_place} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} />
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="school" label="Inscriptions" value={enrollments.data?.length || 0} />
        <StatCard icon="fact_check" label="Bulletins publies" value={bulletins.data?.length || 0} />
        <StatCard icon="event_busy" label="Absences" value={absenceCount} tone={absenceCount > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tuteurs lies" />
          <ActivityList
            emptyLabel="Aucun tuteur lie a cet eleve."
            items={(guardianships.data || []).map((g) => ({
              id: g.id, icon: 'family_restroom', iconTone: 'primary',
              title: g.parent_name, subtitle: g.relation,
              badge: g.is_primary_payer ? 'Payeur principal' : undefined, badgeTone: 'neutral',
            }))}
          />
        </Card>

        <Card>
          <CardHeader title="Historique des inscriptions" />
          <ActivityList
            emptyLabel="Aucune inscription enregistree."
            items={(enrollments.data || []).map((e) => ({
              id: e.id, icon: 'school', iconTone: e.is_active ? 'success' : 'primary',
              title: e.classroom_name, subtitle: `Inscrit le ${e.enrolled_on}`,
              badge: e.is_active ? 'Actif' : 'Inactif', badgeTone: e.is_active ? 'success' : 'neutral',
            }))}
          />
        </Card>

        <Card>
          <CardHeader title="Bulletins" subtitle="Publies par l'ecole" />
          {bulletins.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!bulletins.loading && (
            <ActivityList
              emptyLabel="Aucun bulletin publie pour l'instant."
              items={(bulletins.data || []).map((b) => ({
                id: b.id, icon: 'fact_check', iconTone: 'success',
                title: b.exam_period_label, subtitle: `Moyenne ${b.average} - Rang ${b.class_rank}/${b.class_size}`,
                badge: 'Publie', badgeTone: 'success',
              }))}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Presence" subtitle={`${absenceCount} absence(s) enregistree(s)`} />
          {attendance.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!attendance.loading && (
            <div className="max-h-64 overflow-y-auto">
              <ActivityList
                emptyLabel="Aucun enregistrement de presence."
                items={(attendance.data || []).slice(0, 20).map((a) => ({
                  id: a.id, icon: a.state === 'present' ? 'check_circle' : a.state.startsWith('absent') ? 'cancel' : 'schedule',
                  iconTone: a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning',
                  title: a.date,
                  badge: a.state, badgeTone: a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning',
                }))}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function ParentsTab() {
  const parents = useApiGet('/api/students/parents/')

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">
        Annuaire en lecture seule - un parent cree son propre compte sur la marketplace et
        rejoint l'ecole en soumettant une demande d'inscription, acceptee depuis le Command Center.
      </p>

      <Card>
        <CardBody className="p-0">
          {parents.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!parents.loading && parents.data?.length === 0 && (
            <div className="p-4"><EmptyState title="Aucun parent enregistre" /></div>
          )}
          <ul className="divide-y divide-border">
            {parents.data?.map((p) => (
              <li key={p.id} className="p-4">
                <p className="text-sm font-medium text-ink">{p.full_name}</p>
                <p className="text-xs text-ink-muted">{p.phone_primary} {p.profession && `- ${p.profession}`}</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function GuardianshipsTab() {
  const students = useApiGet('/api/students/students/')
  const parents = useApiGet('/api/students/parents/')
  const [studentId, setStudentId] = useState('')
  const [parentId, setParentId] = useState('')
  const [relation, setRelation] = useState('mother')
  const [isPrimaryPayer, setIsPrimaryPayer] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await api.post('/api/students/guardianships/', {
        student: Number(studentId), parent: Number(parentId), relation, is_primary_payer: isPrimaryPayer,
      })
      setSuccess(true)
      setStudentId(''); setParentId('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Lier un eleve a un parent" subtitle="Les deux doivent deja etre enregistres." />
      <CardBody>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select required className={INPUT_CLASS} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Choisir l'eleve...</option>
            {students.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name} ({s.matricule})</option>)}
          </select>
          <select required className={INPUT_CLASS} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Choisir le parent...</option>
            {parents.data?.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select className={INPUT_CLASS} value={relation} onChange={(e) => setRelation(e.target.value)}>
            <option value="mother">Mere</option>
            <option value="father">Pere</option>
            <option value="guardian">Tuteur</option>
            <option value="other">Autre</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isPrimaryPayer} onChange={(e) => setIsPrimaryPayer(e.target.checked)} />
            Payeur principal
          </label>
          {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
          {success && <p className="text-sm text-success-600 sm:col-span-2">Lien cree avec succes.</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Lier'}</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

function EnrollmentsTab() {
  const enrollments = useApiGet('/api/students/enrollments/')
  const students = useApiGet('/api/students/students/')
  const classrooms = useApiGet('/api/students/classrooms/')
  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const classroom = classrooms.data?.find((c) => c.id === Number(classroomId))
      await api.post('/api/students/enrollments/', {
        student: Number(studentId), classroom: Number(classroomId), academic_year: classroom?.academic_year, kind: 'normal',
      })
      setStudentId(''); setClassroomId(''); setShowForm(false)
      enrollments.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouvelle inscription'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Inscrire un eleve dans une classe" />
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select required className={INPUT_CLASS} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Choisir l'eleve...</option>
                {students.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name} ({s.matricule})</option>)}
              </select>
              <select required className={INPUT_CLASS} value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
                <option value="">Choisir la classe...</option>
                {classrooms.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.academic_year_label})</option>)}
              </select>
              {classrooms.data?.length === 0 && (
                <p className="text-xs text-warning-600 sm:col-span-2">
                  Aucune classe n'existe encore - demandez au Fondateur/Directeur d'en creer une.
                </p>
              )}
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting || !classroomId}>{submitting ? 'Enregistrement...' : 'Inscrire'}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="p-0">
          {enrollments.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!enrollments.loading && enrollments.data?.length === 0 && (
            <div className="p-4"><EmptyState title="Aucune inscription" /></div>
          )}
          <ul className="divide-y divide-border">
            {enrollments.data?.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{e.student_name}</p>
                  <p className="text-xs text-ink-muted">{e.classroom_name} - inscrit le {e.enrolled_on}</p>
                </div>
                <Badge tone={e.is_active ? 'success' : 'neutral'}>{e.is_active ? 'Actif' : 'Inactif'}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
