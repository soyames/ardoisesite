import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import ActivityList from '../../shared/ui/ActivityList.jsx'
import Icon from '../../shared/ui/Icon.jsx'

/**
 * Everything a parent can see about their own children -- bulletins,
 * attendance, discipline, and tuition status -- pulled straight from
 * the read endpoints added for this (apps/students/api_views.py:
 * MyChildrenView, and academics/api_views.py's Student*ListView
 * classes on the backend). Every list here is the real, cross-family-
 * blocked, released/approved-only-filtered data those endpoints
 * return -- nothing here is a placeholder waiting for a backend that
 * doesn't exist yet.
 */
export default function ParentPortal() {
  const { user } = useAuth()
  const children = useApiGet('/api/students/my-children/')
  const [selectedId, setSelectedId] = useState(null)

  const selectedChild = useMemo(
    () => children.data?.find((c) => c.id === selectedId) ?? children.data?.[0] ?? null,
    [children.data, selectedId]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mes enfants</h1>
        <p className="mt-1 text-sm text-ink-muted">Bulletins, presence, discipline et scolarite.</p>
      </div>

      {children.loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!children.loading && (!children.data || children.data.length === 0) && (
        <EmptyState
          title="Aucun enfant lie a ce compte"
          description="Si vous pensez que c'est une erreur, contactez le secretariat de l'ecole."
        />
      )}

      {!children.loading && children.data?.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3">
            {children.data.map((child) => (
              <Button
                key={child.id}
                onClick={() => setSelectedId(child.id)}
                variant={(selectedChild?.id ?? children.data[0].id) === child.id ? 'primary' : 'secondary'}
                size="md"
                className="rounded-full shadow-sm"
              >
                {child.firstName} {child.lastName}
              </Button>
            ))}
          </div>

          {selectedChild && (
            <ChildDetail key={selectedChild.id} child={selectedChild} parentId={user?.parentId} />
          )}
        </>
      )}

      {/* Enrollment Requests Section */}
      <EnrollmentRequests parentId={user?.uid} />

      {/* Tutoring Contracts Section */}
      <TutoringContracts parentId={user?.id} />

      {/* Explore Marketplace Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold text-ink mb-6">Explorer les services Ardoise</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:-translate-y-1 transition-all hover:shadow-elevated border border-border bg-surface-raised">
            <CardBody className="text-center p-8 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl mb-4">🏫</div>
              <h3 className="text-lg font-bold text-ink mb-2">Trouver une école</h3>
              <p className="text-sm text-ink-muted mb-6 flex-1">
                Découvrez les meilleures écoles partenaires sur Ardoise et inscrivez vos enfants.
              </p>
              <Link to="/schools" className="rounded-control bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition ring-1 ring-inset ring-primary-200">
                Parcourir les écoles
              </Link>
            </CardBody>
          </Card>

          <Card className="hover:-translate-y-1 transition-all hover:shadow-elevated border border-border bg-surface-raised">
            <CardBody className="text-center p-8 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl mb-4">👨‍🏫</div>
              <h3 className="text-lg font-bold text-ink mb-2">Trouver un tuteur</h3>
              <p className="text-sm text-ink-muted mb-6 flex-1">
                Besoin de soutien scolaire à domicile ? Trouvez un tuteur qualifié près de chez vous.
              </p>
              <Link to="/teachers" className="rounded-control bg-primary-50 px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition ring-1 ring-inset ring-primary-200">
                Parcourir les tuteurs
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function EnrollmentRequests({ parentId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentId) return
    const q = query(collection(db, 'school_enrollment_requests'), where('parentId', '==', parentId))
    const unsub = onSnapshot(q, (snap) => {
      const data = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      // Sort descending by createdAt (could be null if just created, so handle carefully)
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setRequests(data)
      setLoading(false)
    })
    return () => unsub()
  }, [parentId])

  if (loading) return null
  if (requests.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-ink mb-4">Demandes d'inscription en cours</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map(req => (
          <Card key={req.id} className="border border-border">
            <CardBody>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-ink">{req.childName}</h3>
                  <p className="text-sm text-ink-muted">Classe : {req.childClassName}</p>
                </div>
                <Badge tone={
                  req.status === 'accepted' ? 'success' :
                  req.status === 'rejected' ? 'danger' :
                  req.status === 'pending_payment' ? 'warning' : 'neutral'
                }>
                  {req.status === 'pending_payment' ? 'Paiement requis' : 
                   req.status === 'accepted' ? 'Acceptée' : 
                   req.status === 'rejected' ? 'Refusée' : 'En attente'}
                </Badge>
              </div>
              {req.status === 'pending_payment' && (
                <div className="mt-3 text-sm text-warning-700 bg-warning-50 p-2 rounded">
                  Le paiement a échoué ou n'a pas été terminé. Veuillez contacter le support.
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TutoringContracts({ parentId }) {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentId) return
    const q = query(collection(db, 'tutoring_contracts'), where('parentId', '==', parentId))
    const unsub = onSnapshot(q, (snap) => {
      const data = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setContracts(data)
      setLoading(false)
    })
    return () => unsub()
  }, [parentId])

  if (loading) return null
  if (contracts.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-ink mb-4">Mes Cours de Soutien (Tutorat)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contracts.map(contract => (
          <Card key={contract.id} className="border border-border">
            <CardBody>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-ink">Tuteur : {contract.teacherName}</h3>
                  <p className="text-sm text-ink-muted">Commence le : {contract.startDate} &bull; {contract.hoursPerWeek}h/semaine</p>
                </div>
                <Badge tone={contract.status === 'active' ? 'success' : 'neutral'}>
                  {contract.status === 'active' ? 'Actif' : contract.status}
                </Badge>
              </div>
              <div className="mt-4 pt-4 border-t border-border text-sm flex justify-between">
                <span className="text-ink-muted">Derniere seance : -</span>
                <span className="font-semibold text-primary-600 cursor-pointer hover:underline">Voir les seances</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ChildDetail({ child, parentId }) {
  const enrollmentId = child.currentEnrollment?.id
  const bulletins = useApiGet(enrollmentId ? `/api/academics/bulletins/?enrollment=${enrollmentId}` : null, {
    skip: !enrollmentId,
  })
  const attendance = useApiGet(enrollmentId ? `/api/academics/attendance/?enrollment=${enrollmentId}` : null, {
    skip: !enrollmentId,
  })
  const discipline = useApiGet(enrollmentId ? `/api/academics/discipline/list/?enrollment=${enrollmentId}` : null, {
    skip: !enrollmentId,
  })
  const invoices = useApiGet(parentId ? `/api/finance/invoices/?parent=${parentId}&studentMatricule=${child.matricule}` : null, {
    skip: !parentId,
  })
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)

  const absenceCount = attendance.data?.filter((a) => a.state.startsWith('absent')).length ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {child.firstName} {child.lastName}
            </p>
            <p className="text-xs text-ink-muted">
              {child.currentEnrollment?.classroomName} · {child.currentEnrollment?.academicYearLabel} · Matricule {child.matricule}
            </p>
          </div>
          <Badge tone="neutral">{child.relation}</Badge>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="fact_check" label="Bulletins publies" value={bulletins.data?.length || 0} />
        <StatCard icon="event_busy" label="Absences enregistrees" value={absenceCount} tone={absenceCount > 0 ? 'warning' : 'success'} />
        <StatCard icon="gavel" label="Mesures disciplinaires" value={discipline.data?.length || 0} tone={discipline.data?.length > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Bulletins" subtitle="Publies par l'ecole" />
          {bulletins.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!bulletins.loading && (
            <ActivityList
              emptyLabel="Aucun bulletin publie pour l'instant."
              items={(bulletins.data || []).map((b) => ({
                id: b.id, icon: 'fact_check', iconTone: 'success',
                title: b.examPeriodLabel, subtitle: `Moyenne ${b.average} - Rang ${b.classRank}/${b.classSize}`,
                badge: 'Publie', badgeTone: 'success',
              }))}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Presence" subtitle={`${absenceCount} absence(s) enregistree(s)`} />
          {attendance.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!attendance.loading && (
            <div className="max-h-64 overflow-y-auto">
              <ActivityList
                emptyLabel="Aucun enregistrement de presence."
                items={(attendance.data || []).slice(0, 20).map((a) => ({
                  id: a.id, icon: a.state === 'present' ? 'check_circle' : a.state.startsWith('absent') ? 'cancel' : 'schedule',
                  iconTone: a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning',
                  title: a.date,
                  badge: a.state, badgeTone: a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning',
                }))}
              />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Discipline" subtitle="Mesures approuvees" />
          {discipline.loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!discipline.loading && (
            <ActivityList
              emptyLabel="Aucune mesure disciplinaire - c'est une bonne nouvelle."
              items={(discipline.data || []).map((d) => ({
                id: d.id, icon: 'gavel', iconTone: 'warning',
                title: d.measure, subtitle: d.reason,
                badge: d.date, badgeTone: 'warning',
              }))}
            />
          )}
        </Card>

        <Card>
          <CardHeader title="Scolarite" subtitle="Factures et paiements" />
          <CardBody>
            {invoices.loading && <Spinner />}
            {!invoices.loading && (!invoices.data || invoices.data.length === 0) && (
              <EmptyState title="Aucune facture" />
            )}
            <ul className="space-y-2">
              {invoices.data?.map((inv) => (
                <li key={inv.id} className="flex flex-col rounded-control border border-border p-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className="flex items-center justify-between gap-2 text-left mb-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink underline decoration-dotted underline-offset-2">
                        {inv.trancheLabel || `Facture #${inv.id}`}
                      </p>
                      <p className="text-xs text-ink-muted">{inv.amountDue} FCFA</p>
                    </div>
                    <Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                      {inv.status}
                    </Badge>
                  </button>
                  {inv.status !== 'paid' && (
                    <div className="mt-2 flex justify-end border-t border-border pt-2">
                      <SchoolPaymentButton
                        schoolId={child.currentEnrollment?.schoolId || 1}
                        invoice={inv}
                        parent={child}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {selectedInvoiceId && (
        <InvoiceDetailModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
      )}
    </div>
  )
}

const PAYMENT_METHOD_ICON = { cash: 'payments', momo: 'smartphone', flooz: 'smartphone', bank: 'account_balance' }

function InvoiceDetailModal({ invoiceId, onClose }) {
  const detail = useApiGet(`/api/finance/invoices/${invoiceId}/`)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-surface-raised shadow-elevated sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        {detail.loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!detail.loading && detail.data && (
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Facture #{detail.data.id}
                </p>
                <h3 className="text-lg font-semibold text-ink">{detail.data.trancheLabel || detail.data.label}</h3>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {detail.data.studentName} - {detail.data.studentMatricule}
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-control p-1 text-ink-muted hover:bg-surface-hover hover:text-ink">
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-control border border-border bg-surface p-3 text-sm">
              <div>
                <p className="text-xs text-ink-muted">Emise le</p>
                <p className="text-ink">{new Date(detail.data.issuedOn).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Echeance</p>
                <p className="text-ink">
                  {detail.data.dueDate ? new Date(detail.data.dueDate).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Montant du</p>
                <p className="font-semibold text-ink">{detail.data.amountDue} FCFA</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Montant paye</p>
                <p className="font-semibold text-ink">{detail.data.amountPaid} FCFA</p>
              </div>
            </div>

            {detail.data.parentNames?.length > 0 && (
              <p className="text-xs text-ink-muted">Responsable(s) : {detail.data.parentNames.join(', ')}</p>
            )}

            <Badge tone={detail.data.status === 'paid' ? 'success' : detail.data.status === 'partial' ? 'warning' : 'danger'}>
              {detail.data.status}
            </Badge>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Historique des paiements</p>
              {detail.data.payments.length === 0 && <p className="text-sm text-ink-muted">Aucun paiement enregistre.</p>}
              <ul className="space-y-2">
                {detail.data.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-control border border-border p-2.5">
                    <Icon name={PAYMENT_METHOD_ICON[p.method] || 'receipt'} className="text-accent-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{p.method_label} - {p.amount} FCFA</p>
                      <p className="text-xs text-ink-muted">
                        Recu {p.receiptNumber} - {new Date(p.receivedOn).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {detail.data.documentUrl && (
              <a
                href={detail.data.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-control bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 ring-1 ring-inset ring-primary-200 hover:bg-primary-100"
              >
                <Icon name="download" className="text-[18px]" />
                Telecharger le PDF
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant interne qui va chercher la clé de l'école avant d'afficher le bouton FedaPay
function SchoolPaymentButton({ schoolId, invoice, parent }) {
  const [pubKey, setPubKey] = useState(null)
  
  useEffect(() => {
    async function fetchKey() {
      try {
        const snap = await getDoc(doc(db, 'schools', String(schoolId)))
        if (snap.exists() && snap.data().fedaPayPublicKey) {
          setPubKey(snap.data().fedaPayPublicKey)
        } else {
          // Fallback on global if school has no key configured yet
          setPubKey(import.meta.env.VITE_FEDAPAY_PUBLIC_KEY)
        }
      } catch (e) {
        setPubKey(import.meta.env.VITE_FEDAPAY_PUBLIC_KEY)
      }
    }
    fetchKey()
  }, [schoolId])

  if (!pubKey) return <span className="text-xs text-ink-muted">Chargement du paiement...</span>

  return (
    <FedaPayButton
      publicKey={pubKey}
      amount={Number(invoice.amountDue) - Number(invoice.amountPaid || 0)}
      description={`Scolarité: ${invoice.trancheLabel || 'Facture'}`}
      customerName={`${parent.firstName} ${parent.lastName}`}
      customMetadata={{
        type: 'tuition_payment',
        invoiceId: invoice.id,
        schoolId: schoolId,
        studentMatricule: parent.matricule
      }}
      className="inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md shadow-sm border border-transparent focus-visible:ring-primary-500/30"
      onComplete={async (tx) => {
        try {
          // Import api here to avoid circular dependency if any, or use the global one if imported
          const { api, primeCsrf } = await import('../../shared/api/client.js')
          await primeCsrf()
          await api.post('/api/finance/sandbox-payment/', {
            transactionId: String(tx.id || tx.transaction_id || Date.now()),
            invoiceId: invoice.id
          })
          alert("Paiement effectué avec succès ! Le reçu a été envoyé par WhatsApp.")
          window.location.reload()
        } catch (err) {
          console.error(err)
          alert("Le paiement FedaPay a réussi, mais l'enregistrement côté école a échoué.")
        }
      }}
    >
      Payer en ligne
    </FedaPayButton>
  )
}
