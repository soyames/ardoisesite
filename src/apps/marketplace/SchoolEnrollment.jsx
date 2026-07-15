import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { mockApi } from '../../shared/api/mockDb.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'

export default function SchoolEnrollment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, status } = useAuth()
  
  const school = mockApi.getSchool(id)
  
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [childClass, setChildClass] = useState('6ème')
  const [submitting, setSubmitting] = useState(false)

  if (!school) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32">
        <EmptyState title="École introuvable" />
      </div>
    )
  }

  if (status === 'loading') return null

  if (status === 'anonymous' || !user || user.role !== 'parent') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">Connexion Requise</h2>
        <p className="text-ink-muted mb-8">Vous devez être connecté en tant que parent pour faire une demande d'inscription.</p>
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
      mockApi.createEnrollment({
        schoolId: school.id,
        parentId: user.id,
        parentName: user.name,
        parentPhone: user.phone,
        childName,
        childAge,
        childClass
      })
      alert('Demande envoyée avec succès ! L\'école vous contactera bientôt.')
      navigate('/portal') // Redirect parent to their portal/dashboard
    }, 800)
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-surface-raised p-8 rounded-card shadow-card ring-1 ring-border">
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl font-bold text-ink">Demande d'inscription</h1>
          <p className="text-ink-muted mt-1">Pour l'établissement : <span className="font-semibold text-ink">{school.name}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface p-4 rounded-control border border-border">
            <h3 className="text-sm font-semibold text-ink mb-3">Informations du Parent (Pré-remplies)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-ink-muted">
              <div><span className="block text-xs text-ink-muted">Nom Complet</span>{user.name}</div>
              <div><span className="block text-xs text-ink-muted">Téléphone</span>{user.phone}</div>
              <div className="col-span-2"><span className="block text-xs text-ink-muted">Email</span>{user.email}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nom complet de l'enfant</label>
            <input
              type="text" required value={childName} onChange={e => setChildName(e.target.value)}
              className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Âge de l'enfant</label>
              <input
                type="number" required min="3" max="20" value={childAge} onChange={e => setChildAge(e.target.value)}
                className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Classe demandée</label>
              <select
                value={childClass} onChange={e => setChildClass(e.target.value)}
                className="w-full rounded-control border border-border px-4 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="6ème">6ème</option>
                <option value="5ème">5ème</option>
                <option value="4ème">4ème</option>
                <option value="3ème">3ème</option>
                <option value="2nde">2nde</option>
                <option value="1ère">1ère</option>
                <option value="Terminale">Terminale</option>
              </select>
            </div>
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full rounded-control bg-accent-500 px-4 py-3 text-sm font-bold text-primary-950 transition hover:bg-accent-400 disabled:opacity-50"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </div>
  )
}
