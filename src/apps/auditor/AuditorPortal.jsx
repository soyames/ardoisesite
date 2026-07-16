import { useState } from 'react'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'

const TABS = [
  { key: 'audit', label: "Journal d'audit" },
  { key: 'finance', label: 'Finances' },
  { key: 'hr', label: 'RH' },
  { key: 'comms', label: 'Communications' },
]

export default function AuditorPortal() {
  const [tab, setTab] = useState('audit')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Audit</h1>
        <p className="mt-1 text-sm text-ink-muted">Lecture seule sur les finances, la paie et les communications.</p>
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

      {tab === 'audit' && <AuditLogTab />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'hr' && <HrTab />}
      {tab === 'comms' && <CommsTab />}
    </div>
  )
}

function AuditLogTab() {
  const logs = useApiGet('/api/audit/logs/')

  return (
    <Card>
      <CardHeader title="Journal d'audit" subtitle="Toutes les actions tracees sur cette instance." />
      <CardBody className="p-0">
        {logs.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!logs.loading && logs.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune entree" /></div>}
        <ul className="divide-y divide-border">
          {logs.data?.slice(0, 50).map((l) => (
            <li key={l.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{l.actor_name} - {l.action}</p>
                <span className="text-xs text-ink-muted">{new Date(l.occurred_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{l.summary}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function FinanceTab() {
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 8) + '01'
  const trialBalance = useApiGet(`/api/finance/reports/trial-balance/?as_of=${today}`)
  const incomeStatement = useApiGet(`/api/finance/reports/income-statement/?start=${monthStart}&end=${today}`)
  const payments = useApiGet('/api/finance/payments/')

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

      <Card>
        <CardHeader title="Paiements recents" />
        <CardBody className="p-0">
          {payments.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!payments.loading && payments.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun paiement" /></div>}
          <ul className="divide-y divide-border">
            {payments.data?.slice(0, 20).map((p) => (
              <li key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-ink">{p.parent_name} - Recu {p.receipt_number}</p>
                  <p className="text-xs text-ink-muted">{new Date(p.received_on).toLocaleDateString()} - {p.method}</p>
                </div>
                <Badge tone="neutral">{Number(p.amount).toLocaleString()} FCFA</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function HrTab() {
  const payslips = useApiGet('/api/hr/payslips/')
  const advances = useApiGet('/api/hr/salary-advances/')
  const leave = useApiGet('/api/hr/leave-requests/')

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader title="Bulletins de paie" />
        <CardBody className="p-0">
          {payslips.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!payslips.loading && payslips.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun bulletin" /></div>}
          <ul className="divide-y divide-border">
            {payslips.data?.slice(0, 15).map((p) => (
              <li key={p.id} className="p-3">
                <p className="text-sm text-ink">{p.staff_name}</p>
                <p className="text-xs text-ink-muted">Net: {Number(p.net_amount).toLocaleString()} FCFA</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Avances sur salaire" />
        <CardBody className="p-0">
          {advances.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!advances.loading && advances.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune avance" /></div>}
          <ul className="divide-y divide-border">
            {advances.data?.slice(0, 15).map((a) => (
              <li key={a.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink">{a.staff_name}</p>
                  <Badge tone={a.status === 'APPROVED' ? 'success' : a.status === 'REJECTED' ? 'danger' : 'warning'}>{a.status}</Badge>
                </div>
                <p className="text-xs text-ink-muted">{Number(a.amount).toLocaleString()} FCFA</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Conges" />
        <CardBody className="p-0">
          {leave.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!leave.loading && leave.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun conge" /></div>}
          <ul className="divide-y divide-border">
            {leave.data?.slice(0, 15).map((l) => (
              <li key={l.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink">{l.staff_name}</p>
                  <Badge tone={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}>{l.status}</Badge>
                </div>
                <p className="text-xs text-ink-muted">{l.start_date} au {l.end_date} - {l.leave_type}</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function CommsTab() {
  const messages = useApiGet('/api/communications/messages/')

  return (
    <Card>
      <CardHeader title="Communications envoyees" />
      <CardBody className="p-0">
        {messages.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!messages.loading && messages.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun message" /></div>}
        <ul className="divide-y divide-border">
          {messages.data?.slice(0, 30).map((m) => (
            <li key={m.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-ink">{m.template_code || m.trigger_type} - {m.recipient_phone}</p>
                <p className="text-xs text-ink-muted">{m.channel} - {new Date(m.created_at).toLocaleString()}</p>
              </div>
              <Badge tone={m.status === 'sent' || m.status === 'delivered' ? 'success' : m.status === 'failed' ? 'danger' : 'neutral'}>{m.status}</Badge>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
