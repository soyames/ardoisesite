import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { toLocalDateString } from '../../shared/utils/date.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import Encaissement from '../../shared/components/Encaissement.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'encaissement', label: 'Encaissement' },
  { key: 'reports', label: 'Rapports' },
  { key: 'batch-invoices', label: 'Facturation groupee' },
  { key: 'expenses', label: 'Depenses & Budgets' },
  { key: 'payroll', label: 'Validation paie' },
  { key: 'advances', label: 'Avances' },
  { key: 'leave', label: 'Conges (sans solde)' },
  { key: 'vendors', label: 'Fournisseurs' },
]

export default function ComptablePortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Comptabilite</h1>
        <p className="mt-1 text-sm text-ink-muted">Grand livre, validation de paie, approbations financieres.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'encaissement' && <Encaissement />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'batch-invoices' && <BatchInvoicesTab />}
      {tab === 'expenses' && <ExpensesTab />}
      {tab === 'payroll' && <PayrollValidationTab />}
      {tab === 'advances' && <AdvancesApprovalTab />}
      {tab === 'leave' && <LeaveApprovalTab />}
      {tab === 'vendors' && <VendorsTab />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const today = toLocalDateString()
  const monthStart = today.slice(0, 8) + '01'
  const incomeStatement = useApiGet(`/api/finance/reports/income-statement/?start=${monthStart}&end=${today}`)
  const pendingExpenses = useApiGet('/api/finance/expense-requests/?status=pending')
  const budgets = useApiGet('/api/finance/budgets/')
  const payrollPending = useApiGet('/api/hr/payroll-runs/pending-validation/')
  const leavePending = useApiGet('/api/hr/leave-requests/pending-approval/')

  const loading = incomeStatement.loading || pendingExpenses.loading || budgets.loading || payrollPending.loading || leavePending.loading
  const pendingAmount = (pendingExpenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0)

  const approvalItems = (pendingExpenses.data || []).slice(0, 6).map((e) => ({
    id: e.id,
    icon: 'receipt_long',
    iconTone: 'accent',
    title: e.description,
    subtitle: `${e.budget_department} - ${e.requested_by_name}`,
    badge: `${Number(e.amount).toLocaleString()} F`,
    badgeTone: 'neutral',
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Comptabilite &amp; RH</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Voici l'etat financier de l'ecole aujourd'hui.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickActionButton icon="point_of_sale" title="Encaisser" description="Rechercher un eleve" onClick={() => onNavigate('encaissement')} />
        <QuickActionButton icon="receipt_long" title="Generer des factures" description="Facturation groupee par tranche" onClick={() => onNavigate('batch-invoices')} />
        <QuickActionButton icon="payments" title="Traiter la paie" description="Valider les cycles en attente" onClick={() => onNavigate('payroll')} />
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="account_balance" label="Resultat net (mois)" value={`${Number(incomeStatement.data?.net_income || 0).toLocaleString()} F`} />
            <StatCard
              icon="request_quote"
              label="Depenses en attente"
              value={pendingExpenses.data?.length || 0}
              hint={`${pendingAmount.toLocaleString()} FCFA`}
              badge={pendingExpenses.data?.length > 0 ? 'A traiter' : undefined}
              tone={pendingExpenses.data?.length > 0 ? 'warning' : 'success'}
              linkLabel="Voir les depenses"
              onLinkClick={() => onNavigate('expenses')}
            />
            <StatCard icon="badge" label="Cycles de paie a valider" value={payrollPending.data?.length || 0} tone={payrollPending.data?.length > 0 ? 'warning' : 'success'} />
            <StatCard icon="event_busy" label="Conges en attente" value={leavePending.data?.length || 0} tone={leavePending.data?.length > 0 ? 'warning' : 'success'} />
          </div>

          {budgets.data?.length > 0 && (
            <Card>
              <CardHeader title="Utilisation des budgets" action={<button onClick={() => onNavigate('expenses')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir tout</button>} />
              <CardBody className="space-y-3">
                {budgets.data.map((b) => (
                  <div key={b.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink">{b.department}</span>
                      <span className="text-ink-muted">{b.utilization_pct}% utilise</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                      <div
                        className={`h-full rounded-full ${Number(b.utilization_pct) >= 90 ? 'bg-danger-500' : 'bg-primary-700'}`}
                        style={{ width: `${Math.min(100, Number(b.utilization_pct))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      Depense: {Number(b.spent_amount).toLocaleString()} F - Total: {Number(b.allocated_amount).toLocaleString()} F
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Approbations en attente" action={<button onClick={() => onNavigate('expenses')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir tout</button>} />
            <ActivityList items={approvalItems} emptyLabel="Aucune depense en attente." />
          </Card>
        </>
      )}
    </div>
  )
}

function BatchInvoicesTab() {
  const feeStructures = useApiGet('/api/finance/fee-structures/')
  const [feeStructureId, setFeeStructureId] = useState('')
  const [trancheId, setTrancheId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedFeeStructure = feeStructures.data?.find((fs) => String(fs.id) === feeStructureId)
  const tranches = selectedFeeStructure?.tranches || []

  const run = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.post('/api/finance/invoices/batch-generate/', { tranche: Number(trancheId) })
      setResult(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Generer les factures manquantes"
          subtitle="Cree une facture pour chaque eleve inscrit qui n'en a pas encore pour cette tranche - sans risque de doublon si vous relancez."
        />
        <CardBody>
          <form onSubmit={run} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              required className={INPUT_CLASS} value={feeStructureId}
              onChange={(e) => { setFeeStructureId(e.target.value); setTrancheId('') }}
            >
              <option value="">Choisir une structure de frais...</option>
              {feeStructures.data?.map((fs) => (
                <option key={fs.id} value={fs.id}>{fs.label} ({fs.level_display})</option>
              ))}
            </select>
            <select required className={INPUT_CLASS} value={trancheId} onChange={(e) => setTrancheId(e.target.value)} disabled={!feeStructureId}>
              <option value="">Choisir une tranche...</option>
              {tranches.map((t) => (
                <option key={t.id} value={t.id}>{t.label} - {t.amount} FCFA (echeance {t.due_date})</option>
              ))}
            </select>
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting || !trancheId}>
                {submitting ? 'Generation...' : 'Generer les factures manquantes'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader title="Resultat" />
          <CardBody className="flex flex-wrap gap-3">
            <Badge tone="success">{result.created} facture(s) creee(s)</Badge>
            <Badge tone="neutral">{result.skipped} deja facturee(s)</Badge>
            {result.failed > 0 && <Badge tone="danger">{result.failed} echec(s)</Badge>}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function ExpensesTab() {
  const budgets = useApiGet('/api/finance/budgets/')
  const expenses = useApiGet('/api/finance/expense-requests/')
  const vendors = useApiGet('/api/finance/vendors/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ budget: '', vendor: '', description: '', amount: '' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/finance/expense-requests/', {
        budget: Number(form.budget), vendor: form.vendor ? Number(form.vendor) : null,
        description: form.description, amount: form.amount,
      })
      setForm({ budget: '', vendor: '', description: '', amount: '' })
      setShowForm(false)
      expenses.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const act = async (id, action) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/finance/expense-requests/${id}/${action}/`, {})
      expenses.refetch()
      budgets.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  const STATUS_TONE = { pending: 'neutral', approved: 'success', rejected: 'danger', paid: 'success' }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(budgets.data || []).map((b) => (
          <Card key={b.id}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{b.department}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{b.utilization_pct}%</p>
              <p className="text-xs text-ink-muted">{Number(b.spent_amount).toLocaleString()} / {Number(b.allocated_amount).toLocaleString()} F</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouvelle demande'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Nouvelle demande de depense" />
          <CardBody>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select required className={INPUT_CLASS} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}>
                <option value="">Choisir un budget...</option>
                {budgets.data?.map((b) => <option key={b.id} value={b.id}>{b.department}</option>)}
              </select>
              <select className={INPUT_CLASS} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
                <option value="">Fournisseur (optionnel)</option>
                {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <input required className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input required type="number" step="0.01" className={INPUT_CLASS} placeholder="Montant (FCFA)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Soumettre'}</Button></div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Demandes de depense" />
        <CardBody className="p-0">
          {expenses.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!expenses.loading && expenses.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune demande" /></div>}
          <ul className="divide-y divide-border">
            {expenses.data?.map((e) => {
              const budget = budgets.data?.find((b) => b.id === e.budget)
              const remainingAfter = budget ? Number(budget.allocated_amount) - Number(budget.spent_amount) - Number(e.amount) : null
              return (
                <li key={e.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{e.description}</p>
                      <p className="text-xs text-ink-muted">{e.budget_department} - {e.requested_by_name} - {Number(e.amount).toLocaleString()} F</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                      {e.status === 'pending' && (
                        <>
                          <Button size="sm" variant="danger" onClick={() => act(e.id, 'reject')} disabled={busy === e.id}>Rejeter</Button>
                          <Button size="sm" onClick={() => act(e.id, 'approve')} disabled={busy === e.id}>Approuver</Button>
                        </>
                      )}
                      {e.status === 'approved' && e.vendor && (
                        <Button size="sm" onClick={() => act(e.id, 'pay')} disabled={busy === e.id}>Payer</Button>
                      )}
                    </div>
                  </div>
                  {e.status === 'pending' && budget && (
                    <p className={`mt-2 text-xs ${remainingAfter < 0 ? 'text-danger-600' : 'text-ink-muted'}`}>
                      Impact budgetaire : {remainingAfter < 0 ? 'depasse le budget' : `${remainingAfter.toLocaleString()} F restant apres approbation`}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function ReportsTab() {
  const today = toLocalDateString()
  const monthStart = today.slice(0, 8) + '01'
  const trialBalance = useApiGet(`/api/finance/reports/trial-balance/?as_of=${today}`)
  const incomeStatement = useApiGet(`/api/finance/reports/income-statement/?start=${monthStart}&end=${today}`)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Revenus (mois)" value={incomeStatement.data ? `${Number(incomeStatement.data.total_revenue).toLocaleString()} F` : '-'} />
        <StatCard label="Depenses (mois)" value={incomeStatement.data ? `${Number(incomeStatement.data.total_expense).toLocaleString()} F` : '-'} />
        <StatCard label="Resultat net" value={incomeStatement.data ? `${Number(incomeStatement.data.net_income).toLocaleString()} F` : '-'} />
        <StatCard label="Total debit (balance)" value={trialBalance.data ? `${Number(trialBalance.data.total_debit).toLocaleString()} F` : '-'} />
      </div>

      <Card>
        <CardHeader title="Balance generale" subtitle={`Au ${today}`} />
        <CardBody className="overflow-x-auto p-0">
          {trialBalance.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!trialBalance.loading && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted">
                  <th className="p-3">Compte</th><th className="p-3">Debit</th><th className="p-3">Credit</th><th className="p-3">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {trialBalance.data?.rows.map((r) => (
                  <tr key={r.account_code}>
                    <td className="p-3 text-ink">{r.account_code} - {r.account_name}</td>
                    <td className="p-3 text-ink-muted">{Number(r.debit_total).toLocaleString()}</td>
                    <td className="p-3 text-ink-muted">{Number(r.credit_total).toLocaleString()}</td>
                    <td className="p-3 text-ink">{Number(r.balance).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function PayrollValidationTab() {
  const pending = useApiGet('/api/hr/payroll-runs/pending-validation/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const validate = async (id) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/hr/payroll-runs/${id}/validate/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucun cycle en attente de validation" />}
      {pending.data?.map((r) => (
        <Card key={r.id}>
          <CardBody className="flex items-center justify-between">
            <p className="text-sm text-ink">{r.period_start} au {r.period_end}</p>
            <Button size="sm" onClick={() => validate(r.id)} disabled={busy === r.id}>
              {busy === r.id ? 'Validation...' : 'Valider et generer les bulletins'}
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function AdvancesApprovalTab() {
  const pending = useApiGet('/api/hr/salary-advances/pending-approval/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const act = async (id, action) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/hr/salary-advances/${id}/${action}/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucune avance en attente" />}
      {pending.data?.map((a) => (
        <Card key={a.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{a.staff_name} - {a.amount} FCFA</p>
              <p className="text-xs text-ink-muted">{a.reason}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={() => act(a.id, 'reject')} disabled={busy === a.id}>Rejeter</Button>
              <Button size="sm" onClick={() => act(a.id, 'approve')} disabled={busy === a.id}>Approuver</Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function LeaveApprovalTab() {
  const pending = useApiGet('/api/hr/leave-requests/pending-approval/')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const act = async (id, action) => {
    setBusy(id)
    setError(null)
    try {
      await api.post(`/api/hr/leave-requests/${id}/${action}/`, {})
      pending.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">Les conges sans solde requierent votre approbation (impact sur la paie).</p>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {pending.loading && <div className="flex justify-center py-8"><Spinner /></div>}
      {!pending.loading && pending.data?.length === 0 && <EmptyState title="Aucun conge en attente" />}
      {pending.data?.map((l) => (
        <Card key={l.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{l.staff_name}</p>
              <p className="text-xs text-ink-muted">{l.start_date} au {l.end_date} - {l.leave_type} - {l.reason}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={() => act(l.id, 'reject')} disabled={busy === l.id}>Rejeter</Button>
              <Button size="sm" onClick={() => act(l.id, 'approve')} disabled={busy === l.id}>Approuver</Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function VendorsTab() {
  const vendors = useApiGet('/api/finance/vendors/')
  const bills = useApiGet('/api/finance/vendor-bills/')
  const [form, setForm] = useState({ vendor: '', amount: '', description: '', expense_account_code: '601' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/finance/vendor-bills/', { ...form, vendor: Number(form.vendor) })
      setForm({ vendor: '', amount: '', description: '', expense_account_code: '601' })
      bills.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Nouvelle facture fournisseur" />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select required className={INPUT_CLASS} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
              <option value="">Choisir le fournisseur...</option>
              {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <input required type="number" step="0.01" className={INPUT_CLASS} placeholder="Montant (FCFA)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input required className={`sm:col-span-2 ${INPUT_CLASS}`} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Factures recentes" />
        <CardBody className="p-0">
          {bills.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!bills.loading && bills.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune facture" /></div>}
          <ul className="divide-y divide-border">
            {bills.data?.map((b) => (
              <li key={b.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{b.vendor_name}</p>
                  <p className="text-xs text-ink-muted">{b.description} - {b.bill_date}</p>
                </div>
                <Badge tone="neutral">{b.amount} FCFA</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
