import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import MarketplaceAccountSettings from '../../shared/settings/MarketplaceAccountSettings.jsx'

export default function SuperadminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('tickets') // 'tickets', 'schools', 'payments', 'developers', 'team', 'settings'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Administration Ardoise</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Espace de gestion globale de la plateforme (Support et équipe).
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        <Button
          variant={activeTab === 'tickets' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('tickets')}
          className={activeTab === 'tickets' ? '' : 'text-ink-muted hover:text-ink'}
        >
          Tickets de Support
        </Button>
        <Button
          variant={activeTab === 'schools' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('schools')}
          className={activeTab === 'schools' ? '' : 'text-ink-muted hover:text-ink'}
        >
          Écoles
        </Button>
        <Button
          variant={activeTab === 'payments' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('payments')}
          className={activeTab === 'payments' ? '' : 'text-ink-muted hover:text-ink'}
        >
          Paiements & Abonnements
        </Button>
        <Button
          variant={activeTab === 'developers' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('developers')}
          className={activeTab === 'developers' ? '' : 'text-ink-muted hover:text-ink'}
        >
          Développeurs
        </Button>
        {user?.role === 'superadmin' && (
          <Button
            variant={activeTab === 'team' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('team')}
            className={activeTab === 'team' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Gestion de l'Équipe
          </Button>
        )}
        <Button
          variant={activeTab === 'settings' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? '' : 'text-ink-muted hover:text-ink'}
        >
          Mon Compte
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === 'tickets' && <SupportTickets />}
        {activeTab === 'schools' && <SchoolsRegistry />}
        {activeTab === 'payments' && <PaymentsAndSubscriptions />}
        {activeTab === 'developers' && <DevelopersRegistry />}
        {activeTab === 'team' && user?.role === 'superadmin' && <TeamManagement />}
        {activeTab === 'settings' && <MarketplaceAccountSettings />}
      </div>
    </div>
  )
}

const PLAN_CODES = [
  { value: 'trial', label: 'Essai (Trial)' },
  { value: 'starter', label: 'Starter' },
  { value: 'premium', label: 'Premium' },
]
const DURATION_OPTIONS = [
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
]

function isExpired(school) {
  const expiresAt = school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt) : null
  return expiresAt !== null && expiresAt.getTime() < Date.now()
}

function subscriptionBadge(school) {
  if (!school.subscriptionActive) return <Badge tone="neutral">Gratuit</Badge>
  if (isExpired(school)) return <Badge tone="danger">Expiré</Badge>
  return <Badge tone="success">Actif</Badge>
}

function SubscriptionManager({ school, onChanged }) {
  const [planCode, setPlanCode] = useState(school.planCode || 'trial')
  const [durationDays, setDurationDays] = useState(14)
  const [whatsapp, setWhatsapp] = useState((school.features || []).includes('whatsapp_notifications'))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const call = async (body) => {
    setSubmitting(true)
    setError(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/admin/schools/${school.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la mise a jour.')
        return
      }
      onChanged()
    } catch (err) {
      console.error(err)
      setError('Erreur reseau.')
    } finally {
      setSubmitting(false)
    }
  }

  const grant = () => call({
    active: true, plan_code: planCode, duration_days: durationDays,
    features: whatsapp ? ['whatsapp_notifications'] : [],
  })
  const revoke = () => call({ active: false })

  return (
    <div className="mt-3 rounded-control bg-primary-50/50 p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          className="rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border"
          value={planCode} onChange={(e) => setPlanCode(e.target.value)}
        >
          {PLAN_CODES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          className="rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border"
          value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}
        >
          {DURATION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
          WhatsApp
        </label>
      </div>

      {school.activationCode && (
        <p className="text-xs text-ink-muted">
          Code d'activation : <code className="rounded bg-surface-raised px-1.5 py-0.5">{school.activationCode}</code>
          {' '}(a fournir a l'ecole pour ARDOISE_ACTIVATION_CODE)
        </p>
      )}

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={grant} disabled={submitting}>
          {submitting ? 'En cours...' : "Accorder l'acces"}
        </Button>
        {school.subscriptionActive && (
          <Button size="sm" variant="danger" onClick={revoke} disabled={submitting}>Revoquer</Button>
        )}
      </div>
    </div>
  )
}

function SchoolsRegistry() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailedSchoolId, setDetailedSchoolId] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'schools'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const s = []
      snapshot.forEach((doc) => s.push({ id: doc.id, ...doc.data() }))
      setSchools(s)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return <div className="text-sm text-ink-muted">Chargement des écoles...</div>

  if (schools.length === 0) {
    return (
      <EmptyState
        title="Aucune école enregistrée"
        description="Les écoles apparaissent ici une fois leur inscription terminée sur le marketplace."
      />
    )
  }

  const detailedSchool = detailedSchoolId ? schools.find(s => s.id === detailedSchoolId) : null

  if (detailedSchool) {
    return <SchoolDetailView school={detailedSchool} onBack={() => setDetailedSchoolId(null)} />
  }

  return (
    <Card>
      <CardBody className="p-0">
        <ul className="divide-y divide-border">
          {schools.map((school) => (
            <li key={school.id} className="p-5 hover:bg-surface-hover cursor-pointer" onClick={() => setDetailedSchoolId(school.id)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink flex items-center gap-2">
                    {school.name || 'Sans nom'}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    {[school.city, school.country].filter(Boolean).join(', ') || 'Ville non renseignée'}
                    {school.backendUrl && <span className="ml-2 text-ink-muted">· {school.backendUrl}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {subscriptionBadge(school)}
                  <Badge tone="info">{school.planCode || 'free'}</Badge>
                  <Icon name="chevron_right" className="text-ink-muted" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function DevelopersRegistry() {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'developer'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devs = []
      snapshot.forEach((doc) => devs.push({ id: doc.id, ...doc.data() }))
      // Sort by creation date if available, otherwise just use the array order
      devs.sort((a, b) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt)
        return 0
      })
      setDevelopers(devs)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  if (loading) return <div className="text-sm text-ink-muted">Chargement des développeurs...</div>

  return (
    <Card>
      <CardHeader title="Développeurs Inscrits" subtitle="Suivi des développeurs et accès à l'API Ardoise." />
      <CardBody className="p-0">
        {developers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Aucun développeur" description="Aucun développeur ne s'est inscrit pour le moment." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {developers.map(dev => (
              <li key={dev.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-ink">{dev.name}</p>
                  <p className="text-xs text-ink-muted mt-1">{dev.email}</p>
                  <p className="text-xs text-ink-muted mt-1">Inscrit le {dev.createdAt ? new Date(dev.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="text-right">
                  <Badge tone="neutral" className="mb-2">API: En attente</Badge>
                  <p className="text-xs text-ink-muted">Clés générées: 0</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

function PaymentsAndSubscriptions() {
  const [schools, setSchools] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const sQuery = query(collection(db, 'schools'), orderBy('createdAt', 'desc'))
    const cQuery = query(collection(db, 'tutoring_contracts'), orderBy('createdAt', 'desc'))

    const unsubscribeSchools = onSnapshot(sQuery, (snapshot) => {
      if (!active) return
      const s = []
      snapshot.forEach((doc) => s.push({ id: doc.id, ...doc.data() }))
      setSchools(s)
      setLoading(false)
    })

    const unsubscribeContracts = onSnapshot(cQuery, (snapshot) => {
      if (!active) return
      const c = []
      snapshot.forEach((doc) => c.push({ id: doc.id, ...doc.data() }))
      setContracts(c)
    })

    return () => {
      active = false
      unsubscribeSchools()
      unsubscribeContracts()
    }
  }, [])

  if (loading) return <div className="text-sm text-ink-muted">Chargement des données...</div>

  const premiumSchools = schools.filter(s => s.subscriptionActive)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader title="Abonnements SaaS (Écoles)" subtitle="Suivi des abonnements actifs au logiciel de gestion." />
        <CardBody className="p-0">
          {premiumSchools.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucun abonnement" description="Aucune école n'a d'abonnement SaaS actif." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {premiumSchools.map(school => (
                <li key={school.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{school.name}</p>
                    <p className="text-xs text-ink-muted mt-1">Plan: <span className="font-semibold uppercase">{school.planCode}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-ink">Expire le {school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs text-success-600 font-medium">Actif</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contrats de Tutorat (Marketplace)" subtitle="Suivi des réservations de tuteurs par les parents." />
        <CardBody className="p-0">
          {contracts.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucun contrat" description="Aucun tuteur n'a encore été réservé via la plateforme." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {contracts.map(c => (
                <li key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{c.parentName} &rarr; {c.teacherName}</p>
                    <p className="text-xs text-ink-muted mt-1">{c.hoursPerWeek}h/semaine · Début: {c.startDate}</p>
                    <p className="text-xs text-ink-muted">Contact Parent: {c.parentEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{c.total?.toLocaleString() || 0} F / mois</p>
                    <p className="text-xs text-ink-muted">Commission: {c.commission?.toLocaleString() || 0} F</p>
                    <Badge tone="success" className="mt-1">Prélevé le {c.paymentDate}</Badge>
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

function HealthPing({ backendUrl }) {
  const [status, setStatus] = useState('loading') // loading, up, down

  useEffect(() => {
    let active = true
    if (!backendUrl) {
      setStatus('down')
      return
    }

    // Ping the backend API root or health endpoint
    // We assume there's an /api/auth/ or something responding, we'll just try to fetch it.
    fetch(`${backendUrl}/api/auth/firebase-login/`, { method: 'OPTIONS' })
      .then(res => {
        if (active) setStatus(res.ok || res.status === 405 || res.status === 403 ? 'up' : 'down')
      })
      .catch(() => {
        if (active) setStatus('down')
      })

    return () => { active = false }
  }, [backendUrl])

  return (
    <div className="flex items-center gap-2">
      {status === 'loading' && <span className="text-sm text-ink-muted">Ping en cours...</span>}
      {status === 'up' && <Badge tone="success">Connecté (Backend Actif)</Badge>}
      {status === 'down' && <Badge tone="danger">Injoignable (Erreur de connexion)</Badge>}
    </div>
  )
}

function SchoolDetailView({ school, onBack }) {
  const [managing, setManaging] = useState(false)

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
        <Icon name="arrow_back" className="text-base" /> Retour aux écoles
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">{school.name || 'Sans nom'}</h2>
          <p className="text-sm text-ink-muted">
            ID: {school.id} · Ajouté le {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subscriptionBadge(school)}
          <Badge tone="info">{school.planCode || 'free'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Informations de l'établissement" />
          <CardBody className="space-y-3">
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Adresse & Localisation</span>
              <p className="text-sm text-ink">{school.address || 'Non renseignée'}</p>
              <p className="text-sm text-ink">{[school.city, school.country].filter(Boolean).join(', ') || 'Non renseigné'}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Contact</span>
              <p className="text-sm text-ink">{school.email || 'Non renseigné'}</p>
              <p className="text-sm text-ink">{school.phone || 'Non renseigné'}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Santé de l'intégration" />
          <CardBody className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase mb-1">URL du Serveur ERP (Backend)</span>
              {school.backendUrl ? (
                <a href={school.backendUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                  {school.backendUrl}
                </a>
              ) : (
                <p className="text-sm text-warning-600 font-medium">Aucune URL configurée. Le logiciel de l'école n'est pas encore lié.</p>
              )}
            </div>
            
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase mb-1">Statut de la connexion</span>
              <HealthPing backendUrl={school.backendUrl} />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader 
          title="Abonnement & Licences" 
          action={
            <Button size="sm" variant={managing ? 'ghost' : 'secondary'} onClick={() => setManaging(!managing)}>
              {managing ? 'Fermer' : 'Gérer l\'abonnement'}
            </Button>
          } 
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Plan Actuel</span>
              <p className="text-sm font-medium text-ink mt-1 capitalize">{school.planCode || 'Gratuit (Free)'}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Expiration</span>
              <p className="text-sm text-ink mt-1">
                {school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt).toLocaleDateString() : 'Jamais'}
              </p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Fonctionnalités</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {school.features && school.features.length > 0 ? (
                  school.features.map(f => <Badge key={f} tone="neutral">{f}</Badge>)
                ) : (
                  <span className="text-sm text-ink-muted">Aucune fonctionnalité Premium</span>
                )}
              </div>
            </div>
          </div>

          {managing && (
            <div className="mt-6 pt-6 border-t border-border">
              <SubscriptionManager school={school} onChanged={() => setManaging(false)} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const t = []
      snapshot.forEach((doc) => {
        t.push({ id: doc.id, ...doc.data() })
      })
      setTickets(t)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { ticket_status: newStatus })
    } catch (e) {
      console.error("Erreur de mise à jour:", e)
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Chargement des tickets...</div>

  return (
    <div className="space-y-4">
      {tickets.length === 0 ? (
        <EmptyState
          title="Inbox zero"
          description="Aucun ticket de support en attente. Beau travail."
        />
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id} className="transition-all hover:shadow-md">
            <CardBody className="flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-semibold text-ink">{ticket.subject}</h3>
                  <Badge tone={ticket.ticket_status === 'open' ? 'warning' : ticket.ticket_status === 'resolved' ? 'success' : 'info'}>
                    {ticket.ticket_status === 'open' ? 'Ouvert' : ticket.ticket_status === 'resolved' ? 'Résolu' : 'En cours'}
                  </Badge>
                </div>
                <p className="text-sm text-ink-muted mb-2">{ticket.message}</p>
                <div className="text-xs text-ink-muted flex flex-wrap gap-4">
                  <span>De: {ticket.name} ({ticket.email})</span>
                  {ticket.school && <span>École: {ticket.school}</span>}
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                {ticket.ticket_status !== 'in_progress' && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(ticket.id, 'in_progress')}>
                    Mettre en cours
                  </Button>
                )}
                {ticket.ticket_status !== 'resolved' && (
                  <Button size="sm" variant="primary" onClick={() => updateStatus(ticket.id, 'resolved')}>
                    Marquer Résolu
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  )
}

function TeamManagement() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('support_agent')
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [status, setStatus] = useState(null) // { kind: 'success' | 'error', text: string }
  const [submitting, setSubmitting] = useState(false)

  // Reads the real access-control source of truth (users/{uid}.role) --
  // not a separate collection. What's listed here IS who can log in,
  // no separate "did the grant actually take effect" question.
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['superadmin', 'support_agent']))
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

      setStatus({ kind: 'success', text: `${data.email} a maintenant accès (${data.role === 'superadmin' ? 'Superadmin' : 'Agent de Support'}).` })
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
            <div className="w-full sm:w-48">
              <label className="block text-sm font-semibold leading-6 text-ink">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border bg-surface-raised focus:ring-2 focus:ring-primary-600 sm:text-sm"
              >
                <option value="support_agent">Agent de Support</option>
                <option value="superadmin">Superadmin</option>
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
                    {m.role === 'superadmin' ? 'Superadmin' : 'Support'}
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
