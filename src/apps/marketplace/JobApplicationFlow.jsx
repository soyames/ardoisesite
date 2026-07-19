import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

export default function JobApplicationFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()

  const [job, setJob] = useState(undefined) // undefined = loading, null = not found

  const [motivation, setMotivation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'jobs', id)).then((snap) => {
      if (cancelled) return
      setJob(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    }).catch(() => { if (!cancelled) setJob(null) })
    return () => { cancelled = true }
  }, [id])

  if (job === undefined) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32">
        <EmptyState title="Offre introuvable" />
      </div>
    )
  }

  if (status === 'loading') return null

  if (status === 'anonymous' || !user || user.role !== 'teacher') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">Connexion Requise</h2>
        <p className="text-ink-muted mb-8">Vous devez être connecté en tant que professeur pour postuler à cette offre.</p>
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'job_applications'), {
        jobId: job.id,
        jobTitle: job.title,
        schoolId: job.schoolId,
        teacherId: user.uid,
        teacherName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        email: user.email,
        motivation,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      alert('Candidature envoyée avec succès ! L\'école vous contactera bientôt.')
      navigate('/portal') // Redirect teacher to their portal/dashboard
    } catch (err) {
      console.error(err)
      alert('Une erreur est survenue lors de l\'envoi de la candidature. Réessayez.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-surface-raised p-8 rounded-card shadow-card ring-1 ring-border">
        <div className="mb-8 border-b border-border pb-6 flex items-center gap-6">
          {job.schoolImage && <img src={job.schoolImage} alt={job.schoolName} className="h-16 w-16 rounded-control object-cover ring-1 ring-border" />}
          <div>
            <h1 className="text-2xl font-bold text-ink">Postuler</h1>
            <p className="text-ink-muted mt-1 font-semibold">{job.title}</p>
            <p className="text-ink-muted text-sm">{job.schoolName} &bull; {job.schoolCity}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface p-4 rounded-control border border-border">
            <h3 className="text-sm font-semibold text-ink mb-3">Votre Profil (Pré-rempli)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-ink-muted">
              <div><span className="block text-xs text-ink-muted">Nom Complet</span>{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
              <div><span className="block text-xs text-ink-muted">Téléphone</span>{user.phone}</div>
              <div className="col-span-2"><span className="block text-xs text-ink-muted">Email</span>{user.email}</div>
            </div>
            <p className="mt-4 text-xs text-primary-600 italic">Vos expériences professionnelles renseignées dans votre profil seront automatiquement jointes.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Lettre de motivation (Optionnel)</label>
            <textarea
              rows="4" value={motivation} onChange={e => setMotivation(e.target.value)}
              placeholder="Exprimez brièvement pourquoi vous êtes le candidat idéal..."
              className="w-full rounded-control border border-border px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            ></textarea>
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 transition hover:bg-accent-400 disabled:opacity-50"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
          </button>
        </form>
      </div>
    </div>
  )
}
