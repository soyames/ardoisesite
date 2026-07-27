import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const PIPELINE_STAGES = [
  { value: 'prospect', label: 'Prospect', tone: 'neutral' },
  { value: 'contacted', label: 'Contacté', tone: 'info' },
  { value: 'demo', label: 'Démo effectuée', tone: 'info' },
  { value: 'trial', label: 'Essai en cours', tone: 'warning' },
  { value: 'customer', label: 'Client', tone: 'success' },
  { value: 'churned', label: 'Perdu', tone: 'danger' },
]
const STAGE_BY_VALUE = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.value, s]))
const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note', icon: 'edit_note' },
  { value: 'call', label: 'Appel', icon: 'call' },
  { value: 'email', label: 'Email', icon: 'mail' },
  { value: 'meeting', label: 'Rendez-vous', icon: 'groups' },
]

async function authedFetch(path, options = {}) {
  const idToken = await auth.currentUser.getIdToken()
  const res = await fetch(`${getPlatformApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
  return data
}

function daysSince(iso) {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / 86400000)
}

function StageBadge({ stage }) {
  const info = STAGE_BY_VALUE[stage] || STAGE_BY_VALUE.prospect
  return <Badge tone={info.tone}>{info.label}</Badge>
}

export default function Crm() {
  const [schools, setSchools] = useState(null)
  const [leads, setLeads] = useState(null)
  const [stageFilter, setStageFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // { kind: 'school'|'lead', id, name }
  const [showNewLead, setShowNewLead] = useState(false)

  useEffect(() => {
    const unsubSchools = onSnapshot(collection(db, 'schools'), (snap) => {
      setSchools(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsubSchools()
  }, [])

  const loadLeads = async () => {
    try {
      const data = await authedFetch('/api/admin/crm/leads')
      setLeads(data)
    } catch (err) {
      console.error('Failed to load CRM leads:', err)
      setLeads([])
    }
  }
  useEffect(() => { loadLeads() }, [])

  const rows = useMemo(() => {
    if (!schools || !leads) return null
    const schoolRows = schools.map((s) => ({
      kind: 'school', id: s.id, name: s.name || 'École sans nom',
      pipelineStage: s.pipelineStage || (s.subscriptionActive ? 'customer' : 'prospect'),
      lastContactedAt: s.lastContactedAt || null,
      subscriptionActive: !!s.subscriptionActive,
      city: s.city || '',
    }))
    const leadRows = leads.map((l) => ({
      kind: 'lead', id: l.id, name: l.name,
      pipelineStage: l.pipelineStage || 'prospect',
      lastContactedAt: l.lastContactedAt || null,
      subscriptionActive: false,
      city: l.contactPhone || l.contactEmail || '',
    }))
    let all = [...schoolRows, ...leadRows]
    if (stageFilter !== 'all') all = all.filter((r) => r.pipelineStage === stageFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      all = all.filter((r) => r.name.toLowerCase().includes(q))
    }
    all.sort((a, b) => {
      const da = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0
      const db_ = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0
      return db_ - da
    })
    return all
  }, [schools, leads, stageFilter, search])

  const counts = useMemo(() => {
    if (!schools || !leads) return {}
    const all = [
      ...schools.map((s) => s.pipelineStage || (s.subscriptionActive ? 'customer' : 'prospect')),
      ...leads.map((l) => l.pipelineStage || 'prospect'),
    ]
    const c = {}
    for (const stage of all) c[stage] = (c[stage] || 0) + 1
    return c
  }, [schools, leads])

  if (schools === null || leads === null) {
    return <div className="p-4 text-ink-muted">Chargement du CRM...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Pipeline commercial</h2>
          <p className="text-sm text-ink-muted">Écoles inscrites et prospects, en un seul endroit.</p>
        </div>
        <Button onClick={() => setShowNewLead(true)}>
          <Icon name="add" /> Nouveau prospect
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStageFilter('all')}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${stageFilter === 'all' ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface-raised text-ink-muted ring-border'}`}
        >
          Tous ({schools.length + leads.length})
        </button>
        {PIPELINE_STAGES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStageFilter(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${stageFilter === s.value ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface-raised text-ink-muted ring-border'}`}
          >
            {s.label} ({counts[s.value] || 0})
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Rechercher par nom..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500"
      />

      <Card>
        {rows.length === 0 ? (
          <CardBody><EmptyState title="Aucun résultat" description="Aucune école ou prospect ne correspond à ce filtre." /></CardBody>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => {
              const days = daysSince(row.lastContactedAt)
              return (
                <button
                  key={`${row.kind}-${row.id}`}
                  onClick={() => setSelected(row)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-primary-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {row.name}
                      {row.kind === 'lead' && <span className="ml-2 text-xs text-ink-muted">(prospect non-inscrit)</span>}
                    </p>
                    {row.city && <p className="truncate text-xs text-ink-muted">{row.city}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-ink-muted">
                      {days === null ? 'Jamais contacté' : days === 0 ? "Aujourd'hui" : `Il y a ${days} j`}
                    </span>
                    <StageBadge stage={row.pipelineStage} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {selected && (
        <CrmDetailModal
          entity={selected}
          onClose={() => setSelected(null)}
          onSchoolsChanged={() => {}}
          onLeadsChanged={loadLeads}
        />
      )}
      {showNewLead && (
        <NewLeadModal onClose={() => setShowNewLead(false)} onCreated={() => { setShowNewLead(false); loadLeads() }} />
      )}
    </div>
  )
}

function NewLeadModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await authedFetch('/api/admin/crm/leads', {
        method: 'POST',
        body: JSON.stringify({ name, contactName, contactPhone, contactEmail, notes }),
      })
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-card bg-surface-raised p-6 shadow-elevated">
        <h3 className="text-base font-semibold text-ink">Nouveau prospect</h3>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input required placeholder="Nom de l'école" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500" />
          <input placeholder="Nom du contact" value={contactName} onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500" />
          <input placeholder="Téléphone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500" />
          <input placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500" />
          <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500" />
          {error && <p className="text-sm text-danger-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CrmDetailModal({ entity, onClose, onLeadsChanged }) {
  const [activities, setActivities] = useState(null)
  const [stage, setStage] = useState(entity.pipelineStage)
  const [savingStage, setSavingStage] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [newType, setNewType] = useState('note')
  const [submittingNote, setSubmittingNote] = useState(false)
  const [error, setError] = useState(null)

  const loadActivities = async () => {
    try {
      const data = await authedFetch(`/api/admin/crm/activities?entityType=${entity.kind === 'school' ? 'school' : 'lead'}&entityId=${entity.id}`)
      setActivities(data)
    } catch (err) {
      console.error('Failed to load CRM activities:', err)
      setActivities([])
    }
  }
  useEffect(() => { loadActivities() }, [entity.id])

  const changeStage = async (nextStage) => {
    setStage(nextStage)
    setSavingStage(true)
    setError(null)
    try {
      if (entity.kind === 'school') {
        await authedFetch(`/api/admin/schools/${entity.id}/crm`, { method: 'POST', body: JSON.stringify({ pipelineStage: nextStage }) })
      } else {
        await authedFetch(`/api/admin/crm/leads/${entity.id}`, { method: 'PATCH', body: JSON.stringify({ pipelineStage: nextStage }) })
        onLeadsChanged()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingStage(false)
    }
  }

  const addActivity = async (e) => {
    e.preventDefault()
    if (!newNote.trim()) return
    setSubmittingNote(true)
    setError(null)
    try {
      await authedFetch('/api/admin/crm/activities', {
        method: 'POST',
        body: JSON.stringify({ entityType: entity.kind, entityId: entity.id, type: newType, text: newNote }),
      })
      setNewNote('')
      await loadActivities()
      if (entity.kind === 'lead') onLeadsChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmittingNote(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface-raised p-6 shadow-elevated">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-ink">{entity.name}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><Icon name="close" /></button>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Étape du pipeline</p>
          <select
            value={stage}
            disabled={savingStage}
            onChange={(e) => changeStage(e.target.value)}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500"
          >
            {PIPELINE_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-ink-muted">Historique des interactions</p>
          {activities === null ? (
            <p className="text-sm text-ink-muted">Chargement...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-ink-muted">Aucune interaction enregistrée.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => {
                const meta = ACTIVITY_TYPES.find((t) => t.value === a.type) || ACTIVITY_TYPES[0]
                return (
                  <div key={a.id} className="flex gap-3 rounded-control bg-primary-50/40 p-3">
                    <Icon name={meta.icon} className="mt-0.5 shrink-0 text-primary-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{a.text}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {a.authorName || 'Équipe'} · {a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <form onSubmit={addActivity} className="mt-5 space-y-2 border-t border-border pt-4">
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setNewType(t.value)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${newType === t.value ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface-raised text-ink-muted ring-border'}`}
              >
                <Icon name={t.icon} className="text-sm" /> {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ajouter une note..."
            rows={2}
            className="w-full rounded-control border-0 py-2 px-3 text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submittingNote}>{submittingNote ? 'Ajout...' : 'Ajouter'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
