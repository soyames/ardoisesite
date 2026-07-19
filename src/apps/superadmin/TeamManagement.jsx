import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const ROLE_LABELS = {
  superadmin: 'Superadmin',
  support_agent: 'Agent Support',
  school_onboarding: 'Onboarding Écoles',
  dev_onboarding: 'Onboarding Devs',
  billing_agent: 'Facturation & Abonnements',
  marketing_agent: 'Marketing'
}

export function TeamManagement() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('support_agent')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', Object.keys(ROLE_LABELS)))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const m = []
      snapshot.forEach((doc) => m.push({ id: doc.id, ...doc.data() }))
      setMembers(m)
      setMembersLoading(false)
    }, (err) => {
      console.error(err)
      setMembersLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setStatus(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/team/invite`, {
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

      setStatus({ kind: 'success', text: `${data.email} a maintenant accès (${ROLE_LABELS[data.role]}).` })
      setEmail('')
    } catch (error) {
      console.error(error)
      setStatus({ kind: 'error', text: 'Erreur réseau lors de l\'ajout. Réessayez.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Ajouter un collaborateur" subtitle="La personne doit déjà avoir un compte Ardoise (elle s'inscrit normalement sur ardoise.soyames.com, puis vous lui donnez accès ici)." />
        <CardBody>
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold leading-6 text-ink">Email du collaborateur</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border bg-surface-raised focus:ring-2 focus:ring-primary-600 sm:text-sm"
              />
            </div>
            <div className="w-full sm:w-64">
              <label className="block text-sm font-semibold leading-6 text-ink">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border bg-surface-raised focus:ring-2 focus:ring-primary-600 sm:text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" className="w-full sm:w-auto h-[38px]" disabled={submitting}>
              {submitting ? 'Ajout en cours...' : 'Donner accès'}
            </Button>
          </form>
          {status && (
            <p className={`mt-4 text-sm font-medium ${status.kind === 'success' ? 'text-success-600' : 'text-danger-600'}`}>
              {status.text}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Membres de l'équipe" />
        <CardBody className="p-0">
          {membersLoading ? (
            <div className="p-5 text-sm text-ink-muted">Chargement...</div>
          ) : members.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Aucun membre configuré" description="Ajoutez votre premier collaborateur ci-dessus." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li key={m.id} className="p-5 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{m.email}</span>
                  <Badge tone={m.role === 'superadmin' ? 'warning' : 'info'}>
                    {ROLE_LABELS[m.role] || m.role}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
