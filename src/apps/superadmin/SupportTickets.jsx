import React, { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, addDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const TICKET_STATUS = {
  open: { label: 'Nouveau', tone: 'danger' },
  in_progress: { label: 'En cours', tone: 'warning' },
  on_hold: { label: 'En attente', tone: 'neutral' },
  resolved: { label: 'Résolu', tone: 'success' },
  closed: { label: 'Fermé', tone: 'neutral' }
}

const TICKET_PRIORITY = {
  low: { label: 'Basse', icon: 'arrow_downward', color: 'text-success-600' },
  medium: { label: 'Moyenne', icon: 'remove', color: 'text-warning-600' },
  high: { label: 'Haute', icon: 'arrow_upward', color: 'text-danger-500' },
  critical: { label: 'Critique', icon: 'warning', color: 'text-danger-700' }
}

const TICKET_CATEGORY = {
  incident: 'Incident technique',
  billing_request: 'Facturation & Paiement',
  school_onboarding: 'Onboarding École',
  dev_support: 'Support Développeur',
  general: 'Demande générale'
}

export default function SupportTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  
  // Team members for assignment
  const [teamMembers, setTeamMembers] = useState([])

  useEffect(() => {
    // Load team members for assignment
    const qMembers = query(collection(db, 'users'), where('role', 'in', ['support_agent', 'superadmin', 'school_onboarding', 'dev_onboarding', 'billing_agent', 'marketing_agent']))
    const unsubMembers = onSnapshot(qMembers, snap => {
      const m = []
      snap.forEach(doc => m.push({ id: doc.id, ...doc.data() }))
      setTeamMembers(m)
    })

    // Load tickets
    const qTickets = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'))
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      const t = []
      snapshot.forEach((doc) => {
        // Upgrade old tickets to new schema
        const data = doc.data()
        t.push({ 
          id: doc.id, 
          status: data.ticket_status || data.status || 'open',
          priority: data.priority || 'medium',
          category: data.category || 'general',
          assignee: data.assignee || null,
          internal_notes: data.internal_notes || '',
          ...data 
        })
      })
      setTickets(t)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => {
      unsubMembers()
      unsubTickets()
    }
  }, [])

  const updateTicketField = async (id, field, value) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { [field]: value })
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket(prev => ({ ...prev, [field]: value }))
      }
    } catch (e) {
      console.error("Erreur de mise à jour:", e)
      alert("Erreur lors de la mise à jour")
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    return true
  })

  if (loading) return <div className="text-sm text-ink-muted">Chargement de l'espace ITSM...</div>

  if (selectedTicket) {
    return (
      <TicketDetail 
        ticket={selectedTicket} 
        onBack={() => setSelectedTicket(null)} 
        onUpdate={updateTicketField}
        teamMembers={teamMembers}
        currentUser={user}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 bg-surface-raised p-4 rounded-card border border-border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-ink-muted">Statut:</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm rounded border-border py-1 px-2 bg-surface"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(TICKET_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-ink-muted">Catégorie:</label>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="text-sm rounded border-border py-1 px-2 bg-surface"
          >
            <option value="all">Toutes catégories</option>
            {Object.entries(TICKET_CATEGORY).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-card border border-border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-raised">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">ID / Sujet</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Demandeur</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Catégorie</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Priorité</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wider">Assigné à</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-ink-muted">
                  Aucun ticket trouvé.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className="hover:bg-primary-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-ink">{ticket.subject}</div>
                    <div className="text-xs text-ink-muted mt-1 font-mono">#{ticket.id.slice(-6).toUpperCase()} • {new Date(ticket.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink">{ticket.name}</div>
                    <div className="text-xs text-ink-muted">{ticket.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-ink-muted bg-surface-raised px-2 py-1 rounded">
                      {TICKET_CATEGORY[ticket.category] || ticket.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={TICKET_STATUS[ticket.status]?.tone || 'neutral'}>
                      {TICKET_STATUS[ticket.status]?.label || ticket.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center text-sm ${TICKET_PRIORITY[ticket.priority]?.color}`}>
                      <Icon name={TICKET_PRIORITY[ticket.priority]?.icon} className="mr-1 text-base" />
                      {TICKET_PRIORITY[ticket.priority]?.label || ticket.priority}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {ticket.assignee ? teamMembers.find(m => m.id === ticket.assignee)?.name || ticket.assignee : <span className="italic text-ink-lighter">Non assigné</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TicketDetail({ ticket, onBack, onUpdate, teamMembers, currentUser }) {
  const [internalNotes, setInternalNotes] = useState(ticket.internal_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [replies, setReplies] = useState([])
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    const q = query(collection(db, `support_tickets/${ticket.id}/replies`), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [ticket.id])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    await onUpdate(ticket.id, 'internal_notes', internalNotes)
    setSavingNotes(false)
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      await addDoc(collection(db, `support_tickets/${ticket.id}/replies`), {
        message: replyText,
        authorId: currentUser.id || currentUser.uid,
        authorName: currentUser.name || currentUser.email,
        authorRole: 'agent', // To distinguish from customer replies
        createdAt: new Date().toISOString()
      })
      // Update the ticket status to 'in_progress' or 'resolved' if needed, or update the main doc's updatedAt
      await onUpdate(ticket.id, 'updatedAt', new Date().toISOString())
      setReplyText('')
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'envoi de la réponse")
    }
    setSendingReply(false)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-primary-600 hover:underline flex items-center">
        <Icon name="arrow_back" className="mr-1" /> Retour à la liste
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader 
              title={ticket.subject} 
              subtitle={`Demande de ${ticket.name} (${ticket.email}) le ${new Date(ticket.createdAt).toLocaleString()}`} 
            />
            <CardBody>
              <div className="space-y-6">
                {/* Initial Message */}
                <div className="bg-surface-raised p-4 rounded-card text-sm text-ink whitespace-pre-wrap border border-border">
                  <div className="font-semibold mb-2">{ticket.name}</div>
                  {ticket.message}
                </div>
                
                {/* Replies Thread */}
                {replies.map(reply => (
                  <div key={reply.id} className={`p-4 rounded-card text-sm whitespace-pre-wrap border ${reply.authorRole === 'agent' ? 'bg-primary-50 border-primary-100 ml-8' : 'bg-surface-raised border-border mr-8'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold text-ink">{reply.authorName} {reply.authorRole === 'agent' && <Badge tone="info">Support</Badge>}</div>
                      <div className="text-xs text-ink-muted">{new Date(reply.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-ink">{reply.message}</div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <div className="mt-6 border-t border-border pt-4">
                <label className="block text-sm font-semibold text-ink mb-2">Répondre au client</label>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Écrivez votre réponse ici..."
                  className="w-full rounded-card border border-border p-3 text-sm min-h-[120px] mb-3 focus:ring-primary-500 focus:border-primary-500"
                />
                <Button variant="primary" onClick={handleSendReply} disabled={sendingReply}>
                  {sendingReply ? 'Envoi...' : 'Envoyer la réponse'}
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes Internes (Équipe Uniquement)" subtitle="Ces notes ne sont pas visibles par le client." />
            <CardBody>
              <textarea
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder="Ajoutez vos notes d'investigation ici..."
                className="w-full rounded-card border border-border p-3 text-sm min-h-[150px] mb-3 bg-yellow-50 focus:bg-white"
              />
              <Button variant="secondary" onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? 'Enregistrement...' : 'Enregistrer les notes internes'}
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <Card>
            <CardHeader title="Détails du Ticket" />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Assigné à</label>
                <select 
                  value={ticket.assignee || ''} 
                  onChange={e => onUpdate(ticket.id, 'assignee', e.target.value)}
                  className="w-full text-sm rounded border-border py-1.5 px-2 bg-surface"
                >
                  <option value="">-- Non assigné --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name || m.email} ({m.role})</option>
                  ))}
                </select>
                {!ticket.assignee && (
                  <button 
                    onClick={() => onUpdate(ticket.id, 'assignee', currentUser.id)}
                    className="text-xs text-primary-600 hover:underline mt-1"
                  >
                    M'assigner ce ticket
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Statut</label>
                <select 
                  value={ticket.status || 'open'} 
                  onChange={e => onUpdate(ticket.id, 'status', e.target.value)}
                  className="w-full text-sm rounded border-border py-1.5 px-2 bg-surface"
                >
                  {Object.entries(TICKET_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Priorité</label>
                <select 
                  value={ticket.priority || 'medium'} 
                  onChange={e => onUpdate(ticket.id, 'priority', e.target.value)}
                  className="w-full text-sm rounded border-border py-1.5 px-2 bg-surface"
                >
                  {Object.entries(TICKET_PRIORITY).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Catégorie</label>
                <select 
                  value={ticket.category || 'general'} 
                  onChange={e => onUpdate(ticket.id, 'category', e.target.value)}
                  className="w-full text-sm rounded border-border py-1.5 px-2 bg-surface"
                >
                  {Object.entries(TICKET_CATEGORY).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
