import { useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../ui/Card.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Spinner from '../ui/Spinner.jsx'
import EmptyState from '../ui/EmptyState.jsx'

const STATUS_TONE = { paid: 'success', partial: 'warning', unpaid: 'neutral', overdue: 'danger' }

const METHODS = [
  { value: 'cash', label: 'Especes' },
  { value: 'momo', label: 'MTN Mobile Money' },
  { value: 'flooz', label: 'Moov Flooz' },
  { value: 'bank', label: 'Virement bancaire' },
]

/**
 * Shared search-a-student-by-matricule -> pay-an-invoice flow. Cashier
 * is the original owner of this screen, but Secretaire and Comptable
 * also handle encaissement day to day at this school (see
 * core/permissions.py's finance.payment grants on those roles) - kept
 * as one component rather than three copies so a change to the
 * payment flow doesn't need to land three times.
 */
export default function Encaissement() {
  const [matricule, setMatricule] = useState('')
  const [searched, setSearched] = useState('')
  const invoices = useApiGet(searched ? `/api/finance/invoices/?student_matricule=${searched}` : null, {
    skip: !searched,
  })

  function handleSearch(e) {
    e.preventDefault()
    setSearched(matricule.trim())
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Matricule de l'eleve (ex: STU-0001)"
              className="flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
            <Button type="submit">Rechercher</Button>
          </form>
        </CardBody>
      </Card>

      {searched && (
        <Card>
          <CardHeader title={`Factures - ${searched}`} />
          <CardBody>
            {invoices.loading && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {!invoices.loading && (!invoices.data || invoices.data.length === 0) && (
              <EmptyState title="Aucune facture trouvee" description="Verifiez le matricule saisi." />
            )}
            {!invoices.loading && invoices.data?.length > 0 && (
              <ul className="space-y-3">
                {invoices.data.map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} onPaid={invoices.refetch} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function InvoiceRow({ invoice, onPaid }) {
  const [open, setOpen] = useState(false)
  const balance = (Number(invoice.amount_due) - Number(invoice.amount_paid)).toFixed(2)

  return (
    <li className="rounded-control border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">{invoice.tranche_label || `Facture #${invoice.id}`}</p>
          <p className="text-xs text-ink-muted">
            {invoice.student_name} · Du: {invoice.amount_due} FCFA · Reste: {balance} FCFA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[invoice.status] || 'neutral'}>{invoice.status}</Badge>
          {invoice.status !== 'paid' && (
            <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
              {open ? 'Fermer' : 'Encaisser'}
            </Button>
          )}
        </div>
      </div>
      {open && <PaymentForm invoice={invoice} onPaid={() => { setOpen(false); onPaid() }} />}
    </li>
  )
}

function PaymentForm({ invoice, onPaid }) {
  const balance = (Number(invoice.amount_due) - Number(invoice.amount_paid)).toFixed(2)
  const [parentId, setParentId] = useState('')
  const [amount, setAmount] = useState(balance)
  const [method, setMethod] = useState('cash')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/finance/payments/', {
        parent: Number(parentId),
        amount,
        method,
        receipt_number: receiptNumber,
        allocations: [{ invoice: invoice.id, amount }],
      })
      onPaid()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Le paiement a echoue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">ID du parent payeur</label>
        <input
          required
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="w-full rounded-control border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">Montant (FCFA)</label>
        <input
          required
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-control border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">Mode de paiement</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-control border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary-500"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">N° de recu</label>
        <input
          required
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
          className="w-full rounded-control border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary-500"
        />
      </div>

      {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Enregistrement...' : 'Confirmer le paiement'}
        </Button>
      </div>
    </form>
  )
}
