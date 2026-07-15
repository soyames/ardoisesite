import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { mockApi } from '../../shared/api/mockDb.js'

export default function TeacherMarketplaceDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [price, setPrice] = useState('15000')

  const [newExp, setNewExp] = useState({ employer: '', start: '', end: '', description: '' })

  const handleAddExperience = (e) => {
    e.preventDefault()
    if (!user) return
    mockApi.addExperience(user.id, newExp)
    setNewExp({ employer: '', start: '', end: '', description: '' })
    alert('Expérience ajoutée avec succès !')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Mon Espace Tuteur</h1>
            <p className="text-slate-500">Gérez votre profil public et vos contrats de tutorat.</p>
          </div>
          <Link to={`/teachers/${user.id}`} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition text-center whitespace-nowrap">
            Voir mon profil public
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="md:col-span-1 space-y-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Profil Public
            </button>
            <button 
              onClick={() => setActiveTab('experiences')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === 'experiences' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Mes Expériences
            </button>
            <button 
              onClick={() => setActiveTab('contracts')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === 'contracts' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Mes Contrats (2)
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">Informations Publiques</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Matières enseignées</label>
                    <input type="text" defaultValue="Mathématiques & Physique" className="mt-2 block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Ville / Zone d'intervention</label>
                    <input type="text" defaultValue="Cotonou" className="mt-2 block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Description / Bio</label>
                  <textarea rows="4" defaultValue="Docteur en mathématiques appliquées, 10 ans d'expérience..." className="mt-2 block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Tarif Mensuel Indicatif (FCFA)</label>
                  <p className="text-xs text-slate-500 mb-2">Ce tarif sera affiché sur votre profil. Vous pourrez le négocier avant signature du contrat.</p>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="block w-full sm:max-w-xs rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  />
                </div>

                <div className="pt-4">
                  <button className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500">
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'experiences' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8">
                  <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Ajouter une Expérience</h2>
                  <form onSubmit={handleAddExperience} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employeur / École</label>
                        <input required type="text" value={newExp.employer} onChange={e => setNewExp({...newExp, employer: e.target.value})} className="w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Début (Année)</label>
                          <input required type="text" value={newExp.start} onChange={e => setNewExp({...newExp, start: e.target.value})} className="w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Fin (Année)</label>
                          <input required type="text" value={newExp.end} onChange={e => setNewExp({...newExp, end: e.target.value})} className="w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" placeholder="Ex: 2023 ou Présent" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rôle et Description</label>
                      <textarea required rows="3" value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} className="w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"></textarea>
                    </div>
                    <button type="submit" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500">Ajouter</button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8">
                  <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Mon Parcours</h2>
                  <div className="space-y-6">
                    {user.experiences?.length > 0 ? user.experiences.map((exp, i) => (
                      <div key={i} className="border-l-4 border-indigo-200 pl-4 py-1">
                        <h3 className="font-bold text-slate-900">{exp.employer}</h3>
                        <p className="text-sm text-indigo-600 font-medium mb-2">{exp.start} - {exp.end}</p>
                        <p className="text-sm text-slate-600">{exp.description}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">Aucune expérience ajoutée pour le moment.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">M. Tossou (Parent) - Élève : Kevin</h3>
                      <p className="text-sm text-slate-500 mt-1">Soutien en Mathématiques &bull; 4h / semaine</p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                       Actif (Mois 2 / 6)
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700">Tarif convenu : {price} F / mois</span>
                    <button className="text-indigo-600 hover:underline font-medium">Voir le contrat</button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
