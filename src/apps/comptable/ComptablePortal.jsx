import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'reports', label: 'Rapports' },
  { key: 'batch-invoices', label: 'Facturation groupee' },
  { key: 'payroll', label: 'Validation paie' },
  { key: 'advances', label: 'Avances' },
  { key: 'leave', label: 'Conges (sans solde)' },
  { key: 'vendors', label: 'Fournisseurs' },
]

export default function ComptablePortal() {
  const [tab, setTab] = useState('reports')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Comptabilite</h1>
        <p className="mt-1 text-sm text-ink-muted">Grand livre, validation de paie, approbations financieres.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-b-2 border-primary-600 text-primary-700' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsTab />}
      {tab === 'batch-invoices' && <BatchInvoicesTab />}
      {tab === 'payroll' && <PayrollValidationTab />}
      {tab === 'advances' && <AdvancesApprovalTab />}
      {tab === 'leave' && <LeaveApprovalTab />}
      {tab === 'vendors' && <VendorsTab />}
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

function ReportsTab() {
  const today = new Date().toISOString().slice(0, 10)
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
