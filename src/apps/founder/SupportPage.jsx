import React, { useState, useEffect } from 'react'
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'

export default function SupportPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTicket, setActiveTicket] = useState(null)

  useEffect(() => {
    if (!user?.email) return
    const q = query(
      collection(db, 'support_tickets'),
      where('email', '==', user.email)
    )
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sort in JS because we query by email without a composite index on email+createdAt
      fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setTickets(fetched)
    })
    return () => unsub()
  }, [user?.email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setIsSubmitting(true)
    
    try {
      await addDoc(collection(db, 'support_tickets'), {
        name: user.name || 'Founder',
        email: user.email,
        subject,
        message,
        status: 'new',
        source: 'in_app',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      setSubject('')
      setMessage('')
      alert("Votre demande de support a été envoyée. Nous vous répondrons sous peu.")
    } catch (err) {
      console.error(err)
      alert("Une erreur est survenue.")
    }
    setIsSubmitting(false)
  }

  if (activeTicket) {
    return <TicketThread ticket={activeTicket} currentUser={user} onBack={() => setActiveTicket(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader title="Contacter le Support" subtitle="Besoin d'aide avec Ardoise ?" />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Sujet</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full rounded-card border-border bg-surface px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Problème de facturation..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Message</label>
                <textarea
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full rounded-card border-border bg-surface px-3 py-2 text-sm min-h-[150px] focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Décrivez votre problème en détail..."
                />
              </div>
              <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full justify-center">
                {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Vos tickets de support" subtitle="Suivez l'état de vos demandes" />
          <CardBody>
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-sm">
                Aucun ticket pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setActiveTicket(ticket)}
                    className="p-4 border border-border rounded-card hover:bg-surface-raised cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-ink truncate">{ticket.subject}</h4>
                      <Badge tone={ticket.status === 'new' ? 'warning' : ticket.status === 'in_progress' ? 'info' : 'success'}>
                        {ticket.status === 'new' ? 'Nouveau' : ticket.status === 'in_progress' ? 'En cours' : 'Résolu'}
                      </Badge>
                    </div>
                    <div className="text-sm text-ink-muted truncate mb-2">{ticket.message}</div>
                    <div className="text-xs text-ink-muted">
                      Mis à jour le {new Date(ticket.updatedAt || ticket.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function TicketThread({ ticket, currentUser, onBack }) {
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

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      await addDoc(collection(db, `support_tickets/${ticket.id}/replies`), {
        message: replyText,
        authorId: currentUser.id || currentUser.uid,
        authorName: currentUser.name || currentUser.email,
        authorRole: 'customer',
        createdAt: new Date().toISOString()
      })
      setReplyText('')
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'envoi de la réponse")
    }
    setSendingReply(false)
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-sm text-primary-600 hover:underline flex items-center">
        &larr; Retour à la liste des tickets
      </button>

      <Card>
        <CardHeader 
          title={ticket.subject} 
          subtitle={`Créé le ${new Date(ticket.createdAt).toLocaleString()}`} 
        />
        <CardBody>
          <div className="space-y-6">
            {/* Initial Message */}
            <div className="bg-surface-raised p-4 rounded-card text-sm text-ink whitespace-pre-wrap border border-border">
              {ticket.message}
            </div>
            
            {/* Replies Thread */}
            {replies.map(reply => (
              <div key={reply.id} className={`p-4 rounded-card text-sm whitespace-pre-wrap border ${reply.authorRole === 'customer' ? 'bg-primary-50 border-primary-100 ml-8' : 'bg-surface-raised border-border mr-8'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-ink">{reply.authorName} {reply.authorRole === 'agent' && <Badge tone="info">Support Ardoise</Badge>}</div>
                  <div className="text-xs text-ink-muted">{new Date(reply.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-ink">{reply.message}</div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'resolved' && (
            <div className="mt-6 border-t border-border pt-4">
              <label className="block text-sm font-semibold text-ink mb-2">Ajouter une réponse</label>
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
          )}
        </CardBody>
      </Card>
    </div>
  )
}
