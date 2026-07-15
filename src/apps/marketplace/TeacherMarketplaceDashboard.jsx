import { useState } from 'react'

export default function TeacherMarketplaceDashboard() {
  const [activeTab, setActiveTab] = useState('profile')
  const [price, setPrice] = useState('15000')

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Mon Espace Tuteur</h1>
          <p className="text-slate-500">Gérez votre profil public et vos contrats de tutorat.</p>
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
                  <label className="block text-sm font-medium text-slate-700">Description / Expérience</label>
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
                    <span className="font-semibold text-slate-700">Tarif convenu : 15 000 F / mois</span>
                    <button className="text-indigo-600 hover:underline font-medium">Voir le contrat</button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Mme. Dossa (Parent) - Élève : Sarah</h3>
                      <p className="text-sm text-slate-500 mt-1">Soutien en Physique &bull; 2h / semaine</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                      Terminé
                    </span>
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
