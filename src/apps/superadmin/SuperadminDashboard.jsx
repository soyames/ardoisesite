import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getApiBaseUrl } from '../../config/env.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import MarketplaceAccountSettings from '../../shared/settings/MarketplaceAccountSettings.jsx'
import PlatformAnalytics from './PlatformAnalytics.jsx'
import SupportTickets from './SupportTickets.jsx'
import { TeamManagement } from './TeamManagement.jsx'

const TABS_BY_ROLE = {
  superadmin: ['analytics', 'tickets', 'schools', 'payments', 'users', 'team', 'settings'],
  support_agent: ['tickets', 'settings'],
  school_onboarding: ['schools', 'tickets', 'settings'],
  dev_onboarding: ['users', 'tickets', 'settings'],
  billing_agent: ['payments', 'analytics', 'tickets', 'settings'],
  marketing_agent: ['analytics', 'settings']
}

export default function SuperadminDashboard() {
  const { user } = useAuth()
  const availableTabs = TABS_BY_ROLE[user?.role] || ['settings']
  const [activeTab, setActiveTab] = useState(availableTabs[0])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Administration Ardoise</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Espace de gestion globale de la plateforme (Support et Ã©quipe).
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        {availableTabs.includes('analytics') && (
          <Button
            variant={activeTab === 'analytics' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? '' : 'text-ink-muted hover:text-ink'}
          >
            <Icon name="monitoring" className="mr-2" /> Analytiques
          </Button>
        )}
        {availableTabs.includes('tickets') && (
          <Button
            variant={activeTab === 'tickets' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('tickets')}
            className={activeTab === 'tickets' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Tickets de Support
          </Button>
        )}
        {availableTabs.includes('schools') && (
          <Button
            variant={activeTab === 'schools' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('schools')}
            className={activeTab === 'schools' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Ã‰coles
          </Button>
        )}
        {availableTabs.includes('payments') && (
          <Button
            variant={activeTab === 'payments' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('payments')}
            className={activeTab === 'payments' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Paiements & Abonnements
          </Button>
        )}
        {availableTabs.includes('users') && (
          <Button
            variant={activeTab === 'users' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Utilisateurs
          </Button>
        )}
        {availableTabs.includes('team') && (
          <Button
            variant={activeTab === 'team' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('team')}
            className={activeTab === 'team' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Gestion de l'Ã©quipe
          </Button>
        )}
        {availableTabs.includes('settings') && (
          <Button
            variant={activeTab === 'settings' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Mon Compte
          </Button>
        )}
      </div>

      <div className="mt-6">
        {activeTab === 'analytics' && availableTabs.includes('analytics') && <PlatformAnalytics />}
        {activeTab === 'tickets' && availableTabs.includes('tickets') && <SupportTickets />}
        {activeTab === 'schools' && availableTabs.includes('schools') && <SchoolsRegistry />}
        {activeTab === 'payments' && availableTabs.includes('payments') && <PaymentsAndSubscriptions />}
        {activeTab === 'users' && availableTabs.includes('users') && <UsersRegistry />}
        {activeTab === 'team' && availableTabs.includes('team') && <TeamManagement />}
        {activeTab === 'settings' && availableTabs.includes('settings') && <MarketplaceAccountSettings />}
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
  if (isExpired(school)) return <Badge tone="danger">ExpirÃ©</Badge>
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

  if (loading) return <div className="text-sm text-ink-muted">Chargement des Ã©coles...</div>

  if (schools.length === 0) {
    return (
      <EmptyState
        title="Aucune Ã©cole enregistrÃ©e"
        description="Les Ã©coles apparaissent ici une fois leur inscription terminÃ©e sur le marketplace."
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
                    {[school.city, school.country].filter(Boolean).join(', ') || 'Ville non renseignÃ©e'}
                    {school.backendUrl && <span className="ml-2 text-ink-muted">Â· {school.backendUrl}</span>}
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

function UsersRegistry() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    const q = query(collection(db, 'users'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const u = []
      snapshot.forEach((doc) => u.push({ id: doc.id, ...doc.data() }))
      u.sort((a, b) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt)
        return 0
      })
      setUsers(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("ÃŠtes-vous sÃ»r de vouloir supprimer cet utilisateur ? Cette action supprimera ses donnÃ©es de la base de donnÃ©es. Pour la suppression de l'authentification (login), assurez-vous que la Cloud Function est configurÃ©e.")) return
    try {
      // 1. Call Django Backend to delete the Auth record first
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getApiBaseUrl()}/api/auth/firebase-delete-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken, uid_to_delete: userId })
      })

      if (!res.ok) {
        throw new Error('Erreur API backend lors de la suppression Auth')
      }
      
      // 2. Delete from Firestore only if backend deletion succeeded
      await deleteDoc(doc(db, 'users', userId))
      
      alert("Utilisateur supprimé avec succès de la base de données et de l'authentification.")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      alert("Erreur lors de la suppression.")
    }
  }

  if (loading) return <div className="text-sm text-ink-muted">Chargement des utilisateurs...</div>

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole)

  return (
    <Card>
      <CardHeader title="Utilisateurs Inscrits" subtitle="Gestion des parents, professeurs, dÃ©veloppeurs et superadmins." />
      <CardBody className="p-0">
        <div className="p-4 border-b border-border bg-surface-raised flex gap-2 overflow-x-auto">
          <Button size="sm" variant={filterRole === 'all' ? 'primary' : 'secondary'} onClick={() => setFilterRole('all')}>Tous</Button>
          <Button size="sm" variant={filterRole === 'parent' ? 'primary' : 'secondary'} onClick={() => setFilterRole('parent')}>Parents</Button>
          <Button size="sm" variant={filterRole === 'teacher' ? 'primary' : 'secondary'} onClick={() => setFilterRole('teacher')}>Professeurs</Button>
          <Button size="sm" variant={filterRole === 'developer' ? 'primary' : 'secondary'} onClick={() => setFilterRole('developer')}>DÃ©veloppeurs</Button>
          <Button size="sm" variant={filterRole === 'superadmin' ? 'primary' : 'secondary'} onClick={() => setFilterRole('superadmin')}>Superadmins</Button>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Aucun utilisateur" description="Aucun utilisateur trouvÃ© pour ce filtre." />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredUsers.map(u => (
              <li key={u.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div>
                  <p className="text-sm font-bold text-ink">{u.name || 'Sans Nom'}</p>
                  <p className="text-xs text-ink-muted mt-1">{u.email}</p>
                  <p className="text-xs text-ink-muted mt-1">
                    Inscrit le {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <Badge tone={u.role === 'superadmin' ? 'danger' : u.role === 'teacher' ? 'success' : 'neutral'}>
                    {u.role}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    Supprimer
                  </Button>
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

  if (loading) return <div className="text-sm text-ink-muted">Chargement des donnÃ©es...</div>

  const premiumSchools = schools.filter(s => s.subscriptionActive)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader title="Abonnements SaaS (Ã‰coles)" subtitle="Suivi des abonnements actifs au logiciel de gestion." />
        <CardBody className="p-0">
          {premiumSchools.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucun abonnement" description="Aucune Ã©cole n'a d'abonnement SaaS actif." />
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
        <CardHeader title="Contrats de Tutorat (Marketplace)" subtitle="Suivi des rÃ©servations de tuteurs par les parents." />
        <CardBody className="p-0">
          {contracts.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Aucun contrat" description="Aucun tuteur n'a encore Ã©tÃ© rÃ©servÃ© via la plateforme." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {contracts.map(c => (
                <li key={c.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{c.parentName} &rarr; {c.teacherName}</p>
                    <p className="text-xs text-ink-muted mt-1">{c.hoursPerWeek}h/semaine Â· DÃ©but: {c.startDate}</p>
                    <p className="text-xs text-ink-muted">Contact Parent: {c.parentEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{c.total?.toLocaleString() || 0} F / mois</p>
                    <p className="text-xs text-ink-muted">Commission: {c.commission?.toLocaleString() || 0} F</p>
                    <Badge tone="success" className="mt-1">PrÃ©levÃ© le {c.paymentDate}</Badge>
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
      {status === 'up' && <Badge tone="success">ConnectÃ© (Backend Actif)</Badge>}
      {status === 'down' && <Badge tone="danger">Injoignable (Erreur de connexion)</Badge>}
    </div>
  )
}

function SchoolDetailView({ school, onBack }) {
  const [managing, setManaging] = useState(false)

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
        <Icon name="arrow_back" className="text-base" /> Retour aux Ã©coles
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">{school.name || 'Sans nom'}</h2>
          <p className="text-sm text-ink-muted">
            ID: {school.id} Â· AjoutÃ© le {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subscriptionBadge(school)}
          <Badge tone="info">{school.planCode || 'free'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Informations de l'Ã©tablissement" />
          <CardBody className="space-y-3">
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Adresse & Localisation</span>
              <p className="text-sm text-ink">{school.address || 'Non renseignÃ©e'}</p>
              <p className="text-sm text-ink">{[school.city, school.country].filter(Boolean).join(', ') || 'Non renseignÃ©'}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase">Contact</span>
              <p className="text-sm text-ink">{school.email || 'Non renseignÃ©'}</p>
              <p className="text-sm text-ink">{school.phone || 'Non renseignÃ©'}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="SantÃ© de l'intÃ©gration" />
          <CardBody className="space-y-4">
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase mb-1">URL du Serveur ERP (Backend)</span>
              {school.backendUrl ? (
                <a href={school.backendUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline break-all">
                  {school.backendUrl}
                </a>
              ) : (
                <p className="text-sm text-warning-600 font-medium">Aucune URL configurÃ©e. Le logiciel de l'Ã©cole n'est pas encore liÃ©.</p>
              )}
            </div>
            
            <div>
              <span className="block text-xs font-semibold text-ink-muted uppercase mb-1">Statut de la connexion</span>
              <HealthPing backendUrl={school.backendUrl} />
            </div>
            
            <div className="pt-2 border-t border-border">
              <span className="block text-xs font-semibold text-ink-muted uppercase mb-2">Télémétrie</span>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink-muted block text-xs">Dernière vérification URL:</span>
                  <span className="text-ink">{school.backendUrlVerifiedAt ? new Date(school.backendUrlVerifiedAt).toLocaleString() : 'Jamais'}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-xs">Dernière synchronisation:</span>
                  <span className="text-ink">{school.fetched_at ? new Date(school.fetched_at).toLocaleString() : 'Jamais'}</span>
                </div>
                {school.last_error && (
                  <div className="col-span-2 mt-1">
                    <span className="text-danger-600 block text-xs">Dernière erreur:</span>
                    <span className="text-ink font-mono text-xs bg-danger-50 p-1 rounded break-all">{school.last_error}</span>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader 
          title="Abonnement & Licences" 
          action={
            <Button size="sm" variant={managing ? 'ghost' : 'secondary'} onClick={() => setManaging(!managing)}>
              {managing ? 'Fermer' : 'GÃ©rer l\'abonnement'}
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
              <span className="block text-xs font-semibold text-ink-muted uppercase">FonctionnalitÃ©s</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {school.features && school.features.length > 0 ? (
                  school.features.map(f => <Badge key={f} tone="neutral">{f}</Badge>)
                ) : (
                  <span className="text-sm text-ink-muted">Aucune fonctionnalitÃ© Premium</span>
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

