import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { mockApi } from '../../shared/api/mockDb.js'

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
      <div className="py-32 text-center">
        <h2 className="text-2xl font-bold">Offre introuvable</h2>
      </div>
    )
  }

  if (status === 'loading') return null

  if (status === 'anonymous' || !user || user.role !== 'teacher') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Connexion Requise</h2>
        <p className="text-slate-600 mb-8">Vous devez être connecté en tant que professeur pour postuler à cette offre.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500">
            Se connecter
          </Link>
          <Link to="/register" className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-300">
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
        <div className="mb-8 border-b border-slate-100 pb-6 flex items-center gap-6">
          <img src={school.image} alt={school.name} className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Postuler</h1>
            <p className="text-slate-500 mt-1 font-semibold">{job.title}</p>
            <p className="text-slate-400 text-sm">{school.name} &bull; {school.city}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Votre Profil (Pré-rempli)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div><span className="block text-xs text-slate-400">Nom Complet</span>{user.name}</div>
              <div><span className="block text-xs text-slate-400">Téléphone</span>{user.phone}</div>
              <div className="col-span-2"><span className="block text-xs text-slate-400">Email</span>{user.email}</div>
            </div>
            <p className="mt-4 text-xs text-indigo-600 italic">Vos expériences professionnelles renseignées dans votre profil seront automatiquement jointes.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lettre de motivation (Optionnel)</label>
            <textarea 
              rows="4" value={motivation} onChange={e => setMotivation(e.target.value)}
              placeholder="Exprimez brièvement pourquoi vous êtes le candidat idéal..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            ></textarea>
          </div>

          <button 
            type="submit" disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
          </button>
        </form>
      </div>
    </div>
  )
}
