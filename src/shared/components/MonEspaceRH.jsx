import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const LEAVE_TYPES = [
  { value: 'paid', label: 'Conge paye' },
  { value: 'unpaid', label: 'Conge sans solde' },
  { value: 'sick', label: 'Conge maladie' },
]

const LEAVE_STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' }

/**
 * "Mon espace RH" - self-service view for the four staff-only roles
 * with no HR self-visibility before this (Teacher/Cashier/Canteen/
 * Librarian - see the 2026-07-16 ERP-gap CEO plan's "Employee self-
 * service" expansion). Reuses the existing /api/hr/payslips/ and
 * /api/hr/leave-requests/ endpoints, which now row-scope to the
 * caller's own StaffProfile server-side (see hr/api_views.py:
 * SELF_SERVICE_ONLY_ROLES) - this component never filters client-side,
 * the backend guarantees it never receives a colleague's data.
 */
export default function MonEspaceRH() {
  const { user } = useAuth()
  const payslips = useApiGet('/api/hr/payslips/')
  const leaveRequests = useApiGet('/api/hr/leave-requests/')
  const [form, setForm] = useState({ start_date: '', end_date: '', leave_type: 'paid', reason: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submitLeaveRequest = async (e) => {
    e.preventDefault()
    if (!user?.staff_id) {
      setError("Votre compte n'est pas encore lie a une fiche du personnel - contactez les RH.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/leave-requests/', { ...form, staff: user.staff_id })
      setForm({ start_date: '', end_date: '', leave_type: 'paid', reason: '' })
      leaveRequests.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mon espace RH</h1>
        <p className="mt-1 text-sm text-ink-muted">Vos bulletins de paie et vos demandes de conge.</p>
      </div>

      <Card>
        <CardHeader title="Demander un conge" />
        <CardBody>
          <form onSubmit={submitLeaveRequest} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required type="date" className={INPUT_CLASS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input required type="date" className={INPUT_CLASS} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <select className={INPUT_CLASS} value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input required className={INPUT_CLASS} placeholder="Motif" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>{submitting ? 'Envoi...' : 'Envoyer la demande'}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mes demandes de conge" />
        <CardBody className="p-0">
          {leaveRequests.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!leaveRequests.loading && leaveRequests.data?.length === 0 && (
            <div className="p-4"><EmptyState title="Aucune demande" /></div>
          )}
          <ul className="divide-y divide-border">
            {leaveRequests.data?.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-ink">{r.start_date} - {r.end_date}</p>
                  <p className="text-xs text-ink-muted">{r.reason}</p>
                </div>
                <Badge tone={LEAVE_STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mes bulletins de paie" />
        <CardBody className="p-0">
          {payslips.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!payslips.loading && payslips.data?.length === 0 && (
            <div className="p-4"><EmptyState title="Aucun bulletin disponible" /></div>
          )}
          <ul className="divide-y divide-border">
            {payslips.data?.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-ink">Bulletin du {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  <p className="text-xs text-ink-muted">{Number(p.gross_amount).toLocaleString()} FCFA brut</p>
                </div>
                <Badge tone={p.paid_at ? 'success' : 'neutral'}>{Number(p.net_amount).toLocaleString()} FCFA net</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
