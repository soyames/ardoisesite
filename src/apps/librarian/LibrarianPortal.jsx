import { useState } from 'react'
import { api, ApiError } from '../../shared/api/client.js'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import MonEspaceRH from '../../shared/components/MonEspaceRH.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import QuickActionButton from '../../shared/ui/QuickActionButton.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const CATEGORIES = [
  { value: 'book', label: 'Livre / Manuel APC' },
  { value: 'uniform', label: 'Uniforme' },
  { value: 'supply', label: 'Fourniture scolaire' },
  { value: 'other', label: 'Autre' },
]

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'sale', label: 'Vente' },
  { key: 'prets', label: 'Prets' },
  { key: 'catalog', label: 'Catalogue' },
  { key: 'stock', label: 'Stock' },
  { key: 'vendors', label: 'Fournisseurs' },
  { key: 'rh', label: 'Mon espace RH' },
]

const NON_MEAL_CATEGORIES = ['book', 'uniform', 'supply', 'other']

export default function LibrarianPortal() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Librairie / Economat</h1>
        <p className="mt-1 text-sm text-ink-muted">Catalogue, ventes au comptoir et approvisionnement.</p>
      </div>

      <PortalTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
      {tab === 'sale' && <SaleTab />}
      {tab === 'prets' && <PretsTab />}
      {tab === 'catalog' && <CatalogTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'vendors' && <VendorsTab />}
      {tab === 'rh' && <MonEspaceRH />}
    </div>
  )
}

function DashboardTab({ onNavigate }) {
  const items = useApiGet('/api/shop/inventory/')
  const sales = useApiGet('/api/shop/sales/')
  const loans = useApiGet('/api/shop/loans/')

  const loading = items.loading || sales.loading || loans.loading
  const today = new Date().toDateString()
  const todaySales = (sales.data || []).filter((s) => new Date(s.created_at || s.sold_at).toDateString() === today)
  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.total_amount), 0)
  const lowStockItems = (items.data || []).filter((i) => Number(i.quantity_on_hand) <= Number(i.low_stock_threshold))
  const openLoans = (loans.data || []).filter((l) => !l.returned_date)
  const overdueLoans = openLoans.filter((l) => l.due_date && new Date(l.due_date) < new Date())

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-700">Librairie / Economat</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Bonjour</h2>
        <p className="mt-1 text-sm text-ink-muted">Vue d'ensemble de la librairie/economat.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickActionButton icon="point_of_sale" title="Nouvelle vente" description="Encaisser un achat" onClick={() => onNavigate('sale')} />
        <QuickActionButton icon="menu_book" title="Prets de livres" description={`${overdueLoans.length} en retard`} onClick={() => onNavigate('prets')} />
      </div>

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="trending_up" label="Ventes du jour" value={`${todayTotal.toLocaleString()} FCFA`} hint={`${todaySales.length} transaction(s)`} />
            <StatCard icon="inventory_2" label="Articles en stock" value={items.data?.length || 0} />
            <StatCard icon="warning" label="Alertes stock faible" value={lowStockItems.length} tone={lowStockItems.length > 0 ? 'danger' : 'success'} linkLabel="Voir le stock" onLinkClick={() => onNavigate('stock')} />
            <StatCard icon="menu_book" label="Prets en retard" value={overdueLoans.length} tone={overdueLoans.length > 0 ? 'warning' : 'success'} />
          </div>

          {lowStockItems.length > 0 && (
            <Card>
              <CardHeader title="Stock faible" action={<button onClick={() => onNavigate('stock')} className="text-xs font-medium text-primary-600 hover:text-primary-700">Voir tout</button>} />
              <ActivityList
                items={lowStockItems.slice(0, 5).map((i) => ({
                  id: i.id, icon: 'inventory_2', iconTone: 'danger', title: i.name,
                  badge: `${i.quantity_on_hand} restant(s)`, badgeTone: 'danger',
                }))}
              />
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function SaleTab() {
  const items = useApiGet('/api/shop/inventory/')
  const sales = useApiGet('/api/shop/sales/')
  const [cart, setCart] = useState({})
  const [receipt, setReceipt] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const setQty = (itemId, qty) => setCart({ ...cart, [itemId]: qty })
  const sellable = items.data?.filter((i) => NON_MEAL_CATEGORIES.includes(i.category)) || []

  const total = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = sellable.find((i) => String(i.id) === itemId)
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
      await api.post('/api/shop/sales/', { method: 'cash', receipt_number: receipt, lines })
      setCart({})
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
                {sellable.map((i) => (
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

            <input required className={INPUT_CLASS} placeholder="N° recu" value={receipt} onChange={(e) => setReceipt(e.target.value)} />

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
                <p className="text-sm text-ink">Recu {s.receipt_number} - {s.lines.map((l) => l.item_name).join(', ')}</p>
                <Badge tone="neutral">{Number(s.total_amount).toLocaleString()} FCFA</Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function PretsTab() {
  const items = useApiGet('/api/shop/inventory/')
  const loans = useApiGet('/api/shop/loans/')
  const [form, setForm] = useState({ item: '', student_matricule: '', due_date: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [busy, setBusy] = useState(null)

  const bookItems = items.data?.filter((i) => i.category === 'book') || []
  const openLoans = loans.data?.filter((l) => !l.returned_date) || []
  const returnedLoans = loans.data?.filter((l) => l.returned_date) || []

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/shop/loans/', { ...form, item: Number(form.item) })
      setForm({ item: '', student_matricule: '', due_date: '' })
      loans.refetch()
      items.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  const returnLoan = async (id) => {
    setBusy(id)
    try {
      await api.post(`/api/shop/loans/${id}/return/`)
      loans.refetch()
      items.refetch()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Nouveau pret" subtitle="Seuls les livres/manuels (categorie 'Livre') peuvent etre pretes." />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select required className={INPUT_CLASS} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}>
              <option value="">Choisir le livre...</option>
              {bookItems.map((i) => (
                <option key={i.id} value={i.id} disabled={Number(i.quantity_on_hand) <= 0}>
                  {i.name} ({i.quantity_on_hand} dispo)
                </option>
              ))}
            </select>
            <input
              required className={INPUT_CLASS} placeholder="Matricule eleve"
              value={form.student_matricule} onChange={(e) => setForm({ ...form, student_matricule: e.target.value })}
            />
            <input
              required type="date" className={INPUT_CLASS}
              value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
            {error && <p className="text-sm text-danger-600 sm:col-span-3">{error}</p>}
            <div className="sm:col-span-3">
              <Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Preter'}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Prets en cours" />
        <CardBody className="p-0">
          {loans.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!loans.loading && openLoans.length === 0 && <div className="p-4"><EmptyState title="Aucun pret en cours" /></div>}
          <ul className="divide-y divide-border">
            {openLoans.map((l) => (
              <li key={l.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink">{l.item_name} - {l.student_name}</p>
                  <p className="text-xs text-ink-muted">{l.student_matricule} - a rendre le {l.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={l.is_overdue ? 'danger' : 'neutral'}>{l.is_overdue ? 'En retard' : 'En cours'}</Badge>
                  <Button size="sm" onClick={() => returnLoan(l.id)} disabled={busy === l.id}>
                    {busy === l.id ? 'Retour...' : 'Retourner'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {returnedLoans.length > 0 && (
        <Card>
          <CardHeader title="Prets rendus" />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {returnedLoans.slice(0, 15).map((l) => (
                <li key={l.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-ink">{l.item_name} - {l.student_name}</p>
                    <p className="text-xs text-ink-muted">Rendu le {l.returned_date}</p>
                  </div>
                  {Number(l.fine_amount) > 0 && <Badge tone="warning">Amende {l.fine_amount} FCFA</Badge>}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function CatalogTab() {
  const items = useApiGet('/api/shop/inventory/')
  const [form, setForm] = useState({ category: 'book', name: '', unit_price: '', low_stock_threshold: '5' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/shop/inventory/', {
        ...form,
        unit_price: Number(form.unit_price),
        low_stock_threshold: Number(form.low_stock_threshold),
      })
      setForm({ category: 'book', name: '', unit_price: '', low_stock_threshold: '5' })
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
        <CardHeader title="Nouvel article" />
        <CardBody>
          <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select className={INPUT_CLASS} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input required className={INPUT_CLASS} placeholder="Nom de l'article" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="number" step="0.01" className={INPUT_CLASS} placeholder="Prix unitaire (FCFA)" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
            <input type="number" step="0.01" className={INPUT_CLASS} placeholder="Seuil de stock bas" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
            {error && <p className="text-sm text-danger-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Ajouter au catalogue'}</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catalogue" />
        <CardBody className="p-0">
          {items.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          <ul className="divide-y divide-border">
            {items.data?.map((i) => (
              <li key={i.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-ink">{i.name}</p>
                  <p className="text-xs text-ink-muted">{CATEGORIES.find((c) => c.value === i.category)?.label || i.category} - {i.unit_price} FCFA</p>
                </div>
                <Badge tone={Number(i.quantity_on_hand) <= Number(i.low_stock_threshold) ? 'danger' : 'success'}>
                  {i.quantity_on_hand} en stock
                </Badge>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

function StockTab() {
  const items = useApiGet('/api/shop/inventory/')
  const movements = useApiGet('/api/shop/stock-movements/')
  const [form, setForm] = useState({ item: '', direction: 'in', quantity: '', note: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/shop/stock-movements/', { ...form, item: Number(form.item), quantity: Number(form.quantity) })
      setForm({ item: '', direction: 'in', quantity: '', note: '' })
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
