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
import { FUNCTIONS, StaffTab, ContractsTab } from '../../shared/components/StaffManagement.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

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

  const activeStaff = (staff.data || []).filter((s) => s.isActive)
  const pendingAdvances = (advances.data || []).filter((a) => a.status === 'pending')
  const pendingLeaves = (leaves.data || []).filter((l) => l.status === 'pending')
  const draftRuns = (runs.data || []).filter((r) => r.status === 'draft')

  const requestItems = [
    ...pendingAdvances.slice(0, 4).map((a) => ({
      id: `adv-${a.id}`, icon: 'payments', iconTone: 'warning',
      title: `${a.staffName} - Avance`, subtitle: 'Avance sur salaire',
      badge: `${a.amount} FCFA`, badgeTone: 'warning',
    })),
    ...pendingLeaves.slice(0, 4).map((l) => ({
      id: `leave-${l.id}`, icon: 'event_busy', iconTone: 'warning',
      title: `${l.staffName} - Conge`, subtitle: `${l.startDate} au ${l.endDate}`,
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

function PayrollTab() {
  const runs = useApiGet('/api/hr/payroll-runs/')
  const payslips = useApiGet('/api/hr/payslips/')
  const [form, setForm] = useState({ periodStart: '', periodEnd: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/payroll-runs/', form)
      setForm({ periodStart: '', periodEnd: '' })
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
            <input required type="date" className={INPUT_CLASS} placeholder="Debut de periode" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
            <input required type="date" className={INPUT_CLASS} placeholder="Fin de periode" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
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
                <p className="text-sm text-ink">{r.periodStart} au {r.periodEnd}</p>
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
                  <p className="text-sm font-medium text-ink">{p.staffName}</p>
                  <p className="text-xs text-ink-muted">Brut {p.grossAmount} FCFA - Net {p.netAmount} FCFA</p>
                </div>
                <Badge tone={p.paidAt ? 'success' : 'warning'}>{p.paidAt ? 'Paye' : 'En attente'}</Badge>
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
              {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
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
                  <p className="text-sm font-medium text-ink">{a.staffName} - {a.amount} FCFA</p>
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
  const [form, setForm] = useState({ staff: '', startDate: '', endDate: '', leaveType: 'paid', reason: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/hr/leave-requests/', form)
      setForm({ staff: '', startDate: '', endDate: '', leaveType: 'paid', reason: '' })
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
              {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
            </select>
            <select className={INPUT_CLASS} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              <option value="paid">Conge paye</option>
              <option value="unpaid">Conge sans solde</option>
              <option value="sick">Conge maladie</option>
            </select>
            <input required type="date" className={INPUT_CLASS} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input required type="date" className={INPUT_CLASS} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
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
                  <p className="text-sm font-medium text-ink">{l.staffName}</p>
                  <p className="text-xs text-ink-muted">{l.startDate} au {l.endDate} - {l.leaveType}</p>
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
  const [form, setForm] = useState({ name: '', assetTag: '', serialNumber: '', condition: 'good', assignedTo: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/auth/it-assets/', { ...form, assignedTo: form.assignedTo || null })
      setForm({ name: '', assetTag: '', serialNumber: '', condition: 'good', assignedTo: '' })
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
              <input required className={INPUT_CLASS} placeholder="Numero d'inventaire" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} />
              <input className={INPUT_CLASS} placeholder="Numero de serie" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
              <select className={INPUT_CLASS} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <option value="new">Neuf</option>
                <option value="good">Bon etat</option>
                <option value="fair">Etat moyen</option>
                <option value="poor">Mauvais etat</option>
                <option value="broken">Defectueux</option>
              </select>
              <select className={`sm:col-span-2 ${INPUT_CLASS}`} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Non assigne</option>
                {staff.data?.map((s) => <option key={s.id} value={s.id}>{s.lastName} {s.firstName}</option>)}
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
                  <p className="text-xs text-ink-muted">{a.assetTag}</p>
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
