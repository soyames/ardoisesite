import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'

export default function SuperadminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('tickets') // 'tickets', 'team', 'schools'

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
        {user?.role === 'superadmin' && (
          <Button
            variant={activeTab === 'team' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('team')}
            className={activeTab === 'team' ? '' : 'text-ink-muted hover:text-ink'}
          >
            Gestion de l'Équipe
          </Button>
        )}
      </div>

      <div className="mt-6">
        {activeTab === 'tickets' && <SupportTickets />}
        {activeTab === 'team' && user?.role === 'superadmin' && <TeamManagement />}
      </div>
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
        <Card>
          <CardBody className="text-center py-10">
            <p className="text-ink-muted">Aucun ticket pour le moment.</p>
          </CardBody>
        </Card>
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
  const [status, setStatus] = useState('')

  const loadMembers = async () => {
    // In a real scenario, this might be handled via Cloud Functions or querying a 'users' collection 
    // where role is superadmin or support_agent. We will assume a 'team_members' collection for simplicity.
    try {
      const q = query(collection(db, 'team_members'))
      const snapshot = await getDocs(q)
      const m = []
      snapshot.forEach((doc) => {
        m.push({ id: doc.id, ...doc.data() })
      })
      setMembers(m)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!email) return
    setStatus('Ajout en cours...')
    try {
      // Store in team_members. The AuthContext should ideally check this collection 
      // or the backend needs to set Custom Claims for these roles.
      // For the frontend pilot, we just mock the assignment in Firestore.
      await setDoc(doc(db, 'team_members', email), {
        email,
        role,
        createdAt: new Date().toISOString()
      })
      setStatus('Membre ajouté avec succès')
      setEmail('')
      loadMembers()
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error(error)
      setStatus('Erreur lors de l\'ajout')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Ajouter un collaborateur" subtitle="Donnez accès au portail d'administration" />
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
            <Button type="submit" variant="primary" className="w-full sm:w-auto h-[38px]">
              Ajouter
            </Button>
          </form>
          {status && <p className="mt-4 text-sm font-medium text-success-600">{status}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Membres de l'équipe" />
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {members.length === 0 ? (
              <li className="p-5 text-sm text-ink-muted">Aucun membre configuré</li>
            ) : (
              members.map((m) => (
                <li key={m.id} className="p-5 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{m.email}</span>
                  <Badge tone={m.role === 'superadmin' ? 'warning' : 'info'}>
                    {m.role === 'superadmin' ? 'Superadmin' : 'Support'}
                  </Badge>
                </li>
              ))
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
