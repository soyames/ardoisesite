import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { Card, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Icon from '../ui/Icon.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

function conversationLabel(conversation, currentUserId) {
  if (conversation.is_group) return conversation.name || 'Groupe sans nom'
  const other = conversation.participants.find((p) => p.id !== currentUserId)
  return other?.full_name || 'Conversation'
}

function NewConversationForm({ staff, onCreated, onCancel }) {
  const [selected, setSelected] = useState([])
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submit = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const conversation = await api.post('/api/collab/conversations/', {
        participant_ids: selected,
        is_group: selected.length > 1,
        name: selected.length > 1 ? name : '',
      })
      onCreated(conversation)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-sm font-medium text-ink">Nouvelle conversation</p>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-control ring-1 ring-inset ring-border p-2">
        {staff.map((person) => (
          <label key={person.id} className="flex items-center gap-2 rounded-control px-2 py-1.5 text-sm hover:bg-primary-50/60">
            <input type="checkbox" checked={selected.includes(person.id)} onChange={() => toggle(person.id)} />
            <span className="text-ink">{person.full_name}</span>
            <span className="text-xs text-ink-muted">({person.role})</span>
          </label>
        ))}
      </div>
      {selected.length > 1 && (
        <input
          className={INPUT_CLASS}
          placeholder="Nom du groupe (optionnel)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={submitting || selected.length === 0}>
          {submitting ? 'Creation...' : 'Demarrer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  )
}

export default function MessagesPanel() {
  const { user } = useAuth()
  const conversations = useApiGet('/api/collab/conversations/')
  const staffDirectory = useApiGet('/api/collab/staff-directory/')
  const [activeId, setActiveId] = useState(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const messages = useApiGet(
    activeId ? `/api/collab/conversations/${activeId}/messages/` : null,
    { skip: !activeId }
  )

  useEffect(() => {
    if (!activeId && conversations.data?.length > 0) {
      setActiveId(conversations.data[0].id)
    }
  }, [conversations.data, activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data])

  const send = async () => {
    if (!body.trim() || !activeId) return
    setSending(true)
    try {
      await api.post(`/api/collab/conversations/${activeId}/messages/`, { body: body.trim() })
      setBody('')
      messages.refetch()
      conversations.refetch()
    } finally {
      setSending(false)
    }
  }

  const activeConversation = conversations.data?.find((c) => c.id === activeId)

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-ink">Conversations</p>
          <Button size="sm" variant="secondary" onClick={() => setShowNewConversation((v) => !v)}>
            + Nouveau
          </Button>
        </div>

        {showNewConversation && staffDirectory.data && (
          <NewConversationForm
            staff={staffDirectory.data}
            onCancel={() => setShowNewConversation(false)}
            onCreated={(conversation) => {
              setShowNewConversation(false)
              conversations.refetch()
              setActiveId(conversation.id)
            }}
          />
        )}

        {conversations.loading && <div className="flex justify-center py-8"><Spinner /></div>}

        {!conversations.loading && conversations.data?.length === 0 && !showNewConversation && (
          <div className="p-4">
            <EmptyState title="Aucune conversation" description="Demarrez-en une avec un collegue." />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.data?.map((c) => {
            const label = conversationLabel(c, user.id)
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition ${
                  activeId === c.id ? 'bg-primary-50' : 'hover:bg-primary-50/50'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  {c.is_group ? <Icon name="groups" /> : <span className="text-xs font-bold">{label.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{label}</span>
                    {c.last_message && (
                      <span className="shrink-0 text-[11px] text-ink-muted">
                        {new Date(c.last_message.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {c.last_message ? (
                      <span className="truncate text-xs text-ink-muted">{c.last_message.body || 'Document partage'}</span>
                    ) : (
                      <span className="text-xs text-ink-muted">Aucun message</span>
                    )}
                    {c.unread_count > 0 && <Badge tone="info">{c.unread_count}</Badge>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {!activeConversation && (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState title="Selectionnez une conversation" description="Ou demarrez-en une nouvelle." />
          </div>
        )}

        {activeConversation && (
          <>
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-ink">{conversationLabel(activeConversation, user.id)}</p>
              {activeConversation.is_group && (
                <p className="text-xs text-ink-muted">
                  {activeConversation.participants.map((p) => p.full_name).join(', ')}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.loading && <div className="flex justify-center py-6"><Spinner /></div>}
              {messages.data?.map((m) => (
                <div key={m.id} className="max-w-[80%] rounded-card bg-primary-50/70 px-3 py-2">
                  <p className="text-xs font-medium text-primary-700">{m.sender?.full_name}</p>
                  {m.body && <p className="mt-0.5 text-sm text-ink">{m.body}</p>}
                  {m.document && (
                    <a href={m.document.file} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-primary-600 underline">
                      {m.document.title}
                    </a>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 border-t border-border p-3">
              <input
                className={`flex-1 ${INPUT_CLASS}`}
                placeholder="Ecrire un message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <Button size="sm" onClick={send} disabled={sending || !body.trim()}>Envoyer</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
