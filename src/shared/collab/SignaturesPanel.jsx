import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { Card, CardBody, CardHeader } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Icon from '../ui/Icon.jsx'

const TABS = [
  { key: 'pending', label: 'A signer' },
  { key: 'sent', label: 'Envoyees pour signature' },
]

/**
 * Multi-signer approval workflow - the "Signatures & Flux" Stitch
 * screen. Lists in-progress SignatureRequest chains (mine to sign, or
 * ones I started) with a stepper detail panel on the side, matching
 * the mockup's list + sticky detail layout. See
 * apps/collab/models.py:SignatureRequest for the real state machine
 * this reads - signing the last step calls the same sign_document()
 * a single-signer document already used, so this is a real workflow
 * against real backend state, not a mocked-up stepper.
 */
export default function SignaturesPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending')
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pending = useApiGet('/api/collab/signature-requests/pending-for-me/')
  const sent = useApiGet('/api/collab/signature-requests/sent-by-me/')
  const list = tab === 'pending' ? pending : sent

  const items = list.data || []
  const selected = items.find((r) => r.id === selectedId) || items[0] || null

  const refetchBoth = () => {
    pending.refetch()
    sent.refetch()
  }

  const currentStepFor = (req) => req?.steps.find((s) => s.status === 'pending')
  const isMyTurn = (req) => currentStepFor(req)?.signer?.id === user?.id

  const signCurrent = async (req) => {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/api/collab/documents/${req.document}/signature-requests/sign/`, {})
      refetchBoth()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(false)
    }
  }

  const rejectCurrent = async (req) => {
    setBusy(true)
    setError(null)
    try {
      await api.post(`/api/collab/documents/${req.document}/signature-requests/reject/`, {})
      refetchBoth()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex gap-1 rounded-control border border-border bg-surface-raised p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedId(null) }}
              className={`flex-1 rounded-control py-2 text-sm font-medium transition ${
                tab === t.key ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:bg-surface-hover'
              }`}
            >
              {t.label}
              {t.key === 'pending' && pending.data?.length > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-[11px] font-bold text-white">
                  {pending.data.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}
        {list.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!list.loading && items.length === 0 && (
          <EmptyState
            title={tab === 'pending' ? 'Rien a signer' : 'Aucun envoi en cours'}
            description={tab === 'pending' ? 'Vous etes a jour.' : 'Demandez une signature depuis un document officiel.'}
          />
        )}

        <div className="space-y-2">
          {items.map((req) => {
            const step = currentStepFor(req)
            return (
              <Card
                key={req.id}
                className={`cursor-pointer ${selected?.id === req.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setSelectedId(req.id)}
              >
                <CardBody className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-danger-50 text-danger-700">
                    <Icon name="picture_as_pdf" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{req.document_title || `Document #${req.document}`}</p>
                    <p className="text-xs text-ink-muted">Demande par {req.requested_by?.full_name}</p>
                  </div>
                  {step && <Badge tone="warning">En attente: {step.signer?.full_name}</Badge>}
                  {tab === 'pending' && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); signCurrent(req) }} disabled={busy}>
                      Signer maintenant
                    </Button>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        {selected ? (
          <Card>
            <CardHeader
              title="Details du flux"
              action={<Badge tone={selected.status === 'pending' ? 'warning' : selected.status === 'completed' ? 'success' : 'danger'}>{selected.status === 'pending' ? 'En cours' : selected.status === 'completed' ? 'Complete' : 'Rejete'}</Badge>}
            />
            <CardBody className="space-y-4">
              <div className="border-b border-border pb-4">
                <p className="text-sm font-semibold text-ink">{selected.document_title || `Document #${selected.document}`}</p>
                <p className="mt-1 text-xs text-ink-muted">Initie par {selected.requested_by?.full_name}</p>
              </div>

              <ol className="space-y-4">
                {selected.steps.map((s) => (
                  <li key={s.id} className="flex gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        s.status === 'signed' ? 'bg-success-500 text-white'
                        : s.status === 'rejected' ? 'bg-danger-500 text-white'
                        : s.status === 'pending' && currentStepFor(selected)?.id === s.id ? 'border-2 border-primary-600 bg-primary-100 text-primary-700'
                        : 'bg-surface-hover text-ink-muted'
                      }`}
                    >
                      <Icon name={s.status === 'signed' ? 'check' : s.status === 'rejected' ? 'close' : 'edit_square'} className="text-[18px]" />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm font-medium text-ink">{s.signer?.full_name}</p>
                      {s.status === 'signed' && s.signed_at && (
                        <p className="text-xs text-ink-muted">Signe le {new Date(s.signed_at).toLocaleString('fr-FR')}</p>
                      )}
                      {s.status === 'rejected' && <p className="text-xs text-danger-600">Rejete{s.rejection_reason ? ` - ${s.rejection_reason}` : ''}</p>}
                      {s.status === 'pending' && currentStepFor(selected)?.id === s.id && (
                        <p className="text-xs font-medium text-primary-700">Necessite sa signature</p>
                      )}
                      {s.status === 'pending' && currentStepFor(selected)?.id !== s.id && (
                        <p className="text-xs text-ink-muted">En attente</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {isMyTurn(selected) && (
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button size="sm" onClick={() => signCurrent(selected)} disabled={busy} className="flex-1">
                    Signer maintenant
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => rejectCurrent(selected)} disabled={busy}>
                    Rejeter
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <p className="text-sm text-ink-muted">Selectionnez un document pour voir le detail du flux.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
