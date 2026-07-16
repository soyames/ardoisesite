import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const CYCLE_LABELS = { primary: 'Primaire', secondary: 'Secondaire', '': 'Les deux cycles' }

/**
 * Founder assigns which cycle (Primaire/Secondaire) each Director/
 * Censeur oversees - see the 2026-07-17-cycle-scope-wiring CEO plan.
 * Only Director/Censeur accounts are shown (cycle_scope is meaningless
 * for every other role - the backend rejects any other target with a
 * 400, see UserCycleScopeUpdateView's own docstring). The coverage
 * guardrail below is a soft warning, never a hard block - a school
 * might genuinely want two Directors both covering "both cycles"
 * during a handover, for instance.
 */
export default function CyclesPanel() {
  const staff = useApiGet('/api/collab/staff-directory/')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const scopableStaff = (staff.data || []).filter((s) => s.role === 'director' || s.role === 'censeur')

  const setCycle = async (userId, cycle_scope) => {
    setBusyId(userId)
    setError(null)
    try {
      await api.patch(`/api/auth/users/${userId}/cycle-scope/`, { cycle_scope })
      staff.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusyId(null)
    }
  }

  const primaryCoverage = scopableStaff.filter((s) => s.cycle_scope === 'primary').length
  const secondaryCoverage = scopableStaff.filter((s) => s.cycle_scope === 'secondary').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cycles</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Attribuer un Directeur ou un Censeur a un cycle (Primaire/Secondaire) pour que ses
          approbations et demandes en attente ne concernent que ce cycle.
        </p>
      </div>

      {(primaryCoverage === 0 || secondaryCoverage === 0) && scopableStaff.length > 0 && (
        <Card>
          <CardBody className="bg-warning-50">
            <p className="text-sm text-warning-700">
              {primaryCoverage === 0 && 'Aucun Directeur/Censeur n’est actuellement assigne au Primaire. '}
              {secondaryCoverage === 0 && 'Aucun Directeur/Censeur n’est actuellement assigne au Secondaire. '}
              Tant qu’aucun compte n’est assigne, ce cycle reste visible uniquement par le Fondateur.
            </p>
          </CardBody>
        </Card>
      )}

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <Card>
        <CardHeader title="Directeurs & Censeurs" />
        <CardBody className="p-0">
          {staff.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!staff.loading && scopableStaff.length === 0 && (
            <div className="p-4"><EmptyState title="Aucun Directeur ou Censeur" description="Ce compte n'existe pas encore pour cette ecole." /></div>
          )}
          <ul className="divide-y divide-border">
            {scopableStaff.map((s) => {
              const overlapWarning = s.cycle_scope && scopableStaff.some(
                (other) => other.id !== s.id && other.cycle_scope === s.cycle_scope
              )
              return (
                <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.full_name}</p>
                    <p className="text-xs text-ink-muted">{s.role === 'director' ? 'Directeur' : 'Censeur'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {overlapWarning && (
                      <Badge tone="warning">Deja couvert par un autre compte</Badge>
                    )}
                    <select
                      className={INPUT_CLASS}
                      value={s.cycle_scope || ''}
                      disabled={busyId === s.id}
                      onChange={(e) => setCycle(s.id, e.target.value)}
                    >
                      {Object.entries(CYCLE_LABELS).map(([value, label]) => (
                        <option key={value || 'both'} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
