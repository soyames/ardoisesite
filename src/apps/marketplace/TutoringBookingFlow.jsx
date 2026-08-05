import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { doc, getDoc, addDoc, collection } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import Spinner from '../../shared/ui/Spinner.jsx'

/**
 * The parent-tutor contract (schedule, hours, agreed rate) is still a
 * real record - see ParentPortal.jsx's "Mes Cours de Soutien" and
 * TeacherMarketplaceDashboard.jsx's "Mes Contrats", both of which read
 * this collection. What changed (2026-07 paywall/revenue-model pivot)
 * is who handles payment: Ardoise no longer sits in the middle
 * (parent paid Ardoise, Ardoise paid the tutor, 10% commission) - the
 * parent and tutor agree and settle the proposedPrice directly, off
 * -platform, however they prefer. This form just records the terms
 * both sides agreed to, so the relationship still shows up on both
 * dashboards; it's not a payment form anymore.
 */
export default function TutoringBookingFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()
  const [teacher, setTeacher] = useState(undefined) // undefined = loading, null = not found

  const [step, setStep] = useState(1)
  const [proposedPrice, setProposedPrice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('4')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.ardoiseeduc.com/api/marketplace/public/teachers/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(json => {
        if (cancelled) return
        if (json.data) {
          const data = json.data
          const loaded = {
            id: data.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
            subject: data.subject || '',
            image: data.image || null,
            defaultPrice: data.price || 0,
          }
          setTeacher(loaded)
          setProposedPrice(loaded.defaultPrice || '')
        } else {
          setTeacher(null)
        }
      })
      .catch(() => { if (!cancelled) setTeacher(null) })
    return () => { cancelled = true }
  }, [id])

  if (teacher === undefined || status === 'loading') {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  if (!teacher) return <div className="py-20 text-center">Teacher not found</div>

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

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'tutoring_contracts'), {
        teacherId: teacher.id,
        teacherName: teacher.name,
        parentId: user.uid,
        parentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        parentEmail: user?.email || '',
        startDate,
        hoursPerWeek: Number(hoursPerWeek),
        proposedPrice: Number(proposedPrice),
        status: 'active',
        createdAt: new Date().toISOString(),
      })
      setStep(3)
    } catch (err) {
      console.error('Failed to create tutoring contract:', err)
      setError("Impossible d'enregistrer l'accord. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">

        <div className="mb-8 flex items-center gap-4">
          {teacher.image ? (
            <img src={teacher.image} alt={teacher.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-accent-500/20" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl ring-2 ring-accent-500/20">👤</div>
          )}
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
              2. Confirmation
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
                <p className="text-xs text-ink-muted">
                  Ardoise ne prend aucune commission et n'intervient pas dans le paiement - vous réglez {teacher.name}
                  directement, selon le mode de paiement de votre choix. Ceci enregistre simplement les modalités
                  convenues pour que vous les retrouviez tous les deux dans votre espace.
                </p>

                <div className="pt-6">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!startDate || !proposedPrice}
                    className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 shadow-card hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="rounded-card bg-surface p-6 ring-1 ring-border">
                  <h3 className="text-lg font-bold text-ink mb-4">Récapitulatif</h3>
                  <dl className="space-y-3 text-sm text-ink-muted">
                    <div className="flex justify-between">
                      <dt>Tuteur</dt>
                      <dd className="font-semibold text-ink">{teacher.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Début</dt>
                      <dd className="font-semibold text-ink">{startDate}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Volume horaire</dt>
                      <dd className="font-semibold text-ink">{hoursPerWeek}h/semaine</dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-3 text-base">
                      <dt className="font-bold text-ink">Tarif mensuel convenu</dt>
                      <dd className="font-bold text-primary-600">{Number(proposedPrice).toLocaleString()} F</dd>
                    </div>
                  </dl>
                </div>

                {error && <p className="text-sm text-danger-600">{error}</p>}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-control bg-surface-raised px-4 py-3 text-sm font-bold text-ink ring-1 ring-border hover:bg-surface"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-2/3 rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 shadow-card hover:bg-accent-400 disabled:opacity-50"
                  >
                    {submitting ? 'Enregistrement...' : 'Confirmer l\'accord'}
                  </button>
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
                <h2 className="text-2xl font-bold text-ink mb-2">Accord enregistré !</h2>
                <p className="text-ink-muted mb-8 max-w-md mx-auto">
                  Votre accord avec {teacher.name} est enregistré. Retrouvez-le dans votre espace parent, et
                  convenez du règlement directement avec {teacher.name}.
                </p>
                <button
                  onClick={() => navigate('/portal')}
                  className="inline-flex justify-center rounded-control bg-accent-500 px-6 py-3 text-sm font-bold text-primary-950 shadow-card hover:bg-accent-400"
                >
                  Aller à mon espace
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
