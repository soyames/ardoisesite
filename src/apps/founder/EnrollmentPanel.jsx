import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import AppointmentSlotsPanel from '../../shared/components/AppointmentSlotsPanel.jsx'
import { useSchoolSubscription } from '../../shared/hooks/useSchoolSubscription.js'

const QUEUE_STATUSES = [
  { value: 'pending_review', label: 'Nouvelle demande', tone: 'danger' },
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
  const { isPremium } = useSchoolSubscription()

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

  // Pre-payment queue transitions only (pending_review -> accepted/
  // rejected/docs/interviewed/waitlisted). Goes through Django, which
  // writes the Firestore status via the signed Worker bridge -
  // EnrollmentPanel used to updateDoc() this straight from the browser,
  // but firestore.rules now restricts that field to that signed path
  // only, so the direct client write was silently failing every time.
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/api/auth/marketplace/enrollment-requests/${id}/status/`, { status: newStatus })
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
      if (newStatus === 'rejected') setSelectedId(null)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Une erreur est survenue.")
      console.error(err)
    }
  }

  // The heavy, final step - only ever available once the family has
  // paid (paymentStatus) AND self-booked their on-premise appointment
  // (e.appointment, set by PublicBookAppointmentView) - creates the
  // real Student/Parent/Enrollment. Distinct from "accepted" above,
  // which only makes the request payable and doesn't touch Django's
  // student data at all.
  const handleFinalize = async (id) => {
    try {
      await api.post(`/api/auth/marketplace/enrollment-requests/${id}/accept/`)
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'enrolled' } : e))
      setSelectedId(null)
    } catch (err) {
      // Surfaces the real reason (e.g. "Aucune classe... trouvee.
      // Creez-la d'abord." from MarketplaceEnrollmentAcceptView when
      // the requested class doesn't exist yet) instead of a generic
      // message that gave no path forward - a Secretary hitting this
      // needs to know to ask the Fondateur/Directeur/Censeur to create
      // the class, the same guidance the manual enrollment form
      // already gives (see SecretaryPortal.jsx).
      alert(err instanceof ApiError ? err.message : "Une erreur est survenue.")
      console.error(err)
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>

  const queue = enrollments
    .filter(e => e.status !== 'rejected' && e.status !== 'enrolled')
    .filter(e => !search || e.childName?.toLowerCase().includes(search.toLowerCase()))
  const selected = queue.find((e) => e.id === selectedId)
  const statusInfo = (value) => QUEUE_STATUSES.find((s) => s.value === value) || QUEUE_STATUSES[0]
  const isPaid = (e) => e?.paymentStatus === 'paid_on_ardoise'
  const canFinalize = (e) => isPaid(e) && !!e?.appointment

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon="how_to_reg" label="En file d'attente" value={queue.length} tone={queue.length > 0 ? 'warning' : 'success'} />
        <StatCard icon="event_available" label="Nouvelles demandes" value={queue.filter((e) => e.status === 'pending_review').length} />
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

                {selected.additionalComments && (
                  <div className="rounded-control bg-primary-50 border border-primary-100 p-3 text-sm">
                    <p className="font-semibold text-primary-900 mb-1">Commentaires du parent :</p>
                    <p className="text-primary-800 whitespace-pre-wrap">{selected.additionalComments}</p>
                  </div>
                )}

                {selected.localDocuments && selected.localDocuments.length > 0 && (
                  <div className="rounded-control bg-surface border border-border p-3 text-sm">
                    <p className="font-semibold text-ink mb-2">Documents fournis :</p>
                    <ul className="space-y-1">
                      {selected.localDocuments.map(doc => (
                        <li key={doc.id}>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-800 underline flex items-center gap-1">
                            <Icon name="description" className="text-sm" />
                            {doc.type}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isPremium && (
                  <div className="rounded-card bg-accent-50 p-4 border border-accent-200">
                    <p className="text-sm text-accent-800">
                      <strong>Mise a niveau requise :</strong> Votre plan actuel ne permet pas de traiter les demandes d'inscription. <a href="https://saas.ardoise.soyames.com/pricing" className="underline" target="_blank" rel="noreferrer">Passez a la version Premium</a> pour continuer.
                    </p>
                  </div>
                )}

                {selected.status === 'accepted' && (
                  <div className="rounded-control bg-surface border border-border p-3 text-sm space-y-1">
                    <p className="text-ink">
                      <span className="text-ink-muted">Paiement :</span>{' '}
                      {isPaid(selected) ? 'Recu' : "En attente du parent"}
                    </p>
                    <p className="text-ink">
                      <span className="text-ink-muted">Rendez-vous :</span>{' '}
                      {selected.appointment
                        ? `${selected.appointment.date} (${selected.appointment.start_time} - ${selected.appointment.end_time})`
                        : "Pas encore reserve par le parent"}
                    </p>
                  </div>
                )}

                {selected.status !== 'accepted' && selected.status !== 'rejected' && (
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
                )}

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Link
                    to={`/live-room/enrollment-${selected.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-control bg-primary-100 px-3 py-1.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">video_call</span>
                    Visio-conférence
                  </Link>
                  <div className="flex-1"></div>
                  {selected.status !== 'accepted' ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(selected.id, 'rejected')} disabled={!isPremium}>
                        Refuser
                      </Button>
                      <Button size="sm" onClick={() => handleStatusUpdate(selected.id, 'accepted')} disabled={!isPremium}>
                        Accepter la demande
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => handleFinalize(selected.id)} disabled={!isPremium || !canFinalize(selected)}>
                      Finaliser l'inscription
                    </Button>
                  )}
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