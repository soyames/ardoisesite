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

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'students', label: 'Eleves' },
  { key: 'parents', label: 'Parents' },
  { key: 'guardianships', label: 'Tutelle' },
  { key: 'enrollments', label: 'Inscriptions' },
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Bienvenue, {firstName}</h2>
        <p className="mt-1 text-sm text-ink-muted">Voici un apercu de l'activite au secretariat aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickActionCard
          title="Nouvel eleve"
          subtitle="Enregistrer un eleve dans l'ecole"
          onClick={() => onNavigate('students')}
        />
        <QuickActionCard
          title="Nouvelle inscription"
          subtitle="Affecter un eleve a une classe"
          onClick={() => onNavigate('enrollments')}
        />
        <QuickActionCard
          title="Lier un tuteur"
          subtitle="Associer un eleve a un parent"
          onClick={() => onNavigate('guardianships')}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => onNavigate('students')} className="w-full text-left">
          <StatCard
            label="Eleves actifs"
            value={students.loading ? '...' : activeStudents}
            hint={`${totalStudents} au total - voir les eleves`}
            tone="primary"
          />
        </button>
        <button type="button" onClick={() => onNavigate('parents')} className="w-full text-left">
          <StatCard
            label="Parents"
            value={parents.loading ? '...' : totalParents}
            hint="Annuaire - voir les parents"
            tone="primary"
          />
        </button>
        <button type="button" onClick={() => onNavigate('enrollments')} className="w-full text-left">
          <StatCard
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
        <CardBody className="p-0">
          {enrollments.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!enrollments.loading && recentEnrollments.length === 0 && (
            <div className="p-4"><EmptyState title="Aucune activite recente" /></div>
          )}
          <ul className="divide-y divide-border">
            {recentEnrollments.map((e) => (
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

function QuickActionCard({ title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-1 rounded-card border border-border bg-surface-raised p-4 text-left shadow-card transition hover:border-primary-300 hover:shadow-elevated"
    >
      <span className="text-sm font-semibold text-primary-700">+ {title}</span>
      <span className="text-xs text-ink-muted">{subtitle}</span>
    </button>
  )
}

function StudentsTab() {
  const students = useApiGet('/api/students/students/')
  const [showForm, setShowForm] = useState(false)
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
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{s.last_name} {s.first_name}</p>
                  <p className="text-xs text-ink-muted">{s.matricule} {s.date_of_birth && `- ne(e) le ${s.date_of_birth}`}</p>
                </div>
                <Badge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status || 'active'}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
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
