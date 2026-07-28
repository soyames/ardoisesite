import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import MarketplaceAccountSettings from '../../shared/settings/MarketplaceAccountSettings.jsx'
import Overview from './Overview.jsx'
import Crm from './Crm.jsx'
import SupportTickets from './SupportTickets.jsx'
import { TeamManagement } from './TeamManagement.jsx'
import Partners from './Partners.jsx'

const TABS_BY_ROLE = {
  superadmin: ['overview', 'crm', 'tickets', 'schools', 'payments', 'users', 'partners', 'team', 'settings'],
  support_agent: ['tickets', 'settings'],
  school_onboarding: ['crm', 'schools', 'tickets', 'settings'],
  dev_onboarding: ['users', 'partners', 'tickets', 'settings'],
  billing_agent: ['crm', 'payments', 'overview', 'tickets', 'settings'],
  marketing_agent: ['crm', 'overview', 'settings']
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
          Espace de gestion globale de la plateforme (Support et équipe).
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border pb-4">
        {availableTabs.includes('overview') && (
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className={activeTab === 'overview' ? '' : 'text-ink-muted hover:text-ink'}
          >
            <Icon name="monitoring" className="mr-2" /> Vue d'ensemble
          </Button>
        )}
        {availableTabs.includes('crm') && (
          <Button
            variant={activeTab === 'crm' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('crm')}
            className={activeTab === 'crm' ? '' : 'text-ink-muted hover:text-ink'}
          >
            <Icon name="handshake" className="mr-2" /> CRM
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
            Écoles
          </Button>
        )}
        {availableTabs.includes('payments') && (
          <Button
            variant={activeTab === 'payments' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('payments')}
            className={activeTab === 'payments' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Contrats Tutorat
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
        {availableTabs.includes('partners') && (
          <Button
            variant={activeTab === 'partners' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('partners')}
            className={activeTab === 'partners' ? '' : 'text-ink-muted hover:text-ink'}
          >
            <Icon name="engineering" className="mr-2" /> Partenaires
          </Button>
        )}
        {availableTabs.includes('team') && (
          <Button
            variant={activeTab === 'team' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('team')}
            className={activeTab === 'team' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Gestion de l'équipe
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
        {activeTab === 'overview' && availableTabs.includes('overview') && <Overview />}
        {activeTab === 'crm' && availableTabs.includes('crm') && <Crm />}
        {activeTab === 'tickets' && availableTabs.includes('tickets') && <SupportTickets />}
        {activeTab === 'schools' && availableTabs.includes('schools') && <SchoolsRegistry />}
        {activeTab === 'payments' && availableTabs.includes('payments') && <TutoringContracts />}
        {activeTab === 'users' && availableTabs.includes('users') && <UsersRegistry />}
        {activeTab === 'partners' && availableTabs.includes('partners') && <Partners />}
        {activeTab === 'team' && availableTabs.includes('team') && <TeamManagement />}
        {activeTab === 'settings' && availableTabs.includes('settings') && <MarketplaceAccountSettings />}
      </div>
    </div>
  )
}

// Ardoise ERP is free for every school (see the 2026-07 paywall
// removal) - there's no more plan/subscription to grant or revoke.
// The one thing a superadmin still legitimately manages here is the
// activation code itself (lost-code support tickets), since it lives
// in the founder-only schools/{id}/secrets/config subcollection that
// firestore.rules keeps unreadable to a superadmin directly.
function ActivationCodeManager({ school }) {
  const [activationCode, setActivationCode] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const call = async (regenerate) => {
    setSubmitting(true)
    setError(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/admin/schools/${school.id}/activation-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ regenerate }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la récupération du code.')
        return
      }
      setActivationCode(data.activationCode)
    } catch (err) {
      console.error(err)
      setError('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-control bg-primary-50/50 p-4 space-y-3">
      {activationCode ? (
        <p className="text-xs text-ink-muted">
          Code d'activation : <code className="rounded bg-surface-raised px-1.5 py-0.5">{activationCode}</code>
          {' '}(à fournir à l'école pour ARDOISE_ACTIVATION_CODE)
        </p>
      ) : (
        <p className="text-xs text-ink-muted">Cliquez pour afficher le code d'activation de cette école.</p>
      )}

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => call(false)} disabled={submitting}>
          {submitting ? 'En cours...' : 'Afficher le code'}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => call(true)} disabled={submitting}>
          Régénérer
        </Button>
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
                  {school.feeCollectionEnabled === false && <Badge tone="neutral">Sans collecte de frais</Badge>}
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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action supprimera définitivement son compte et ses données de la plateforme.")) return
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur API lors de la suppression')
      }
      
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
      <CardHeader title="Utilisateurs Inscrits" subtitle="Gestion des parents, professeurs, développeurs et superadmins." />
      <CardBody className="p-0">
        <div className="p-4 border-b border-border bg-surface-raised flex gap-2 overflow-x-auto">
          <Button size="sm" variant={filterRole === 'all' ? 'primary' : 'secondary'} onClick={() => setFilterRole('all')}>Tous</Button>
          <Button size="sm" variant={filterRole === 'parent' ? 'primary' : 'secondary'} onClick={() => setFilterRole('parent')}>Parents</Button>
          <Button size="sm" variant={filterRole === 'teacher' ? 'primary' : 'secondary'} onClick={() => setFilterRole('teacher')}>Professeurs</Button>
          <Button size="sm" variant={filterRole === 'developer' ? 'primary' : 'secondary'} onClick={() => setFilterRole('developer')}>Développeurs</Button>
          <Button size="sm" variant={filterRole === 'superadmin' ? 'primary' : 'secondary'} onClick={() => setFilterRole('superadmin')}>Superadmins</Button>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Aucun utilisateur" description="Aucun utilisateur trouvé pour ce filtre." />
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

// Ardoise no longer intermediates parent-to-tutor payments (see the
// 2026-07 pivot - a parent and tutor now contract and pay each other
// directly), so this only tracks who connected with whom, not money -
// tutoring_contracts is written by TutoringBookingFlow.jsx without a
// total/commission/transactionId (firestore.rules blocks those fields
// on create), so there's nothing financial left to surface here.
function TutoringContracts() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const cQuery = query(collection(db, 'tutoring_contracts'), orderBy('createdAt', 'desc'))

    const unsubscribeContracts = onSnapshot(cQuery, (snapshot) => {
      if (!active) return
      const c = []
      snapshot.forEach((doc) => c.push({ id: doc.id, ...doc.data() }))
      setContracts(c)
      setLoading(false)
    })

    return () => {
      active = false
      unsubscribeContracts()
    }
  }, [])

  if (loading) return <div className="text-sm text-ink-muted">Chargement des données...</div>

  return (
    <Card>
      <CardHeader title="Mises en relation Tuteur-Parent (Marketplace)" subtitle="Ardoise ne collecte plus aucun paiement sur ces mises en relation - parent et tuteur s'arrangent directement." />
      <CardBody className="p-0">
        {contracts.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Aucune mise en relation" description="Aucun tuteur n'a encore été réservé via la plateforme." />
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
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
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
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
        <Icon name="arrow_back" className="text-base" /> Retour aux écoles
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">{school.name || 'Sans nom'}</h2>
          <p className="text-sm text-ink-muted">
            ID: {school.id} · Ajouté le {school.createdAt ? (school.createdAt.toDate ? school.createdAt.toDate() : new Date(school.createdAt)).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success">Gratuit</Badge>
          {school.feeCollectionEnabled === false && <Badge tone="neutral">Sans collecte de frais</Badge>}
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
        <CardHeader title="Code d'activation" subtitle="L'ERP est gratuit pour toutes les écoles - seul le code d'activation reste géré ici (support en cas de perte)." />
        <CardBody>
          <ActivationCodeManager school={school} />
        </CardBody>
      </Card>
    </div>
  )
}


