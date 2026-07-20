import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const CYCLE_LABELS = { primary: 'Primaire', secondary: 'Secondaire', '': 'Les deux cycles' }

const CREATABLE_ROLES = [
  { value: 'director', label: 'Directeur' },
  { value: 'censeur', label: 'Censeur' },
  { value: 'surveillant', label: 'Surveillant' },
  { value: 'secretary', label: 'Secrétaire' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'cashier', label: 'Caissier' },
  { value: 'hr', label: 'RH' },
  { value: 'canteen', label: 'Cantine' },
  { value: 'librarian', label: 'Bibliothécaire' },
  { value: 'auditor', label: 'Auditeur' },
]

/**
 * Founder assigns which cycle (Primaire/Secondaire) each Director/
 * Censeur oversees - see the 2026-07-17-cycle-scope-wiring CEO plan.
 * Only Director/Censeur accounts are shown (cycleScope is meaningless
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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createdAccount, setCreatedAccount] = useState(null)

  const scopableStaff = (staff.data || []).filter((s) => s.role === 'director' || s.role === 'censeur')

  const setCycle = async (userId, cycleScope) => {
    setBusyId(userId)
    setError(null)
    try {
      await api.patch(`/api/auth/users/${userId}/cycle-scope/`, { cycleScope })
      staff.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusyId(null)
    }
  }

  const handleAccountCreated = (account) => {
    setCreatedAccount(account)
    setShowCreateForm(false)
    staff.refetch()
  }

  const primaryStaff = scopableStaff.filter((s) => s.cycleScope === 'primary')
  const secondaryStaff = scopableStaff.filter((s) => s.cycleScope === 'secondary')
  const primaryCoverage = primaryStaff.length
  const secondaryCoverage = secondaryStaff.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cycles</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Attribuer un Directeur ou un Censeur a un cycle (Primaire/Secondaire) pour que ses
          approbations et demandes en attente ne concernent que ce cycle.
        </p>
      </div>

      {!staff.loading && scopableStaff.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <StatusChip
            ok={primaryCoverage > 0}
            okLabel="Primaire couvert"
            badLabel="Primaire non assigne"
          />
          <StatusChip
            ok={secondaryCoverage > 0}
            okLabel="Secondaire couvert"
            badLabel="Secondaire non assigne"
          />
        </div>
      )}

      {error && <p className="text-sm text-danger-600">{error}</p>}
      {staff.error && (
        <p className="text-sm text-danger-600">
          {staff.error instanceof ApiError ? staff.error.message : "Impossible de charger le registre du personnel."}
        </p>
      )}

      {createdAccount && (
        <div className="rounded-control border border-success-200 bg-success-50 p-4">
          <p className="text-sm font-medium text-success-700">
            Compte cree pour {createdAccount.fullName} ({createdAccount.email}).
          </p>
          {createdAccount.temporaryPassword ? (
            <p className="mt-1 text-sm text-success-700">
              Mot de passe temporaire : <span className="font-mono font-semibold">{createdAccount.temporaryPassword}</span>
              {' '}- a transmettre a la personne concernee ; elle pourra le changer depuis son profil.
            </p>
          ) : (
            <p className="mt-1 text-sm text-success-700">Ce compte existait deja et a ete rattache a cette ecole.</p>
          )}
          <button type="button" className="mt-2 text-xs font-semibold text-success-700 underline" onClick={() => setCreatedAccount(null)}>
            Fermer
          </button>
        </div>
      )}

      {!staff.loading && scopableStaff.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CycleCard title="Section Primaire" icon="child_care" staffList={primaryStaff} />
          <CycleCard title="Section Secondaire" icon="history_edu" staffList={secondaryStaff} />
        </div>
      )}

      <Card>
        <CardHeader
          title="Registre des affectations"
          subtitle="Directeurs et Censeurs"
          action={
            !showCreateForm && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-control bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                onClick={() => setShowCreateForm(true)}
              >
                <Icon name="add" className="text-[16px]" />
                Creer un compte
              </button>
            )
          }
        />
        {showCreateForm && (
          <CardBody className="border-b border-border">
            <CreateAccountForm onCancel={() => setShowCreateForm(false)} onCreated={handleAccountCreated} />
          </CardBody>
        )}
        <CardBody className="p-0">
          {staff.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!staff.loading && scopableStaff.length === 0 && (
            <div className="p-4">
              <EmptyState title="Aucun Directeur ou Censeur" description="Ce compte n'existe pas encore pour cette ecole." />
            </div>
          )}
          <ul className="divide-y divide-border">
            {scopableStaff.map((s) => {
              const overlapWarning = s.cycleScope && scopableStaff.some(
                (other) => other.id !== s.id && other.cycleScope === s.cycleScope
              )
              return (
                <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{s.fullName}</p>
                    <p className="text-xs text-ink-muted">{s.role === 'director' ? 'Directeur' : 'Censeur'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {overlapWarning && (
                      <Badge tone="warning">Deja couvert par un autre compte</Badge>
                    )}
                    <select
                      className={INPUT_CLASS}
                      value={s.cycleScope || ''}
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

function StatusChip({ ok, okLabel, badLabel }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-control border px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
        ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-warning-200 bg-warning-50 text-warning-700'
      }`}
    >
      <Icon name={ok ? 'check_circle' : 'warning'} filled className="text-[20px]" />
      {ok ? okLabel : badLabel}
    </div>
  )
}

function CycleCard({ title, icon, staffList }) {
  const director = staffList.find((s) => s.role === 'director')
  const censeur = staffList.find((s) => s.role === 'censeur')

  return (
    <Card>
      <CardBody className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-accent-50 text-accent-700">
            <Icon name={icon} className="text-[28px]" />
          </div>
          <h4 className="text-base font-semibold text-ink">{title}</h4>
        </div>
        <div className="space-y-2">
          <CycleRow label="Directeur" person={director} />
          <CycleRow label="Censeur" person={censeur} />
        </div>
      </CardBody>
    </Card>
  )
}

function CycleRow({ label, person }) {
  return (
    <div className="flex items-center justify-between rounded-control border border-border bg-surface p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{label}</p>
        <p className={`text-sm font-medium ${person ? 'text-ink' : 'italic text-ink-muted'}`}>
          {person ? person.fullName : 'Non assigne'}
        </p>
      </div>
      {!person && <Badge tone="warning">A affecter</Badge>}
    </div>
  )
}

function CreateAccountForm({ onCancel, onCreated }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'censeur' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      const account = await api.post('/api/auth/staff-accounts/', form)
      onCreated(account)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-ink-muted">Prenom</label>
          <input required className={INPUT_CLASS} value={form.firstName} onChange={update('firstName')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted">Nom</label>
          <input required className={INPUT_CLASS} value={form.lastName} onChange={update('lastName')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted">Email</label>
          <input required type="email" className={INPUT_CLASS} value={form.email} onChange={update('email')} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted">Role</label>
          <select className={INPUT_CLASS} value={form.role} onChange={update('role')}>
            {CREATABLE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>
      {formError && <p className="text-sm text-danger-600">{formError}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-control bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {submitting ? 'Creation...' : 'Creer le compte'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-ink-muted hover:text-ink">
          Annuler
        </button>
      </div>
    </form>
  )
}
