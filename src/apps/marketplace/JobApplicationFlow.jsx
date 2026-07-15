import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { mockApi } from '../../shared/api/mockDb.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'

export default function JobApplicationFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()
  
  const job = mockApi.getJob(id)
  const school = job ? mockApi.getSchool(job.schoolId) : null
  
  const [motivation, setMotivation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!job || !school) {
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      mockApi.createApplication({
        jobId: job.id,
        teacherId: user.id,
        teacherName: user.name,
        email: user.email,
        motivation
      })
      alert('Candidature envoyée avec succès ! L\'école vous contactera bientôt.')
      navigate('/portal') // Redirect teacher to their portal/dashboard
    }, 800)
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-surface-raised p-8 rounded-card shadow-card ring-1 ring-border">
        <div className="mb-8 border-b border-border pb-6 flex items-center gap-6">
          <img src={school.image} alt={school.name} className="h-16 w-16 rounded-control object-cover ring-1 ring-border" />
          <div>
            <h1 className="text-2xl font-bold text-ink">Postuler</h1>
            <p className="text-ink-muted mt-1 font-semibold">{job.title}</p>
            <p className="text-ink-muted text-sm">{school.name} &bull; {school.city}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface p-4 rounded-control border border-border">
            <h3 className="text-sm font-semibold text-ink mb-3">Votre Profil (Pré-rempli)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-ink-muted">
              <div><span className="block text-xs text-ink-muted">Nom Complet</span>{user.name}</div>
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
