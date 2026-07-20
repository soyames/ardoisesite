import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const DEVICE_LABEL = { desktop: 'Ordinateur', mobile: 'Mobile', tablet: 'Tablette', unknown: 'Appareil inconnu' }

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "a l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

/**
 * "Who's logged in, from where" - see ardoise/apps/core/models.py:
 * UserSession's own docstring for exactly what is and isn't captured
 * here (IP + a User-Agent-derived device/browser/OS summary; no MAC
 * address - browsers don't expose that to any web app, this one
 * included).
 */
export default function SessionsTab() {
  const sessions = useApiGet('/api/auth/sessions/')
  const [revokingId, setRevokingId] = useState(null)
  const [error, setError] = useState(null)

  const revoke = async (id) => {
    setRevokingId(id)
    setError(null)
    try {
      await api.delete(`/api/auth/sessions/${id}/`)
      sessions.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setRevokingId(null)
    }
  }

  if (sessions.loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (sessions.error) return <div className="text-danger-600">Erreur de chargement des sessions : {sessions.error.message || String(sessions.error)}</div>

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">
        Chaque appareil ou navigateur connecte a votre compte sur cet etablissement.
      </p>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      {sessions.data?.length === 0 && (
        <EmptyState title="Aucune session active" description="Reconnectez-vous pour en voir apparaitre une ici." />
      )}

      <div className="space-y-2">
        {sessions.data?.map((s) => (
          <Card key={s.id}>
            <CardBody className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">
                    {DEVICE_LABEL[s.device_type] || 'Appareil'}
                    {s.browser && ` - ${s.browser}`}
                    {s.operating_system && ` (${s.operating_system})`}
                  </p>
                  {s.is_current && <Badge tone="success">Session actuelle</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {s.ip_address || 'IP inconnue'} - active {timeAgo(s.last_seen_at)}
                </p>
              </div>
              {!s.is_current && (
                <Button
                  size="sm" variant="danger"
                  onClick={() => revoke(s.id)}
                  disabled={revokingId === s.id}
                >
                  {revokingId === s.id ? 'Revocation...' : 'Revoquer'}
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
