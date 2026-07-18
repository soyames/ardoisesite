import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const FUNCTIONS = [
  ['teacher', 'Enseignant(e)'], ['secretary', 'Secretaire'], ['cashier', 'Caissier(ere)'],
  ['censeur', 'Censeur'], ['surveillant', 'Surveillant general'], ['comptable', 'Comptable'],
  ['director', 'Directeur'], ['founder', 'Fondateur'], ['hr', 'Responsable RH / Paie'],
  ['auditor', 'Auditeur'], ['canteen', 'Personnel cantine'], ['librarian', 'Bibliothecaire'],
  ['support', "Personnel d'appui"],
]

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'staff', label: 'Personnel' },
  { key: 'contracts', label: 'Contrats' },
  { key: 'payroll', label: 'Paie' },
  { key: 'advances', label: 'Avances' },
  { key: 'leave', label: 'Conges' },
  { key: 'assets', label: 'Materiel IT' },
]

export default function HrPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Ressources humaines</h1>
        <p className="mt-1 text-sm text-ink-muted">Personnel, contrats, paie, avances, conges, materiel.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'contracts' && <ContractsTab />}
      {tab === 'payroll' && <PayrollTab />}
      {tab === 'advances' && <AdvancesTab />}
      {tab === 'leave' && <LeaveTab />}
      {tab === 'assets' && <AssetsTab />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const staff = useApiGet('/api/hr/staff/')
  const advances = useApiGet('/api/hr/salary-advances/')
  const leaves = useApiGet('/api/hr/leave-requests/')
  const runs = useApiGet('/api/hr/payroll-runs/')

  const loading = staff.loading || advances.loading || leaves.loading || runs.loading

  const activeStaff = (staff.data || []).filter((s) => s.is_active)
  const pendingAdvances = (advances.data || []).filter((a) => a.status === 'pending')
  const pendingLeaves = (leaves.data || []).filter((l) => l.status === 'pending')
  const draftRuns = (runs.data || []).filter((r) => r.status === 'draft')

  const requestItems = [
    ...pendingAdvances.slice(0, 4).map((a) => ({
      id: `adv-${a.id}`, icon: 'payments', iconTone: 'warning',
      title: `${a.staff_name} - Avance`, subtitle: 'Avance sur salaire',
      badge: `${a.amount} FCFA`, badgeTone: 'warning',
    })),
    ...pendingLeaves.slice(0, 4).map((l) => ({
      id: `leave-${l.id}`, icon: 'event_busy', iconTone: 'warning',
      title: `${l.staff_name} - Conge`, subtitle: `${l.start_date} au ${l.end_date}`,
      badge: 'En attente', badgeTone: 'warning',
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">RH &amp; Paie</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble du personnel et de la paie.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickActionButton icon="person_add" title="Ajouter un membre" description="Nouveau personnel" onClick={() => onNavigate('staff')} />
        <QuickActionButton icon="payments" title="Cycles de paie" description={`${draftRuns.length} en brouillon`} onClick={() => onNavigate('payroll')} />
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="badge" label="Personnel actif" value={activeStaff.length} />
            <StatCard icon="account_balance_wallet" label="Avances en attente" value={pendingAdvances.length} tone={pendingAdvances.length > 0 ? 'warning' : 'success'} />
            <StatCard icon="event_busy" label="Conges en attente" value={pendingLeaves.length} tone={pendingLeaves.length > 0 ? 'warning' : 'success'} />
            <StatCard icon="contract" label="Cycles de paie en brouillon" value={draftRuns.length} tone={draftRuns.length > 0 ? 'warning' : 'success'} />
          </div>

          <Card>
            <CardHeader title="Demandes en attente" action={<button onClick={() => onNavigate('advances')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir les avances</button>} />
            <ActivityList items={requestItems} emptyLabel="Aucune demande en attente." />
          </Card>
        </>
      )}
    </div>
  )
}

function StaffTab() {
  const staff = useApiGet('/api/hr/staff/')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', function: 'teacher', bank_or_momo_account: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/staff/', form)
      setForm({ first_name: '', last_name: '', phone: '', function: 'teacher', bank_or_momo_account: '' })
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
              <input required className={INPUT_CLASS} placeholder="Prenom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Telephone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className={INPUT_CLASS} value={form.function} onChange={(e) => setForm({ ...form, function: e.target.value })}>
                {FUNCTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Compte bancaire / Mobile Money" value={form.bank_or_momo_account} onChange={(e) => setForm({ ...form, bank_or_momo_account: e.target.value })} />
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
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{s.last_name} {s.first_name}</p>
                  <p className="text-xs text-ink-muted">{FUNCTIONS.find(([v]) => v === s.function)?.[1] || s.function} - {s.phone}</p>
                </div>
                <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Actif' : 'Inactif'}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function ContractsTab() {
  const staff = useApiGet('/api/hr/staff/')
  const [form, setForm] = useState({ staff: '', contract_type: 'permanent', start_date: '', end_date: '', fixed_monthly_salary: '' })
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
        staff: Number(form.staff), contract_type: form.contract_type, start_date: form.start_date,
        end_date: form.end_date || null, fixed_monthly_salary: form.contract_type === 'permanent' ? form.fixed_monthly_salary : null,
        is_active: true,
      })
      setSuccess(true)
      setForm({ staff: '', contract_type: 'permanent', start_date: '', end_date: '', fixed_monthly_salary: '' })
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
            {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
          </select>
          <select className={INPUT_CLASS} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
            <option value="permanent">Permanent</option>
            <option value="vacataire">Vacataire</option>
          </select>
          {form.contract_type === 'permanent' && (
            <input type="number" step="0.01" className={INPUT_CLASS} placeholder="Salaire mensuel fixe (FCFA)" value={form.fixed_monthly_salary} onChange={(e) => setForm({ ...form, fixed_monthly_salary: e.target.value })} />
          )}
          <input required type="date" className={INPUT_CLASS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <input type="date" className={INPUT_CLASS} placeholder="Date de fin (optionnel)" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
          {success && <p className="text-sm text-success-600 sm:col-span-2">Contrat cree avec succes.</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Creer le contrat'}</Button></div>
        </form>
      </CardBody>
    </Card>
  )
}

function PayrollTab() {
  const runs = useApiGet('/api/hr/payroll-runs/')
  const payslips = useApiGet('/api/hr/payslips/')
  const [form, setForm] = useState({ period_start: '', period_end: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/payroll-runs/', form)
      setForm({ period_start: '', period_end: '' })
      runs.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_TONE = { draft: 'neutral', validated: 'success' }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Nouveau cycle de paie" subtitle="Cree en brouillon - le Comptable/Directeur/Fondateur doit le valider pour generer les bulletins." />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required type="date" className={INPUT_CLASS} placeholder="Debut de periode" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            <input required type="date" className={INPUT_CLASS} placeholder="Fin de periode" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Creation...' : 'Creer le cycle'}</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Cycles de paie" />
        <CardBody className="p-0">
          {runs.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!runs.loading && runs.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun cycle de paie" /></div>}
          <ul className="divide-y divide-border">
            {runs.data?.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-4">
                <p className="text-sm text-ink">{r.period_start} au {r.period_end}</p>
                <Badge tone={STATUS_TONE[r.status] || 'neutral'}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Bulletins de paie generes" />
        <CardBody className="p-0">
          {payslips.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!payslips.loading && payslips.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun bulletin genere" description="Genere automatiquement quand un cycle est valide." /></div>}
          <ul className="divide-y divide-border">
            {payslips.data?.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{p.staff_name}</p>
                  <p className="text-xs text-ink-muted">Brut {p.gross_amount} FCFA - Net {p.net_amount} FCFA</p>
                </div>
                <Badge tone={p.paid_at ? 'success' : 'warning'}>{p.paid_at ? 'Paye' : 'En attente'}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function AdvancesTab() {
  const staff = useApiGet('/api/hr/staff/')
  const advances = useApiGet('/api/hr/salary-advances/')
  const [form, setForm] = useState({ staff: '', amount: '', reason: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/salary-advances/', { staff: Number(form.staff), amount: form.amount, reason: form.reason })
      setForm({ staff: '', amount: '', reason: '' })
      advances.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger', deducted: 'neutral' }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Nouvelle demande d'avance" />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select required className={INPUT_CLASS} value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })}>
              <option value="">Choisir...</option>
              {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
            </select>
            <input required type="number" step="0.01" className={INPUT_CLASS} placeholder="Montant (FCFA)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <textarea required className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Motif" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Soumettre'}</Button></div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="p-0">
          {advances.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!advances.loading && advances.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune avance" /></div>}
          <ul className="divide-y divide-border">
            {advances.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{a.staff_name} - {a.amount} FCFA</p>
                  <p className="text-xs text-ink-muted">{a.reason}</p>
                </div>
                <Badge tone={STATUS_TONE[a.status] || 'neutral'}>{a.status}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function LeaveTab() {
  const staff = useApiGet('/api/hr/staff/')
  const leaves = useApiGet('/api/hr/leave-requests/')
  const [form, setForm] = useState({ staff: '', start_date: '', end_date: '', leave_type: 'paid', reason: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/leave-requests/', form)
      setForm({ staff: '', start_date: '', end_date: '', leave_type: 'paid', reason: '' })
      leaves.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Nouvelle demande de conge" />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select required className={INPUT_CLASS} value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })}>
              <option value="">Choisir...</option>
              {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
            </select>
            <select className={INPUT_CLASS} value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              <option value="paid">Conge paye</option>
              <option value="unpaid">Conge sans solde</option>
              <option value="sick">Conge maladie</option>
            </select>
            <input required type="date" className={INPUT_CLASS} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <input required type="date" className={INPUT_CLASS} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            <textarea required className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Motif" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Soumettre'}</Button></div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="p-0">
          {leaves.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!leaves.loading && leaves.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune demande de conge" /></div>}
          <ul className="divide-y divide-border">
            {leaves.data?.map((l) => (
              <li key={l.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{l.staff_name}</p>
                  <p className="text-xs text-ink-muted">{l.start_date} au {l.end_date} - {l.leave_type}</p>
                </div>
                <Badge tone={STATUS_TONE[l.status] || 'neutral'}>{l.status}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function AssetsTab() {
  const staff = useApiGet('/api/hr/staff/')
  const assets = useApiGet('/api/auth/it-assets/')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', asset_tag: '', serial_number: '', condition: 'good', assigned_to: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/auth/it-assets/', { ...form, assigned_to: form.assigned_to || null })
      setForm({ name: '', asset_tag: '', serial_number: '', condition: 'good', assigned_to: '' })
      setShowForm(false)
      assets.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const CONDITION_TONE = { new: 'success', good: 'success', fair: 'warning', poor: 'danger', broken: 'danger' }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouveau materiel'}</Button>
      </div>
      {showForm && (
        <Card>
          <CardHeader title="Nouveau materiel informatique" />
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required className={INPUT_CLASS} placeholder="Nom (ex: Lenovo ThinkPad T14)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required className={INPUT_CLASS} placeholder="Numero d'inventaire" value={form.asset_tag} onChange={(e) => setForm({ ...form, asset_tag: e.target.value })} />
              <input className={INPUT_CLASS} placeholder="Numero de serie" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
              <select className={INPUT_CLASS} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option value="new">Neuf</option>
                <option value="good">Bon etat</option>
                <option value="fair">Etat moyen</option>
                <option value="poor">Mauvais etat</option>
                <option value="broken">Defectueux</option>
              </select>
              <select className={`sm:col-span-2 ${INPUT_CLASS}`} value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Non assigne</option>
                {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>)}
              </select>
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardBody className="p-0">
          {assets.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!assets.loading && assets.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun materiel enregistre" /></div>}
          <ul className="divide-y divide-border">
            {assets.data?.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{a.name}</p>
                  <p className="text-xs text-ink-muted">{a.asset_tag}</p>
                </div>
                <Badge tone={CONDITION_TONE[a.condition] || 'neutral'}>{a.condition}</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
