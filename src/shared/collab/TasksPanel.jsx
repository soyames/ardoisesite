import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const SCOPES = [
  { key: '', label: 'Toutes' },
  { key: 'mine', label: 'Assignees a moi' },
  { key: 'assigned_by_me', label: 'Assignees par moi' },
  { key: 'watching', label: 'En observation' },
]

const STATUS_TONE = { todo: 'neutral', in_progress: 'info', blocked: 'danger', done: 'success' }
const STATUS_LABEL = { todo: 'A faire', in_progress: 'En cours', blocked: 'Bloquee', done: 'Terminee' }
const PRIORITY_TONE = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'danger' }

function NewTaskForm({ staff, onCreated, onCancel }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [checklist, setChecklist] = useState([''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const updateChecklistItem = (i, value) => {
    setChecklist((prev) => prev.map((item, idx) => (idx === i ? value : item)))
  }

  const submit = async () => {
    if (!title.trim() || !assignedTo) return
    setSubmitting(true)
    setError(null)
    try {
      const task = await api.post('/api/collab/tasks/', {
        title: title.trim(),
        description: description.trim(),
        assigned_to: Number(assignedTo),
        priority,
        due_date: dueDate || null,
        recurrence,
        checklist_items: checklist.map((c) => c.trim()).filter(Boolean),
      })
      onCreated(task)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardBody className="space-y-3">
        <p className="text-sm font-semibold text-ink">Nouvelle tache</p>
        <input className={INPUT_CLASS} placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className={INPUT_CLASS}
          placeholder="Description (optionnel)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <select className={INPUT_CLASS} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Assigner a...</option>
            {staff.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
            ))}
          </select>
          <select className={INPUT_CLASS} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Basse</option>
            <option value="medium">Normale</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
          <input type="date" className={INPUT_CLASS} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <select className={INPUT_CLASS} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            <option value="none">Pas de recurrence</option>
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Liste de verification</p>
          {checklist.map((item, i) => (
            <input
              key={i}
              className={INPUT_CLASS}
              placeholder={`Etape ${i + 1}`}
              value={item}
              onChange={(e) => updateChecklistItem(i, e.target.value)}
            />
          ))}
          <button
            type="button"
            onClick={() => setChecklist((prev) => [...prev, ''])}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            + Ajouter une etape
          </button>
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={submit} disabled={submitting || !title.trim() || !assignedTo}>
            {submitting ? 'Creation...' : 'Assigner'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
        </div>
      </CardBody>
    </Card>
  )
}

function TaskDetail({ task, onClose, onChanged }) {
  const updates = useApiGet(`/api/collab/tasks/${task.id}/updates/`)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)

  const setStatus = async (status) => {
    await api.patch(`/api/collab/tasks/${task.id}/`, { status })
    updates.refetch()
    onChanged()
  }

  const toggleChecklistItem = async (item) => {
    await api.patch(`/api/collab/tasks/${task.id}/checklist/${item.id}/`, { is_done: !item.is_done })
    onChanged()
  }

  const postComment = async () => {
    if (!comment.trim()) return
    setPosting(true)
    try {
      await api.post(`/api/collab/tasks/${task.id}/updates/`, { body: comment.trim() })
      setComment('')
      updates.refetch()
    } finally {
      setPosting(false)
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{task.title}</p>
            {task.description && <p className="mt-1 text-sm text-ink-muted">{task.description}</p>}
            <p className="mt-1 text-xs text-ink-muted">
              Assignee a {task.assigned_to?.full_name} par {task.assigned_by?.full_name}
            </p>
          </div>
          <button onClick={onClose} className="text-xs text-ink-muted hover:text-ink">Fermer</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`rounded-control px-3 py-1.5 text-xs font-medium transition ${
                task.status === key ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {task.checklist_items?.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-ink-muted">
              Liste de verification ({task.checklist_progress?.done}/{task.checklist_progress?.total})
            </p>
            {task.checklist_items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={item.is_done} onChange={() => toggleChecklistItem(item)} />
                <span className={item.is_done ? 'text-ink-muted line-through' : 'text-ink'}>{item.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-ink-muted">Suivi et progression</p>
          {updates.loading && <div className="flex justify-center py-3"><Spinner /></div>}
          {updates.data?.map((u) => (
            <div key={u.id} className="text-sm">
              {u.kind === 'status_change' ? (
                <p className="text-xs italic text-ink-muted">
                  {u.author?.full_name} - {u.body}
                </p>
              ) : (
                <p className="text-ink"><span className="font-medium">{u.author?.full_name}:</span> {u.body}</p>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className={`flex-1 ${INPUT_CLASS}`}
              placeholder="Ajouter un commentaire de progression..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && postComment()}
            />
            <Button size="sm" onClick={postComment} disabled={posting || !comment.trim()}>Publier</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function TasksPanel() {
  const [scope, setScope] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const staffDirectory = useApiGet('/api/collab/staff-directory/')
  const tasks = useApiGet(`/api/collab/tasks/${scope ? `?scope=${scope}` : ''}`)

  const selectedTask = tasks.data?.find((t) => t.id === selectedTaskId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={`rounded-control px-3 py-1.5 text-xs font-medium transition ${
                scope === s.key ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>+ Nouvelle tache</Button>
      </div>

      {showForm && staffDirectory.data && (
        <NewTaskForm
          staff={staffDirectory.data}
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            tasks.refetch()
          }}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onChanged={tasks.refetch}
        />
      )}

      {tasks.loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!tasks.loading && tasks.data?.length === 0 && (
        <EmptyState title="Aucune tache" description="Assignez-en une a un collegue pour commencer." />
      )}

      <div className="space-y-2">
        {tasks.data?.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-border bg-surface-raised px-4 py-3 text-left transition hover:shadow-elevated"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{task.title}</p>
              <p className="truncate text-xs text-ink-muted">
                {task.assigned_to?.full_name}
                {task.due_date && ` - Echeance ${task.due_date}`}
                {task.checklist_progress && ` - ${task.checklist_progress.done}/${task.checklist_progress.total} etapes`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
              <Badge tone={STATUS_TONE[task.status]}>{STATUS_LABEL[task.status]}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
