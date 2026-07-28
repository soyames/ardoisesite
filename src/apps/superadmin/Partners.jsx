import { useState, useEffect } from 'react'
import { auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { Card, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const STATUS_FILTERS = [
  { value: 'pending', label: 'En attente', tone: 'warning' },
  { value: 'approved', label: 'Approuvés', tone: 'success' },
  { value: 'rejected', label: 'Refusés', tone: 'danger' },
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

// Certified-partner network vetting queue (2026-07-28 Odoo-model pivot) --
// mirrors Crm.jsx's authedFetch/list pattern. A developer applies from
// their own Espace Développeur (DeveloperPortal.jsx writes
// certifiedPartners/{uid} directly, status:'pending'); status transitions
// only ever happen here, via the Worker's Admin-SDK-backed approve/reject
// routes (firestore.rules blocks the client from ever setting status
// itself).
export default function Partners() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [partners, setPartners] = useState(null)
  const [actingOn, setActingOn] = useState(null)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      const data = await authedFetch(`/api/admin/partners?status=${statusFilter}`)
      setPartners(data)
    } catch (err) {
      console.error('Failed to load partner applications:', err)
      setPartners([])
    }
  }
  useEffect(() => { setPartners(null); load() }, [statusFilter])

  const act = async (partnerId, action) => {
    setActingOn(partnerId)
    setError(null)
    try {
      await authedFetch(`/api/admin/partners/${partnerId}/${action}`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setActingOn(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Réseau de partenaires certifiés</h2>
        <p className="text-sm text-ink-muted">Vérifiez les candidatures avant qu'un partenaire ne soit visible dans l'annuaire public.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusFilter === s.value ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface-raised text-ink-muted ring-border'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <Card>
        {partners === null ? (
          <CardBody><p className="text-sm text-ink-muted">Chargement...</p></CardBody>
        ) : partners.length === 0 ? (
          <CardBody><EmptyState title="Aucune candidature" description="Aucun partenaire ne correspond à ce filtre." /></CardBody>
        ) : (
          <div className="divide-y divide-border">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{p.publicName}</p>
                    <Badge tone={STATUS_FILTERS.find((s) => s.value === p.status)?.tone || 'neutral'}>
                      {STATUS_FILTERS.find((s) => s.value === p.status)?.label || p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{p.country} · {p.contactEmail || p.contactPhone}</p>
                  {p.bio && <p className="text-xs text-ink-muted mt-1">{p.bio}</p>}
                  {Array.isArray(p.specialties) && p.specialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-primary-100 text-primary-800 text-xs px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                {p.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" disabled={actingOn === p.id} onClick={() => act(p.id, 'reject')}>Refuser</Button>
                    <Button size="sm" variant="primary" disabled={actingOn === p.id} onClick={() => act(p.id, 'approve')}>Approuver</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
