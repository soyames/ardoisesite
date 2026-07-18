import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import QrScanner from '../../shared/components/QrScanner.jsx'
import MonEspaceRH from '../../shared/components/MonEspaceRH.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'sale', label: 'Vente' },
  { key: 'wallets', label: 'Portefeuilles' },
  { key: 'stock', label: 'Stock' },
  { key: 'vendors', label: 'Fournisseurs' },
  { key: 'rh', label: 'Mon espace RH' },
]

export default function CanteenPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cantine</h1>
        <p className="mt-1 text-sm text-ink-muted">Ventes au comptoir, portefeuilles eleves et approvisionnement.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'sale' && <SaleTab />}
      {tab === 'wallets' && <WalletsTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'vendors' && <VendorsTab />}
      {tab === 'rh' && <MonEspaceRH />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const items = useApiGet('/api/shop/inventory/')
  const sales = useApiGet('/api/shop/sales/')

  const loading = items.loading || sales.loading
  const today = new Date().toDateString()
  const todaySales = (sales.data || []).filter((s) => new Date(s.created_at || s.sold_at).toDateString() === today)
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0)
  const lowStockItems = (items.data || []).filter((i) => Number(i.quantity_on_hand) <= Number(i.low_stock_threshold))

  const saleItems = (sales.data || []).slice(0, 6).map((s) => ({
    id: s.id,
    icon: s.method === 'wallet' ? 'account_balance_wallet' : 'payments',
    iconTone: 'accent',
    title: `Recu ${s.receipt_number}`,
    subtitle: s.method === 'wallet' ? 'Portefeuille' : 'Especes',
    badge: `${Number(s.total_amount).toLocaleString()} FCFA`,
    badgeTone: 'neutral',
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Cantine</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble des operations de la cantine.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickActionButton icon="point_of_sale" title="Nouvelle vente" description="Encaisser un achat" onClick={() => onNavigate('sale')} />
        <QuickActionButton icon="qr_code_scanner" title="Scanner un eleve" description="Rechercher un portefeuille" onClick={() => onNavigate('wallets')} />
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon="trending_up" label="Ventes du jour" value={`${todayTotal.toLocaleString()} FCFA`} hint={`${todaySales.length} transaction(s)`} />
            <StatCard icon="inventory_2" label="Articles en stock" value={items.data?.length || 0} />
            <StatCard
              icon="warning"
              label="Alertes stock faible"
              value={lowStockItems.length}
              badge={lowStockItems.length > 0 ? 'Action requise' : undefined}
              tone={lowStockItems.length > 0 ? 'danger' : 'success'}
              linkLabel="Voir le stock"
              onLinkClick={() => onNavigate('stock')}
            />
          </div>

          {lowStockItems.length > 0 && (
            <Card>
              <CardHeader title="Stock faible" action={<button onClick={() => onNavigate('stock')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir tout</button>} />
              <ActivityList
                items={lowStockItems.slice(0, 5).map((i) => ({
                  id: i.id, icon: 'flatware', iconTone: 'danger', title: i.name,
                  badge: `${i.quantity_on_hand} restant(s)`, badgeTone: 'danger',
                }))}
              />
            </Card>
          )}

          <Card>
            <CardHeader title="Transactions recentes" action={<button onClick={() => onNavigate('sale')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir tout</button>} />
            <ActivityList items={saleItems} emptyLabel="Aucune vente." />
          </Card>
        </>
      )}
    </div>
  )
}

function SaleTab() {
  const items = useApiGet('/api/shop/inventory/')
  const sales = useApiGet('/api/shop/sales/')
  const [cart, setCart] = useState({})
  const [matricule, setMatricule] = useState('')
  const [method, setMethod] = useState('cash')
  const [receipt, setReceipt] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const setQty = (itemId, qty) => setCart({ ...cart, [itemId]: qty })

  const total = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = items.data?.find((i) => String(i.id) === itemId)
    return sum + (item ? Number(item.unit_price) * Number(qty || 0) : 0)
  }, 0)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const lines = Object.entries(cart)
        .filter(([, qty]) => Number(qty) > 0)
        .map(([item, quantity]) => ({ item: Number(item), quantity: Number(quantity) }))
      if (lines.length === 0) {
        setError('Ajoutez au moins un article.')
        return
      }
      await api.post('/api/shop/sales/', {
        student_matricule: matricule || undefined,
        method,
        receipt_number: receipt,
        lines,
      })
      setCart({})
      setMatricule('')
      setReceipt('')
      sales.refetch()
      items.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Nouvelle vente" />
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            {items.loading && <div className="flex justify-center py-8"><Spinner /></div>}
            {!items.loading && (
              <div className="space-y-2">
                {items.data?.filter((i) => i.category === 'meal').map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-control border border-border p-2">
                    <div>
                      <p className="text-sm text-ink">{i.name}</p>
                      <p className="text-xs text-ink-muted">{i.unit_price} FCFA - stock {i.quantity_on_hand}</p>
                    </div>
                    <input
                      type="number" min="0" className={`w-20 ${INPUT_CLASS}`}
                      value={cart[i.id] || ''} onChange={(e) => setQty(i.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select className={INPUT_CLASS} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Especes</option>
                <option value="wallet">Portefeuille eleve</option>
              </select>
              <input
                className={INPUT_CLASS} placeholder="Matricule eleve (si portefeuille)"
                value={matricule} onChange={(e) => setMatricule(e.target.value)}
              />
              <input required className={INPUT_CLASS} placeholder="N° recu" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Total: {total.toLocaleString()} FCFA</p>
              {error && <p className="text-sm text-danger-600">{error}</p>}
              <Button type="submit" disabled={submitting}>{submitting ? 'Encaissement...' : 'Encaisser'}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ventes recentes" />
        <CardBody className="p-0">
          {sales.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!sales.loading && sales.data?.length === 0 && <div className="p-4"><EmptyState title="Aucune vente" /></div>}
          <ul className="divide-y divide-border">
            {sales.data?.slice(0, 15).map((s) => (
              <li key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-ink">Recu {s.receipt_number} - {s.lines.map((l) => l.item_name).join(', ')}</p>
                  <p className="text-xs text-ink-muted">{s.method === 'wallet' ? 'Portefeuille' : 'Especes'}</p>
                </div>
                <Badge tone="neutral">{Number(s.total_amount).toLocaleString()} FCFA</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function WalletsTab() {
  const [matricule, setMatricule] = useState('')
  const [wallet, setWallet] = useState(null)
  const [lookupError, setLookupError] = useState(null)
  const [topup, setTopup] = useState({ amount: '', method: 'cash', receipt_number: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const lookup = async (e) => {
    e.preventDefault()
    setLookupError(null)
    setWallet(null)
    try {
      const res = await api.get(`/api/shop/wallets/?student_matricule=${encodeURIComponent(matricule)}`)
      setWallet(res)
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    }
  }

  const lookupByScan = async (idCardCode) => {
    setLookupError(null)
    setWallet(null)
    try {
      const res = await api.get(`/api/shop/wallets/?id_card_code=${encodeURIComponent(idCardCode)}`)
      setWallet(res)
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : 'Carte non reconnue - utilisez le matricule.')
    }
  }

  const submitTopup = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.post('/api/shop/wallet-topups/', { student_matricule: matricule, ...topup, amount: Number(topup.amount) })
      setWallet(res)
      setTopup({ amount: '', method: 'cash', receipt_number: '' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Rechercher un portefeuille" subtitle="Scannez la carte de l'eleve, ou saisissez son matricule." />
        <CardBody className="space-y-3">
          <QrScanner onScan={lookupByScan} />
          <form onSubmit={lookup} className="flex gap-2">
            <input className={INPUT_CLASS} placeholder="Matricule eleve" value={matricule} onChange={(e) => setMatricule(e.target.value)} />
            <Button type="submit">Rechercher</Button>
          </form>
          {lookupError && <p className="mt-2 text-sm text-danger-600">{lookupError}</p>}
        </CardBody>
      </Card>

      {wallet && (
        <Card>
          <CardHeader title={wallet.student_name} subtitle={`Solde: ${Number(wallet.balance).toLocaleString()} FCFA`} />
          <CardBody>
            <form onSubmit={submitTopup} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input required type="number" step="0.01" className={INPUT_CLASS} placeholder="Montant" value={topup.amount} onChange={(e) => setTopup({ ...topup, amount: e.target.value })} />
              <select className={INPUT_CLASS} value={topup.method} onChange={(e) => setTopup({ ...topup, method: e.target.value })}>
                <option value="cash">Especes</option>
                <option value="momo">Mobile Money</option>
                <option value="flooz">Flooz</option>
              </select>
              <input required className={INPUT_CLASS} placeholder="N° recu" value={topup.receipt_number} onChange={(e) => setTopup({ ...topup, receipt_number: e.target.value })} />
              {error && <p className="text-sm text-danger-600 sm:col-span-3">{error}</p>}
              <div className="sm:col-span-3"><Button type="submit" disabled={submitting}>{submitting ? 'Rechargement...' : 'Recharger'}</Button></div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function StockTab() {
  const items = useApiGet('/api/shop/inventory/')
  const movements = useApiGet('/api/shop/stock-movements/')
  const [form, setForm] = useState({ item: '', direction: 'adjustment', quantity: '', note: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/shop/stock-movements/', { ...form, item: Number(form.item), quantity: Number(form.quantity) })
      setForm({ item: '', direction: 'adjustment', quantity: '', note: '' })
      items.refetch()
      movements.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Niveaux de stock" />
        <CardBody className="p-0">
          {items.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          <ul className="divide-y divide-border">
            {items.data?.map((i) => (
              <li key={i.id} className="flex items-center justify-between p-4">
                <p className="text-sm text-ink">{i.name}</p>
                <Badge tone={Number(i.quantity_on_hand) <= Number(i.low_stock_threshold) ? 'danger' : 'success'}>
                  {i.quantity_on_hand} en stock
                </Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mouvement de stock" subtitle="Reapprovisionnement ou ajustement d'inventaire." />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select required className={INPUT_CLASS} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}>
              <option value="">Choisir l'article...</option>
              {items.data?.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select className={INPUT_CLASS} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              <option value="in">Entree</option>
              <option value="out">Sortie</option>
              <option value="adjustment">Ajustement</option>
            </select>
            <input required type="number" step="0.01" className={INPUT_CLASS} placeholder="Quantite" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <input className={INPUT_CLASS} placeholder="Note (optionnel)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historique des mouvements" />
        <CardBody className="p-0">
          {movements.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!movements.loading && movements.data?.length === 0 && <div className="p-4"><EmptyState title="Aucun mouvement" /></div>}
          <ul className="divide-y divide-border">
            {movements.data?.slice(0, 15).map((m) => (
              <li key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-ink">{m.item_name}{m.note ? ` - ${m.note}` : ''}</p>
                  <p className="text-xs text-ink-muted">{m.recorded_by_name}</p>
                </div>
                <Badge tone={m.direction === 'in' ? 'success' : m.direction === 'out' ? 'warning' : 'neutral'}>
                  {m.direction === 'in' ? '+' : m.direction === 'out' ? '-' : '='}{m.quantity}
                </Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
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
