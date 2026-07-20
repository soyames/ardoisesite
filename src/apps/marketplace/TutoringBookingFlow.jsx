import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { TEACHER_DB } from './TeacherDetail.jsx'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'

export default function TutoringBookingFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()
  const teacher = TEACHER_DB[id]

  const [step, setStep] = useState(1)
  const [proposedPrice, setProposedPrice] = useState(teacher?.defaultPrice || '')
  const [startDate, setStartDate] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('4')
  
  // New State for Payment
  const [paymentDate, setPaymentDate] = useState('5') // default 5th of the month
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  if (!teacher) return <div className="py-20 text-center">Teacher not found</div>

  if (status === 'loading') return null

  if (status === 'anonymous' || !user || user.role !== 'parent') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">Connexion Requise</h2>
        <p className="text-ink-muted mb-8">Vous devez être connecté en tant que parent pour réserver un tuteur.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="rounded-control bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">
            Se connecter
          </Link>
          <Link to="/register" className="rounded-control bg-primary-100 px-6 py-3 text-sm font-bold text-primary-700 hover:bg-primary-200">
            S'inscrire
          </Link>
        </div>
      </div>
    )
  }


  if (!teacher) return <div className="py-20 text-center">Teacher not found</div>

  const commission = Math.round(Number(proposedPrice) * 0.1)
  const total = Number(proposedPrice) + commission

  const handleBook = () => {
    // Mock booking logic
    alert('Contrat signé et mandat de prélèvement validé !')
    navigate('/portal') // Assume parent goes to their portal after
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">

        <div className="mb-8 flex items-center gap-4">
          <img src={teacher.image} alt={teacher.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-accent-500/20" />
          <div>
            <h1 className="text-2xl font-bold text-ink">Réservation : {teacher.name}</h1>
            <p className="text-ink-muted">{teacher.subject}</p>
          </div>
        </div>

        <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border overflow-hidden">

          {/* Stepper */}
          <div className="flex border-b border-border bg-surface/50">
            <div className={`flex-1 p-4 text-center text-sm font-semibold ${step === 1 ? 'text-primary-600 border-b-2 border-primary-600' : 'text-ink-muted'}`}>
              1. Modalités
            </div>
            <div className={`flex-1 p-4 text-center text-sm font-semibold ${step === 2 ? 'text-primary-600 border-b-2 border-primary-600' : 'text-ink-muted'}`}>
              2. Contrat & Paiement
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink">Date de début souhaitée</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2 block w-full rounded-control border-0 py-2.5 px-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Volume horaire (heures/semaine)</label>
                  <select
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    className="mt-2 block w-full rounded-control border-0 py-2.5 px-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="2">2 heures</option>
                    <option value="4">4 heures</option>
                    <option value="6">6 heures</option>
                    <option value="8">8 heures</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink">Tarif Mensuel Négocié (FCFA)</label>
                  <p className="text-xs text-ink-muted mb-2">Le tarif indicatif est de {teacher.defaultPrice} F. Modifiez-le si vous avez convenu d'un autre montant avec le tuteur.</p>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="block w-full rounded-control border-0 py-2.5 px-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!startDate || !proposedPrice}
                    className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 shadow-card hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuer vers le contrat
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="rounded-card bg-surface p-6 ring-1 ring-border">
                  <h3 className="text-lg font-bold text-ink mb-4">Contrat d'Engagement</h3>
                  <div className="space-y-4 text-sm text-ink-muted">
                    <p><strong>Parties :</strong> Ce contrat lie le Parent et M./Mme {teacher.name}.</p>
                    <p><strong>Durée :</strong> Engagement minimum obligatoire de <strong>6 mois</strong> à compter du {startDate || '...'}.</p>
                    <p className="text-danger-600 font-medium"><strong>Interdiction de Paiement Direct :</strong> Le parent s'engage formellement à <strong>ne jamais payer le tuteur de la main à la main</strong>. Tous les paiements doivent obligatoirement transiter par la plateforme Ardoise, qui se charge de rémunérer l'enseignant.</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <label className="block text-sm font-bold text-ink mb-2">Jour du prélèvement mensuel</label>
                    <p className="text-xs text-ink-muted mb-3">Choisissez la date à laquelle vous serez prélevé chaque mois. Vous recevrez un rappel par email avant chaque prélèvement automatique.</p>
                    <select
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="block w-full max-w-xs rounded-control border-0 py-2.5 px-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="1">Le 1er du mois</option>
                      <option value="5">Le 5 du mois</option>
                      <option value="10">Le 10 du mois</option>
                      <option value="15">Le 15 du mois</option>
                      <option value="25">Le 25 du mois</option>
                    </select>
                  </div>

                  <div className="mt-6 flex items-start bg-surface-raised p-4 rounded-control ring-1 ring-border">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="terms" className="ml-3 text-sm text-ink">
                      J'accepte les termes du contrat, la durée minimum de 6 mois, et j'autorise Ardoise à prélever automatiquement le montant total chaque mois le {paymentDate}.
                    </label>
                  </div>
                </div>

                <div className="rounded-card border border-border p-6">
                  <h3 className="text-lg font-bold text-ink mb-4">Détail du paiement (Mensuel)</h3>
                  <dl className="space-y-3 text-sm text-ink-muted">
                    <div className="flex justify-between">
                      <dt>Rémunération du tuteur</dt>
                      <dd className="font-semibold text-ink">{Number(proposedPrice).toLocaleString()} F</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Frais de plateforme (10%)</dt>
                      <dd className="font-semibold text-ink">{commission.toLocaleString()} F</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-base">
                      <dt className="font-bold text-ink">Prélèvement Mensuel</dt>
                      <dd className="font-bold text-primary-600">{total.toLocaleString()} F</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-control bg-surface-raised px-4 py-3 text-sm font-bold text-ink ring-1 ring-border hover:bg-surface"
                  >
                    Retour
                  </button>
                  {user ? (
                    <FedaPayButton
                      amount={total}
                      description={`Réservation Tuteur: ${teacher.name}`}
                      customerEmail={user?.email || "parent@ardoise.com"}
                      customerName={user?.name || "Parent Ardoise"}
                      customMetadata={{
                        type: 'tutoring_subscription',
                        teacherId: teacher.id,
                        parentId: user?.id || 'unknown',
                        duration: 6
                      }}
                      onComplete={async (tx) => {
                        console.log("Paiement FedaPay complété !", tx)
                        
                        try {
                          await addDoc(collection(db, 'tutoring_contracts'), {
                            teacherId: teacher.id,
                            teacherName: teacher.name,
                            parentId: user.id,
                            parentEmail: user.email,
                            parentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                            startDate,
                            hoursPerWeek: Number(hoursPerWeek),
                            proposedPrice: Number(proposedPrice),
                            commission,
                            total,
                            paymentDate: Number(paymentDate),
                            status: 'active',
                            createdAt: serverTimestamp()
                          })
                        } catch (err) {
                          console.error("Erreur lors de la sauvegarde du contrat", err)
                        }

                        setStep(3)
                      }}
                      className={`w-2/3 rounded-control px-4 py-3 text-sm font-bold shadow-card ${agreedToTerms ? 'bg-accent-500 text-primary-950 hover:bg-accent-400' : 'bg-primary-400 text-white cursor-not-allowed'}`}
                    >
                      Signer et Payer {total.toLocaleString('fr-FR')} F
                    </FedaPayButton>
                  ) : (
                    <Link
                      to="/register"
                      className="flex w-2/3 items-center justify-center rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 shadow-card hover:bg-accent-400"
                    >
                      S'inscrire ou se connecter pour payer
                    </Link>
                  )}
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="text-center py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 mb-6">
                  <svg className="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-ink mb-2">Paiement Réussi !</h2>
                <p className="text-ink-muted mb-8 max-w-md mx-auto">
                  Votre abonnement pour {teacher.name} est confirmé. Vous recevrez très bientôt un email avec les détails de la première séance.
                </p>
                <Link
                  to="/"
                  className="inline-flex justify-center rounded-control bg-accent-500 px-6 py-3 text-sm font-bold text-primary-950 shadow-card hover:bg-accent-400"
                >
                  Retour à l'accueil
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
