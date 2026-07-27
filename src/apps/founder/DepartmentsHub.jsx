import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const STAFF_ROLES = {
  secretary: 'Secrétaire',
  hr: 'Ressources Humaines',
  comptable: 'Comptabilité',
  censeur: 'Censeur / Etudes',
  surveillant: 'Surveillant Général',
  canteen: 'Cantine',
  librarian: 'Bibliothèque',
  auditor: 'Audit',
  director: 'Directeur'
}

export default function DepartmentsHub() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('secretary')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.schoolId) return
    const q = query(collection(db, 'users'), where('schoolId', '==', user.schoolId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const m = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role && Object.keys(STAFF_ROLES).includes(data.role)) {
          m.push({ id: doc.id, ...data })
        }
      })
      setMembers(m)
      setMembersLoading(false)
    }, (err) => {
      console.error(err)
      setMembersLoading(false)
    })
    return () => unsubscribe()
  }, [user?.schoolId])

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setStatus(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/school/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ kind: 'error', text: data.message || data.error || 'Erreur lors de l\'ajout' })
        return
      }

      setStatus({ kind: 'success', text: `${data.email} a maintenant accès (${STAFF_ROLES[data.role]}).` })
      setEmail('')
    } catch (error) {
      console.error(error)
      setStatus({ kind: 'error', text: 'Erreur réseau lors de l\'ajout. Réessayez.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (uid) => {
    if (!window.confirm('Voulez-vous vraiment révoquer l\'accès de cet employé ?')) return
    setStatus(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/school/staff/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ kind: 'error', text: data.error || 'Erreur lors de la révocation' })
        return
      }
      setStatus({ kind: 'success', text: 'Accès révoqué avec succès.' })
    } catch (error) {
      console.error(error)
      setStatus({ kind: 'error', text: 'Erreur réseau lors de la révocation.' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader 
          title="Ajouter un employé" 
          subtitle="Assignez un département à un employé. La personne doit déjà avoir créé son compte gratuit sur la plateforme." 
        />
        <CardBody>
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold leading-6 text-ink">Email de l'employé</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border bg-surface-raised focus:ring-2 focus:ring-primary-600 sm:text-sm"
              />
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-sm font-semibold leading-6 text-ink">Département (Rôle)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border bg-surface-raised focus:ring-2 focus:ring-primary-600 sm:text-sm"
              >
                {Object.entries(STAFF_ROLES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" loading={submitting}>
              Ajouter
            </Button>
          </form>

          {status && (
            <div className={`mt-4 p-4 rounded-control text-sm ${
              status.kind === 'error' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
            }`}>
              {status.text}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Personnel affecté" subtitle="Liste des employés gérant vos départements ERP." />
        <CardBody className="p-0">
          {membersLoading ? (
            <div className="p-8 text-center text-sm text-ink-muted">Chargement de l'équipe...</div>
          ) : members.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<svg className="mx-auto h-12 w-12 text-ink-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                title="Aucun personnel affecté"
                description="Ajoutez des employés ci-dessus pour leur donner accès à vos départements ERP."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-surface-raised transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-ink">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="blue">{STAFF_ROLES[member.role] || member.role}</Badge>
                    <Button variant="danger" size="sm" onClick={() => handleRevoke(member.id)}>
                      Révoquer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
