import { useState, useEffect } from 'react'
import { api } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import AppointmentSlotsPanel from '../../shared/components/AppointmentSlotsPanel.jsx'

// Helper just for updating UI status in Firestore directly for the Marketplace
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'

const QUEUE_STATUSES = [
  { value: 'pending', label: 'Nouvelle demande', tone: 'danger' },
  { value: 'docs', label: 'Documents envoyes', tone: 'neutral' },
  { value: 'interviewed', label: 'Entretien effectue', tone: 'info' },
  { value: 'waitlisted', label: 'Liste d’attente', tone: 'neutral' },
]

function timeAgo(value) {
  if (!value) return '—'
  const ms = Date.now() - new Date(value).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'hier' : `il y a ${days} j`
}

export default function EnrollmentPanel() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/auth/marketplace/enrollment-requests/')
      .then(data => {
        if (active) {
          setEnrollments(data)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error(err)
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (newStatus === 'accepted') {
        // We must pass through Django so it creates the Student and Parent locally!
        await api.post(`/api/auth/marketplace/enrollment-requests/${id}/accept/`)
      }

      // Update the Marketplace Firestore doc so parents see the status
      await updateDoc(doc(db, 'school_enrollment_requests', id), { status: newStatus })

      // Update local UI
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
      if (newStatus === 'accepted' || newStatus === 'rejected') setSelectedId(null)
    } catch (err) {
      alert("Une erreur est survenue.")
      console.error(err)
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>

  const queue = enrollments
    .filter(e => e.status !== 'accepted' && e.status !== 'rejected')
    .filter(e => !search || e.childName?.toLowerCase().includes(search.toLowerCase()))
  const selected = queue.find((e) => e.id === selectedId)
  const statusInfo = (value) => QUEUE_STATUSES.find((s) => s.value === value) || QUEUE_STATUSES[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon="how_to_reg" label="En file d'attente" value={queue.length} tone={queue.length > 0 ? 'warning' : 'success'} />
        <StatCard icon="event_available" label="Nouvelles demandes" value={queue.filter((e) => e.status === 'pending').length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader
              title="File d'inscription"
              action={
                <input
                  className="rounded-control border border-border bg-surface px-3 py-1.5 text-xs"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              }
            />
            {queue.length === 0 ? (
              <CardBody><EmptyState title="Aucune demande" description="Il n'y a pas de nouvelle demande d'inscription." /></CardBody>
            ) : (
              <div className="divide-y divide-border">
                {queue.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id === selectedId ? null : e.id)}
                    className={`flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-surface-hover ${selectedId === e.id ? 'bg-primary-50' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{e.childName}</p>
                      <p className="text-xs text-ink-muted">{e.childClass} - {timeAgo(e.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={statusInfo(e.status).tone}>{statusInfo(e.status).label}</Badge>
                      <Icon name="chevron_right" className="text-ink-muted" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <Card>
              <CardHeader title={selected.childName} subtitle={`${selected.childAge} ans - Classe demandee : ${selected.childClass}`} />
              <CardBody className="space-y-4">
                <div className="space-y-1 text-sm">
                  <p className="text-ink"><span className="text-ink-muted">Parent :</span> {selected.parentName}</p>
                  <p className="text-ink"><span className="text-ink-muted">Telephone :</span> {selected.parentPhone}</p>
                  <p className="text-ink"><span className="text-ink-muted">Email :</span> {selected.parentEmail}</p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-muted">Statut actuel</label>
                  <select
                    className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm"
                    value={selected.status}
                    onChange={(e) => handleStatusUpdate(selected.id, e.target.value)}
                  >
                    {QUEUE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(selected.id, 'rejected')}>
                    Refuser
                  </Button>
                  <Button size="sm" onClick={() => handleStatusUpdate(selected.id, 'accepted')}>
                    Accepter et inscrire
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <AppointmentSlotsPanel />
          )}
        </div>
      </div>

      {selected && <AppointmentSlotsPanel />}
    </div>
  )
}