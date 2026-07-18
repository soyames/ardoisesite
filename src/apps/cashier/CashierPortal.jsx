import { useState } from 'react'
import { useApiGet } from '../../shared/hooks/useApi.js'
import Spinner from '../../shared/ui/Spinner.jsx'
import MonEspaceRH from '../../shared/components/MonEspaceRH.jsx'
import Encaissement from '../../shared/components/Encaissement.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'cashier', label: 'Encaissement' },
  { key: 'rh', label: 'Mon espace RH' },
]

/**
 * Cashier's daily flow: look up a student's invoices by matricule,
 * then post a payment against one - see shared/components/
 * Encaissement.jsx (also used by Comptable/Secretaire, who handle
 * encaissement too, not just Cashier). Posts through
 * POST /api/finance/payments/, which on the backend runs through
 * finance.services.post_tuition_payment (never a bare model .save())
 * -- so every ledger invariant (balanced entry, allocation sums,
 * invoice status derivation) this screen relies on is enforced
 * server-side, not just assumed client-side.
 */
export default function CashierPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Encaissement</h1>
        <p className="mt-1 text-sm text-ink-muted">Rechercher un eleve pour consulter et encaisser ses factures.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'cashier' && <Encaissement />}
      {tab === 'rh' && <MonEspaceRH />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const payments = useApiGet('/api/finance/payments/')
  const today = new Date().toDateString()
  const todayPayments = (payments.data || []).filter((p) => new Date(p.created_at || p.paid_at).toDateString() === today)
  const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble des encaissements.</p>
      </div>

      <button onClick={() => onNavigate('cashier')} className="block w-full rounded-card border border-border bg-primary-950 p-4 text-left text-white transition hover:bg-primary-900 sm:w-auto">
        <p className="text-sm font-semibold">Rechercher un eleve</p>
        <p className="mt-1 text-xs text-white/70">Consulter et encaisser une facture</p>
      </button>

      {payments.loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!payments.loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Paiements du jour" value={todayPayments.length} />
          <StatCard label="Total encaisse aujourd'hui" value={`${todayTotal.toLocaleString()} FCFA`} />
        </div>
      )}
    </div>
  )
}
