import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
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
            <ChildDetail key={selectedChild.id} child={selectedChild} parentId={user?.parentId} parent={user} />
          )}
        </>
      )}

      {/* Child Profiles (Marketplace Accounts) */}
      <ChildProfiles parentId={user?.uid} />

      {/* Payment History Section - the one place that answers "everything I've paid Ardoise" */}
      <PaymentHistory parentId={user?.uid} djangoParentId={user?.parentId} />

      {/* Enrollment Requests Section */}
      <EnrollmentRequests parentId={user?.uid} />

      {/* Tutoring Contracts Section */}
      <TutoringContracts parentId={user?.uid} />

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

const PAYMENT_TYPE_ICON = { tuition: 'school', tutoring: 'menu_book', enrollment: 'how_to_reg' }

/**
 * Parents had no single place to see everything they've paid Ardoise
 * for - tuition (Django, per-child), tutoring subscriptions and
 * enrollment fees (Firestore) each lived in their own section with no
 * shared view. This merges all three into one reverse-chronological
 * list. Tuition needs the Django-side numeric guardian id (only set
 * once a school has actually accepted an enrollment and created a
 * Django user for this parent) - skipped entirely until that exists,
 * same gating ChildDetail already uses for invoices.
 */
function PaymentHistory({ parentId, djangoParentId }) {
  const invoices = useApiGet(djangoParentId ? `/api/finance/invoices/?parent=${djangoParentId}` : null, {
    skip: !djangoParentId,
  })
  const [contracts, setContracts] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loadingFirestore, setLoadingFirestore] = useState(true)

  useEffect(() => {
    if (!parentId) return
    const unsubContracts = onSnapshot(
      query(collection(db, 'tutoring_contracts'), where('parentId', '==', parentId)),
      (snap) => {
        const rows = []
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }))
        setContracts(rows)
        setLoadingFirestore(false)
      },
      (err) => { console.error('tutoring_contracts read failed:', err); setLoadingFirestore(false) }
    )
    const unsubEnrollments = onSnapshot(
      query(collection(db, 'school_enrollment_requests'), where('parentId', '==', parentId), where('paymentStatus', '==', 'paid_on_ardoise')),
      (snap) => {
        const rows = []
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }))
        setEnrollments(rows)
      },
      (err) => console.error('school_enrollment_requests (paid) read failed:', err)
    )
    return () => { unsubContracts(); unsubEnrollments() }
  }, [parentId])

  const rows = useMemo(() => {
    const tuitionRows = (invoices.data || [])
      .filter((inv) => Number(inv.amountPaid) > 0)
      .map((inv) => ({
        id: `inv-${inv.id}`,
        type: 'tuition',
        label: inv.trancheLabel || `Facture #${inv.id}`,
        amount: inv.amountPaid,
        dateMs: inv.dueDate ? new Date(inv.dueDate).getTime() : 0,
        dateLabel: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR') : '-',
        badge: inv.status === 'paid' ? { tone: 'success', label: 'Payé' } : { tone: 'warning', label: 'Partiel' },
      }))
    const tutoringRows = contracts.map((c) => ({
      id: `contract-${c.id}`,
      type: 'tutoring',
      label: `Tutorat - ${c.teacherName || 'Tuteur'}`,
      amount: c.total,
      dateMs: c.createdAt?.toMillis?.() || 0,
      dateLabel: c.createdAt?.toDate?.().toLocaleDateString('fr-FR') || '-',
      badge: { tone: c.status === 'active' ? 'success' : 'neutral', label: c.status === 'active' ? 'Abonnement actif (mensuel)' : c.status },
    }))
    const enrollmentRows = enrollments.map((e) => ({
      id: `enroll-${e.id}`,
      type: 'enrollment',
      label: `Inscription - ${e.childName}`,
      amount: e.registrationFee,
      dateMs: e.createdAt?.toMillis?.() || 0,
      dateLabel: e.createdAt?.toDate?.().toLocaleDateString('fr-FR') || '-',
      badge: { tone: 'success', label: 'Payé' },
    }))
    return [...tuitionRows, ...tutoringRows, ...enrollmentRows].sort((a, b) => b.dateMs - a.dateMs)
  }, [invoices.data, contracts, enrollments])

  const loading = invoices.loading || loadingFirestore
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  if (!loading && rows.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Mes Paiements</h2>
        {!loading && rows.length > 0 && (
          <span className="text-sm font-semibold text-ink-muted">Total : {total.toLocaleString('fr-FR')} FCFA</span>
        )}
      </div>
      <Card>
        <CardBody className="p-0">
          {loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {!loading && (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                    <Icon name={PAYMENT_TYPE_ICON[r.type]} className="text-[20px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.label}</p>
                    <p className="text-xs text-ink-muted">{r.dateLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-ink">{Number(r.amount).toLocaleString('fr-FR')} FCFA</span>
                    <Badge tone={r.badge.tone}>{r.badge.label}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

const ENROLLMENT_STATUS_BADGE = {
  pending_review: { tone: 'neutral', label: 'En attente d\'examen' },
  docs: { tone: 'neutral', label: 'Documents en cours' },
  interviewed: { tone: 'info', label: 'Entretien effectué' },
  waitlisted: { tone: 'neutral', label: 'Liste d\'attente' },
  accepted: { tone: 'success', label: 'Acceptée' },
  rejected: { tone: 'danger', label: 'Refusée' },
  paid_awaiting_appointment: { tone: 'warning', label: 'Rendez-vous à prendre' },
  appointment_booked: { tone: 'success', label: 'Rendez-vous confirmé' },
  enrolled: { tone: 'success', label: 'Inscription finalisée' },
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
    }, (err) => { console.error('school_enrollment_requests read failed:', err); setLoading(false) })
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
                <Badge tone={ENROLLMENT_STATUS_BADGE[req.status]?.tone || 'neutral'}>
                  {ENROLLMENT_STATUS_BADGE[req.status]?.label || 'En cours d\'examen'}
                </Badge>
              </div>
              {req.additionalComments && (
                <div className="mt-2 text-sm text-ink-muted bg-surface p-2 rounded">
                  <p className="font-medium">Vos commentaires :</p>
                  <p className="whitespace-pre-wrap">{req.additionalComments}</p>
                </div>
              )}
              {req.status === 'accepted' && req.paymentStatus !== 'paid_on_ardoise' && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-sm text-success-700 bg-success-50 p-2 rounded mb-2">
                    Votre demande a été acceptée ! Payez les frais d'inscription pour continuer.
                  </p>
                  <EnrollmentPaymentButton request={req} />
                </div>
              )}
              {req.paymentStatus === 'paid_on_ardoise' && req.status !== 'enrolled' && (
                <EnrollmentAppointmentPicker request={req} />
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function EnrollmentAppointmentPicker({ request }) {
  const [school, setSchool] = useState(null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  // Optimistic flag for the moment right after a successful booking -
  // request.status itself only flips to 'appointment_booked' once the
  // Worker's status-update round trip lands and this component's parent
  // onSnapshot listener re-renders with the fresh doc (a second or two),
  // same pattern as payment confirmation elsewhere in this file.
  const [justBooked, setJustBooked] = useState(null)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'schools', request.schoolId)).then((snap) => {
      if (cancelled) return
      if (snap.exists()) {
        setSchool({ id: snap.id, ...snap.data() })
      }
    })
    return () => { cancelled = true }
  }, [request.schoolId])

  useEffect(() => {
    if (!school?.backendUrl || !appointmentDate) {
      setAvailableSlots([])
      setSelectedSlotId('')
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    // school.id here is the Firestore doc id, not this install's own
    // Django School.id - the backend only uses it as a presence check
    // now (this install's database is single-tenant), see
    // PublicAvailableAppointmentsView's own docstring.
    fetch(`${school.backendUrl}/api/students/appointments/public/available/?school_id=${school.id}&date=${appointmentDate}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setAvailableSlots(Array.isArray(data) ? data : data.results || [])
      })
      .catch(e => console.error("Error fetching slots", e))
      .finally(() => { if (!cancelled) setLoadingSlots(false) })
    return () => { cancelled = true }
  }, [school?.backendUrl, school?.id, appointmentDate])

  const handleBook = async () => {
    if (!school?.backendUrl || !selectedSlotId) return
    setBooking(true)
    try {
      const res = await fetch(`${school.backendUrl}/api/students/appointments/public/${selectedSlotId}/book/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: school.id,
          marketplace_request_id: request.id,
          candidate_name: request.childName
        })
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.message || data.error || "Ce créneau vient d'être réservé. Veuillez en choisir un autre.")
        return
      }

      // The Django endpoint itself reports appointment_booked back to
      // Firestore via the signed Worker bridge - nothing to write
      // client-side (that used to be a direct updateDoc() here, which
      // firestore.rules now rejects for every role, parent included).
      const slot = availableSlots.find((s) => String(s.id) === String(selectedSlotId))
      setJustBooked({ date: appointmentDate, startTime: slot?.startTime?.substring(0, 5), endTime: slot?.endTime?.substring(0, 5) })
    } catch (e) {
      console.error(e)
      alert("Erreur de connexion.")
    } finally {
      setBooking(false)
    }
  }

  if (justBooked || request.status === 'appointment_booked') {
    return (
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-sm font-semibold text-success-700 bg-success-50 p-2 rounded">
          {justBooked
            ? `Rendez-vous confirmé pour le ${justBooked.date}${justBooked.startTime ? ` (${justBooked.startTime} - ${justBooked.endTime})` : ''}`
            : 'Rendez-vous confirmé - présentez-vous à l\'école avec vos documents à la date convenue.'}
        </p>
      </div>
    )
  }

  if (!school) return <div className="mt-3 border-t border-border pt-3 text-sm text-ink-muted">Chargement de l'école...</div>

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-sm font-semibold mb-2">Prendre rendez-vous pour le dépôt des dossiers :</p>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <input
          type="date"
          value={appointmentDate}
          onChange={e => setAppointmentDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="rounded-control border border-border p-2 text-sm focus:border-primary-500"
        />
        <select
          value={selectedSlotId}
          onChange={e => setSelectedSlotId(e.target.value)}
          disabled={!appointmentDate || loadingSlots || availableSlots.length === 0}
          className="flex-1 rounded-control border border-border p-2 text-sm focus:border-primary-500"
        >
          <option value="">
            {!appointmentDate ? 'Choisissez une date' :
             loadingSlots ? 'Chargement...' :
             availableSlots.length === 0 ? 'Aucun créneau' : 'Sélectionnez un créneau'}
          </option>
          {availableSlots.map(slot => (
            <option key={slot.id} value={slot.id}>{slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}</option>
          ))}
        </select>
      </div>
      <Button
        onClick={handleBook}
        disabled={!selectedSlotId || booking}
        size="sm"
        className="w-full sm:w-auto"
      >
        {booking ? 'Réservation...' : 'Confirmer le rendez-vous'}
      </Button>
    </div>
  )
}

/**
 * The parent's own trigger for the admission fee - only shown once the
 * school has accepted the request (see the accepted-status gate above).
 * SchoolEnrollment.jsx used to start this payment immediately on
 * submission, before the school had even seen the request; that step
 * moved here so accepting genuinely comes first.
 */
function EnrollmentPaymentButton({ request }) {
  const { user } = useAuth()

  return (
    <FedaPayButton
      // Ardoise collects the registration fee on the school's behalf
      // (the school sets the amount, the school is owed it later - see
      // the ardoise-api webhook's school_payouts_owed ledger) - always
      // the platform key, same as the original SchoolEnrollment.jsx
      // payment. A school's own fedaPayPublicKey is only ever used for
      // tuition (SchoolPaymentButton below), which is the school's own
      // money that never touches Ardoise at all.
      amount={request.registrationFee}
      description={`Frais d'inscription pour ${request.childName} en ${request.childClassName}`}
      customerEmail={user?.email}
      customerFirstname={user?.firstName}
      customerLastname={user?.lastName}
      customerPhoneNumber={user?.phone || request.parentPhone}
      customMetadata={{ type: 'enrollment_registration_fee', enrollmentRequestId: request.id, schoolId: request.schoolId }}
      onComplete={() => {
        // The signed FedaPay webhook (ardoise-api) is now the only
        // writer of status/paymentStatus on this doc - see firestore.rules.
        // This listener's own onSnapshot picks up that update within a
        // second or two; nothing to write client-side any more.
      }}
      className="rounded-control bg-accent-500 px-4 py-2 text-sm font-bold text-primary-950 shadow-sm hover:bg-accent-400"
    >
      Payer les frais d'inscription ({request.registrationFee} FCFA)
    </FedaPayButton>
  )
}

function TutoringContracts({ parentId }) {
  const [contracts, setContracts] = useState([])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentId) return
    
    // Fetch contracts
    const q = query(collection(db, 'tutoring_contracts'), where('parentId', '==', parentId))
    const unsub = onSnapshot(q, (snap) => {
      const data = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
      setContracts(data)
      setLoading(false)
    }, (err) => { console.error('tutoring_contracts read failed:', err); setLoading(false) })
    
    // Fetch child profiles
    const qChildren = query(collection(db, 'users'), where('parentId', '==', parentId), where('role', '==', 'marketplace_student'))
    const unsubChildren = onSnapshot(qChildren, (snap) => {
      const data = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setChildren(data)
    })

    return () => { unsub(); unsubChildren() }
  }, [parentId])

  const handleAssignChild = async (contractId, childId) => {
    try {
      await updateDoc(doc(db, 'tutoring_contracts', contractId), { studentId: childId || null })
    } catch (err) {
      console.error('Error assigning child:', err)
      alert('Erreur lors de l\'assignation.')
    }
  }

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
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="text-sm">
                  <label className="text-ink-muted block text-xs mb-1">Assigner à :</label>
                  <select 
                    value={contract.studentId || ''} 
                    onChange={(e) => handleAssignChild(contract.id, e.target.value)}
                    className="rounded-control border-border py-1 px-2 text-sm max-w-[150px]"
                  >
                    <option value="">Non assigné</option>
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 items-center">
                  <Link
                    to={`/live-room/contract-${contract.id}`}
                    className="text-primary-700 hover:text-primary-800 font-semibold flex items-center gap-1 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">video_call</span>
                    Rejoindre l'appel
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ChildDetail({ child, parentId, parent }) {
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
                        parent={parent}
                        studentMatricule={child.matricule}
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
                      <p className="text-sm text-ink">{p.methodLabel} - {p.amount} FCFA</p>
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
function SchoolPaymentButton({ schoolId, invoice, parent, studentMatricule }) {
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
      customerEmail={parent?.email}
      customerFirstname={parent?.firstName}
      customerLastname={parent?.lastName}
      customerPhoneNumber={parent?.phone}
      customMetadata={{
        type: 'tuition_payment',
        invoiceId: invoice.id,
        schoolId: schoolId,
        studentMatricule
      }}
      className="inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md shadow-sm border border-transparent focus-visible:ring-primary-500/30"
      onComplete={() => {
        // The school's own signed FedaPay webhook (apps/finance/webhooks.py)
        // is now the only writer of the Payment/Invoice record - the client
        // used to self-report success straight to /api/finance/sandbox-payment/,
        // an insecure endpoint that trusted whatever the browser POSTed with
        // no server-to-server verification at all.
        alert("Paiement envoyé ! Le reçu sera visible ici dès la confirmation du paiement (quelques secondes).")
        window.location.reload()
      }}
    >
    </FedaPayButton>
  )
}

function ChildProfiles({ parentId }) {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!parentId) return
    const q = query(collection(db, 'users'), where('parentId', '==', parentId), where('role', '==', 'marketplace_student'))
    const unsub = onSnapshot(q, (snap) => {
      const data = []
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }))
      setChildren(data)
      setLoading(false)
    }, (err) => { console.error('child profiles read failed:', err); setLoading(false) })
    return () => unsub()
  }, [parentId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/marketplace/child-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création')
      setShowModal(false)
      setForm({ firstName: '', lastName: '', username: '', password: '' })
    } catch (err) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Comptes Élèves (Soutien Scolaire)</h2>
        <Button onClick={() => setShowModal(true)} size="sm">Créer un profil</Button>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardBody className="text-center py-6 text-sm text-ink-muted">
            Aucun compte élève. Créez-en un pour permettre à votre enfant de se connecter et rejoindre ses cours de tutorat.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {children.map(child => (
            <Card key={child.id} className="border border-border">
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 font-bold">
                    {child.firstName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-ink-muted">Identifiant : {child.email?.split('@')[0]}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card bg-surface p-6 shadow-xl ring-1 ring-border">
            <h3 className="text-lg font-bold text-ink mb-4">Nouveau Profil Élève</h3>
            {error && <div className="mb-4 rounded bg-danger-50 p-3 text-sm text-danger-700">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Prénom</label>
                  <input type="text" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full rounded-control border border-border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">Nom</label>
                  <input type="text" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full rounded-control border border-border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Identifiant de connexion</label>
                <input type="text" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="ex: marc.dupont" className="w-full rounded-control border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Mot de passe</label>
                <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={6} className="w-full rounded-control border border-border px-3 py-2 text-sm" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Création...' : 'Créer le profil'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
