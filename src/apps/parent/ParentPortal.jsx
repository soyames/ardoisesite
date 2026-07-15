import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

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
                {child.first_name} {child.last_name}
              </Button>
            ))}
          </div>

          {selectedChild && (
            <ChildDetail key={selectedChild.id} child={selectedChild} parentId={user?.parent_id} />
          )}
        </>
      )}
    </div>
  )
}

function ChildDetail({ child, parentId }) {
  const enrollmentId = child.current_enrollment?.id
  const bulletins = useApiGet(enrollmentId ? `/api/academics/bulletins/?enrollment=${enrollmentId}` : null, {
    skip: !enrollmentId,
  })
  const attendance = useApiGet(enrollmentId ? `/api/academics/attendance/?enrollment=${enrollmentId}` : null, {
    skip: !enrollmentId,
  })
  const discipline = useApiGet(enrollmentId ? `/api/academics/discipline/list/?enrollment=${enrollmentId}` : null, {
    skip: !enrollmentId,
  })
  const invoices = useApiGet(parentId ? `/api/finance/invoices/?parent=${parentId}&student_matricule=${child.matricule}` : null, {
    skip: !parentId,
  })

  const absenceCount = attendance.data?.filter((a) => a.state.startsWith('absent')).length ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {child.first_name} {child.last_name}
            </p>
            <p className="text-xs text-ink-muted">
              {child.current_enrollment?.classroom_name} · {child.current_enrollment?.academic_year_label} · Matricule {child.matricule}
            </p>
          </div>
          <Badge tone="neutral">{child.relation}</Badge>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Bulletins" subtitle="Publies par l'ecole" />
          <CardBody>
            {bulletins.loading && <Spinner />}
            {!bulletins.loading && (!bulletins.data || bulletins.data.length === 0) && (
              <EmptyState title="Aucun bulletin publie pour l'instant" />
            )}
            <ul className="space-y-2">
              {bulletins.data?.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-control border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{b.exam_period_label}</p>
                    <p className="text-xs text-ink-muted">
                      Moyenne {b.average} · Rang {b.class_rank}/{b.class_size}
                    </p>
                  </div>
                  <Badge tone="success">Publie</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Presence" subtitle={`${absenceCount} absence(s) enregistree(s)`} />
          <CardBody>
            {attendance.loading && <Spinner />}
            {!attendance.loading && (!attendance.data || attendance.data.length === 0) && (
              <EmptyState title="Aucun enregistrement de presence" />
            )}
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {attendance.data?.slice(0, 20).map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-control border border-border p-3">
                  <p className="text-sm text-ink">{a.date}</p>
                  <Badge tone={a.state === 'present' ? 'success' : a.state.startsWith('absent') ? 'danger' : 'warning'}>
                    {a.state}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Discipline" subtitle="Mesures approuvees" />
          <CardBody>
            {discipline.loading && <Spinner />}
            {!discipline.loading && (!discipline.data || discipline.data.length === 0) && (
              <EmptyState title="Aucune mesure disciplinaire" description="C'est une bonne nouvelle." />
            )}
            <ul className="space-y-2">
              {discipline.data?.map((d) => (
                <li key={d.id} className="rounded-control border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{d.measure}</p>
                    <Badge tone="warning">{d.date}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{d.reason}</p>
                </li>
              ))}
            </ul>
          </CardBody>
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
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-ink">{inv.tranche_label || `Facture #${inv.id}`}</p>
                      <p className="text-xs text-ink-muted">{inv.amount_due} FCFA</p>
                    </div>
                    <Badge tone={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                      {inv.status}
                    </Badge>
                  </div>
                  {inv.status !== 'paid' && (
                    <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
                      <SchoolPaymentButton 
                        schoolId={child.current_enrollment?.school_id || 1} 
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

  if (!pubKey) return <span className="text-xs text-slate-400">Chargement du paiement...</span>

  return (
    <FedaPayButton
      publicKey={pubKey}
      amount={Number(invoice.amount_due) - Number(invoice.amount_paid || 0)}
      description={`Scolarité: ${invoice.tranche_label || 'Facture'}`}
      customerName={`${parent.first_name} ${parent.last_name}`}
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
