import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { mockApi } from '../../shared/api/mockDb.js'

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
      <div className="py-32 text-center">
        <h2 className="text-2xl font-bold">École introuvable</h2>
      </div>
    )
  }

  if (status === 'loading') return null

  if (status === 'anonymous' || !user || user.role !== 'parent') {
    return (
      <div className="py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Connexion Requise</h2>
        <p className="text-slate-600 mb-8">Vous devez être connecté en tant que parent pour faire une demande d'inscription.</p>
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm ring-1 ring-slate-200">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-bold text-slate-900">Demande d'inscription</h1>
          <p className="text-slate-500 mt-1">Pour l'établissement : <span className="font-semibold text-slate-900">{school.name}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Informations du Parent (Pré-remplies)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div><span className="block text-xs text-slate-400">Nom Complet</span>{user.name}</div>
              <div><span className="block text-xs text-slate-400">Téléphone</span>{user.phone}</div>
              <div className="col-span-2"><span className="block text-xs text-slate-400">Email</span>{user.email}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet de l'enfant</label>
            <input 
              type="text" required value={childName} onChange={e => setChildName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Âge de l'enfant</label>
              <input 
                type="number" required min="3" max="20" value={childAge} onChange={e => setChildAge(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Classe demandée</label>
              <select 
                value={childClass} onChange={e => setChildClass(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </div>
  )
}
