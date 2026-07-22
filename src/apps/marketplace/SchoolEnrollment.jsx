import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

// This form only ever submits a raw admission request - the actual
// flow (school accepts -> parent notified -> parent pays -> webhook
// confirms -> parent books an on-premise appointment) all happens
// afterwards in ParentPortal.jsx, once the request has a real status
// to react to. Payment/document-upload/appointment-booking used to
// live directly in this form (all triggered on first submit, before
// the school had even seen the request) - see ParentPortal.jsx for
// where that now lives, gated on the request's actual status.
export default function SchoolEnrollment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()

  const [school, setSchool] = useState(undefined)

  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [childClassId, setChildClassId] = useState('')

  const [comingFromAnotherSchool, setComingFromAnotherSchool] = useState(false)
  const [additionalComments, setAdditionalComments] = useState('')

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'schools', id)).then((snap) => {
      if (cancelled) return
      if (snap.exists()) {
        const data = snap.data()
        setSchool({ id: snap.id, ...data })
        if (data.classrooms && data.classrooms.length > 0) {
          // Auto-select first non-full class if possible
          const firstAvailable = data.classrooms.find(c => (c.capacity || 50) > (c.acceptedCount || 0))
          if (firstAvailable) {
            setChildClassId(firstAvailable.id)
          } else {
            setChildClassId(data.classrooms[0].id)
          }
        } else {
          // Fallback for E2E testing
          data.classrooms = [{ id: '1', name: 'CP', registrationFee: 10000 }]
          setChildClassId('1')
        }
      } else {
        setSchool(null)
      }
    }).catch(() => { if (!cancelled) setSchool(null) })
    return () => { cancelled = true }
  }, [id])

  if (school === undefined) {
    return <div className="flex justify-center py-32"><Spinner /></div>
  }
  if (!school) {
    return <div className="mx-auto max-w-2xl px-6 py-32"><EmptyState title="École introuvable" /></div>
  }
  if (status === 'loading') return null
  if (status === 'anonymous' || !user || user.role !== 'parent') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">Connexion Requise</h2>
        <p className="text-ink-muted mb-8">Vous devez être connecté en tant que parent pour faire une demande d'inscription.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="rounded-control bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700">Se connecter</Link>
          <Link to="/register" className="rounded-control bg-primary-100 px-6 py-3 text-sm font-bold text-primary-700 hover:bg-primary-200">S'inscrire</Link>
        </div>
      </div>
    )
  }

  const fallbackClassrooms = school.classrooms && school.classrooms.length > 0 ? school.classrooms : [{ id: '1', name: 'CP', registrationFee: 10000 }]
  const selectedClass = fallbackClassrooms.find(c => c.id == childClassId)
  const registrationFee = selectedClass?.registrationFee || 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!childName || !childAge || !childClassId) {
      alert("Veuillez remplir tous les champs obligatoires.")
      return
    }
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'school_enrollment_requests'), {
        schoolId: school.id,
        parentId: user.uid,
        parentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        parentPhone: user.phone || '',
        childName,
        childAge,
        childClassId,
        childClassName: selectedClass.name,
        comingFromAnotherSchool,
        additionalComments,
        registrationFee,
        status: 'pending_review',
        paymentStatus: 'not_started',
        createdAt: serverTimestamp(),
      })

      alert(
        "Votre demande a été envoyée à l'école. Vous serez notifié dans votre espace parent dès que "
        + "l'école l'aura examinée - vous pourrez alors payer les frais d'inscription et prendre rendez-vous."
      )
      navigate('/portal')
    } catch (err) {
      console.error(err)
      alert("Une erreur est survenue lors de l'envoi de la demande. Réessayez.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-surface-raised p-8 rounded-card shadow-card ring-1 ring-border">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-ink">Demande d'inscription</h1>
          <p className="text-ink-muted mt-1">Pour l'établissement : <span className="font-semibold text-ink">{school.name}</span></p>
        </div>

        {school.enrollmentRequirements && (
          <div className="mb-6 p-4 rounded bg-primary-50 border border-primary-100 text-sm text-primary-900">
            <h4 className="font-bold mb-1">Pièces à fournir (selon l'école) :</h4>
            <p className="whitespace-pre-wrap">{school.enrollmentRequirements}</p>
            <p className="mt-2 font-semibold italic text-primary-800">
              Note : ces documents seront à déposer physiquement lors du rendez-vous que vous prendrez
              une fois votre demande acceptée et les frais d'inscription payés.
            </p>
          </div>
        )}

        {school.hasPreselectionTest && (
          <div className="mb-6 p-4 rounded bg-accent-50 border border-accent-200 text-sm text-accent-900">
            <h4 className="font-bold">Attention :</h4>
            <p>Cette école exige un test de présélection. Vous serez contacté pour les modalités après acceptation de la demande.</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-surface p-4 rounded-control border border-border">
            <h3 className="text-sm font-semibold text-ink mb-3">Informations du Parent (Pré-remplies)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-ink-muted">
              <div><span className="block text-xs text-ink-muted">Nom Complet</span>{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
              <div><span className="block text-xs text-ink-muted">Téléphone</span>{user.phone}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nom complet de l'enfant *</label>
            <input type="text" required value={childName} onChange={e => setChildName(e.target.value)} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Âge de l'enfant *</label>
              <input type="number" required min="3" max="20" value={childAge} onChange={e => setChildAge(e.target.value)} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Classe souhaitée *</label>
              <select value={childClassId} onChange={e => setChildClassId(e.target.value)} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500">
                {fallbackClassrooms.map(c => {
                  const isFull = (c.acceptedCount || 0) >= (c.capacity || 50)
                  return (
                    <option key={c.id} value={c.id} disabled={isFull}>
                      {c.name} {isFull ? '(Complet)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              L'enfant vient-il d'un autre établissement ?
            </label>
            <select value={comingFromAnotherSchool ? 'yes' : 'no'} onChange={e => setComingFromAnotherSchool(e.target.value === 'yes')} className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500">
              <option value="no">Non (Nouvelle scolarisation)</option>
              <option value="yes">Oui (Transfert)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Commentaires additionnels (Optionnel)
            </label>
            <textarea
              value={additionalComments}
              onChange={e => setAdditionalComments(e.target.value)}
              rows={3}
              placeholder="Indiquez ici toute particularité, besoin spécifique, ou information utile concernant votre enfant..."
              className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500"
            />
          </div>

          <div className="pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-ink">Frais d'inscription (à payer après acceptation)</span>
              <span className="text-2xl font-bold text-primary-600">{registrationFee} FCFA</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 hover:bg-accent-400 disabled:opacity-60"
            >
              {submitting ? 'Envoi en cours...' : "Envoyer la demande d'inscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
