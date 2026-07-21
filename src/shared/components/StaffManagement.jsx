import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Badge from '../ui/Badge.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

export const FUNCTIONS = [
  ['teacher', 'Enseignant(e)'], ['secretary', 'Secretaire'], ['cashier', 'Caissier(ere)'],
  ['censeur', 'Censeur'], ['surveillant', 'Surveillant general'], ['comptable', 'Comptable'],
  ['director', 'Directeur'], ['founder', 'Fondateur'], ['hr', 'Responsable RH / Paie'],
  ['auditor', 'Auditeur'], ['canteen', 'Personnel cantine'], ['librarian', 'Bibliothecaire'],
  ['support', "Personnel d'appui"],
]

/**
 * StaffTab and ContractsTab - originally HrPortal.jsx-only, extracted
 * here so Comptable can reuse them without duplicating the code.
 * Comptable cumulates the HR function at this school (see
 * core/permissions.py's Role.COMPTABLE grant, which now mirrors
 * Role.HR's staffprofile/contract permissions) - a Comptable who
 * couldn't see or add staff couldn't actually do that half of the job.
 */
export function StaffTab() {
  const staff = useApiGet('/api/hr/staff/')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', function: 'teacher', bankOrMomoAccount: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/staff/', form)
      setForm({ firstName: '', lastName: '', phone: '', function: 'teacher', bankOrMomoAccount: '' })
      setShowForm(false)
      staff.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouveau membre'}</Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader title="Nouveau membre du personnel" />
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required className={INPUT_CLASS} placeholder="Prenom" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Nom" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Telephone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className={INPUT_CLASS} value={form.function} onChange={(e) => setForm({ ...form, function: e.target.value })}>
                {FUNCTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Compte bancaire / Mobile Money" value={form.bankOrMomoAccount} onChange={(e) => setForm({ ...form, bankOrMomoAccount: e.target.value })} />
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardBody className="p-0">
          {staff.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!staff.loading && staff.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun membre du personnel" /></div>}
          <ul className="divide-y divide-border">
            {staff.data?.map((s) => (
              <StaffRow key={s.id} member={s} onUpdated={staff.refetch} />
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

// A recruitment accept (MarketplaceApplicationAcceptView) creates a
// StaffProfile with only name/function filled in - phone, IFU, and
// bank/momo account are deliberately left blank for whoever completes
// the hire's HR record afterward (Comptable, at this school). Missing
// those fields is the normal, expected state right after a hire, not
// broken data - the "A completer" badge below flags it without
// implying something went wrong.
function StaffRow({ member, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const incomplete = !member.phone || !member.bankOrMomoAccount

  return (
    <li className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{member.lastName} {member.firstName}</p>
          <p className="text-xs text-ink-muted">
            {FUNCTIONS.find(([v]) => v === member.function)?.[1] || member.function}
            {member.phone ? ` - ${member.phone}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {incomplete && <Badge tone="warning">A completer</Badge>}
          <Badge tone={member.isActive ? 'success' : 'neutral'}>{member.isActive ? 'Actif' : 'Inactif'}</Badge>
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            {editing ? 'Fermer' : 'Modifier'}
          </button>
        </div>
      </div>
      {editing && <StaffEditForm member={member} onSaved={() => { setEditing(false); onUpdated() }} />}
    </li>
  )
}

function StaffEditForm({ member, onSaved }) {
  const [form, setForm] = useState({
    phone: member.phone || '',
    ifu: member.ifu || '',
    bankOrMomoAccount: member.bankOrMomoAccount || '',
    function: member.function,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.patch(`/api/hr/staff/${member.id}/`, form)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <input className={INPUT_CLASS} placeholder="Telephone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input className={INPUT_CLASS} placeholder="IFU" value={form.ifu} onChange={(e) => setForm({ ...form, ifu: e.target.value })} />
      <select className={INPUT_CLASS} value={form.function} onChange={(e) => setForm({ ...form, function: e.target.value })}>
        {FUNCTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input className={INPUT_CLASS} placeholder="Compte bancaire / Mobile Money" value={form.bankOrMomoAccount} onChange={(e) => setForm({ ...form, bankOrMomoAccount: e.target.value })} />
      {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2"><Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
    </form>
  )
}

export function ContractsTab() {
  const staff = useApiGet('/api/hr/staff/')
  const [form, setForm] = useState({ staff: '', contractType: 'permanent', startDate: '', endDate: '', fixedMonthlySalary: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      await api.post('/api/hr/contracts/', {
        staff: Number(form.staff), contractType: form.contractType, startDate: form.startDate,
        endDate: form.endDate || null, fixedMonthlySalary: form.contractType === 'permanent' ? form.fixedMonthlySalary : null,
        isActive: true,
      })
      setSuccess(true)
      setForm({ staff: '', contractType: 'permanent', startDate: '', endDate: '', fixedMonthlySalary: '' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Nouveau contrat" subtitle="Permanent (salaire fixe) ou Vacataire (paye par heure enseignee)." />
      <CardBody>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select required className={`sm:col-span-2 ${INPUT_CLASS}`} value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })}>
            <option value="">Choisir le membre du personnel...</option>
            {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
          </select>
          <select className={INPUT_CLASS} value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
            <option value="permanent">Permanent</option>
            <option value="vacataire">Vacataire</option>
          </select>
          {form.contractType === 'permanent' && (
            <input type="number" step="0.01" className={INPUT_CLASS} placeholder="Salaire mensuel fixe (FCFA)" value={form.fixedMonthlySalary} onChange={(e) => setForm({ ...form, fixedMonthlySalary: e.target.value })} />
          )}
          <input required type="date" className={INPUT_CLASS} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input type="date" className={INPUT_CLASS} placeholder="Date de fin (optionnel)" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
          {success && <p className="text-sm text-success-600 sm:col-span-2">Contrat cree avec succes.</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Creer le contrat'}</Button></div>
        </form>
      </CardBody>
    </Card>
  )
}
