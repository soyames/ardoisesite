import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TEACHER_DB } from './TeacherDetail.jsx'

export default function TutoringBookingFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const teacher = TEACHER_DB[id]

  const [step, setStep] = useState(1)
  const [proposedPrice, setProposedPrice] = useState(teacher?.defaultPrice || '')
  const [startDate, setStartDate] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('4')
  
  // New State for Payment
  const [paymentDate, setPaymentDate] = useState('5') // default 5th of the month
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  if (!teacher) return <div className="py-20 text-center">Teacher not found</div>

  const commission = Math.round(Number(proposedPrice) * 0.1)
  const total = Number(proposedPrice) + commission

  const handleBook = () => {
    // Mock booking logic
    alert('Contrat signé et mandat de prélèvement validé !')
    navigate('/portal') // Assume parent goes to their portal after
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        
        <div className="mb-8 flex items-center gap-4">
          <img src={teacher.image} alt={teacher.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500/20" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Réservation : {teacher.name}</h1>
            <p className="text-slate-500">{teacher.subject}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          
          {/* Stepper */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <div className={`flex-1 p-4 text-center text-sm font-semibold ${step === 1 ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
              1. Modalités
            </div>
            <div className={`flex-1 p-4 text-center text-sm font-semibold ${step === 2 ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
              2. Contrat & Paiement
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date de début souhaitée</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-2 block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Volume horaire (heures/semaine)</label>
                  <select 
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    className="mt-2 block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                  >
                    <option value="2">2 heures</option>
                    <option value="4">4 heures</option>
                    <option value="6">6 heures</option>
                    <option value="8">8 heures</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tarif Mensuel Négocié (FCFA)</label>
                  <p className="text-xs text-slate-500 mb-2">Le tarif indicatif est de {teacher.defaultPrice} F. Modifiez-le si vous avez convenu d'un autre montant avec le tuteur.</p>
                  <input 
                    type="number" 
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!startDate || !proposedPrice}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuer vers le contrat
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Contrat d'Engagement</h3>
                  <div className="space-y-4 text-sm text-slate-600">
                    <p><strong>Parties :</strong> Ce contrat lie le Parent et M./Mme {teacher.name}.</p>
                    <p><strong>Durée :</strong> Engagement minimum obligatoire de <strong>6 mois</strong> à compter du {startDate || '...'}.</p>
                    <p className="text-red-600 font-medium"><strong>Interdiction de Paiement Direct :</strong> Le parent s'engage formellement à <strong>ne jamais payer le tuteur de la main à la main</strong>. Tous les paiements doivent obligatoirement transiter par la plateforme Ardoise, qui se charge de rémunérer l'enseignant.</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <label className="block text-sm font-bold text-slate-900 mb-2">Jour du prélèvement mensuel</label>
                    <p className="text-xs text-slate-500 mb-3">Choisissez la date à laquelle vous serez prélevé chaque mois. Vous recevrez un rappel par email avant chaque prélèvement automatique.</p>
                    <select 
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="block w-full max-w-xs rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    >
                      <option value="1">Le 1er du mois</option>
                      <option value="5">Le 5 du mois</option>
                      <option value="10">Le 10 du mois</option>
                      <option value="15">Le 15 du mois</option>
                      <option value="25">Le 25 du mois</option>
                    </select>
                  </div>
                  
                  <div className="mt-6 flex items-start bg-white p-4 rounded-lg ring-1 ring-slate-200">
                    <input 
                      id="terms" 
                      type="checkbox" 
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" 
                    />
                    <label htmlFor="terms" className="ml-3 text-sm text-slate-700">
                      J'accepte les termes du contrat, la durée minimum de 6 mois, et j'autorise Ardoise à prélever automatiquement le montant total chaque mois le {paymentDate}.
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Détail du paiement (Mensuel)</h3>
                  <dl className="space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <dt>Rémunération du tuteur</dt>
                      <dd className="font-semibold text-slate-900">{Number(proposedPrice).toLocaleString()} F</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Frais de plateforme (10%)</dt>
                      <dd className="font-semibold text-slate-900">{commission.toLocaleString()} F</dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                      <dt className="font-bold text-slate-900">Prélèvement Mensuel</dt>
                      <dd className="font-bold text-indigo-600">{total.toLocaleString()} F</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    Retour
                  </button>
                  <button 
                    onClick={handleBook}
                    disabled={!agreedToTerms}
                    className="w-2/3 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Signer et Activer le prélèvement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
