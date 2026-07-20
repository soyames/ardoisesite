import { useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import MarketplaceAccountSettings from '../../shared/settings/MarketplaceAccountSettings.jsx'

export default function TeacherMarketplaceDashboard() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [price, setPrice] = useState('15000')

  const [newExp, setNewExp] = useState({ employer: '', start: '', end: '', description: '' })
  const [newEdu, setNewEdu] = useState({ school: '', degree: '', year: '' })
  const [newSession, setNewSession] = useState({ date: '', hours: '2', notes: '' })
  const [showSessionForm, setShowSessionForm] = useState(false)

  const handleAddExperience = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        experiences: arrayUnion({ ...newExp, id: Date.now() }),
      })
      await refreshUser()
      setNewExp({ employer: '', start: '', end: '', description: '' })
      alert('Expérience ajoutée avec succès !')
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'ajout de l'expérience.")
    }
  }

  const handleAddEducation = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        education: arrayUnion({ ...newEdu, id: Date.now() }),
      })
      await refreshUser()
      setNewEdu({ school: '', degree: '', year: '' })
      alert('Formation ajoutée avec succès !')
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'ajout de la formation.")
    }
  }

  const handleLogSession = async (e) => {
    e.preventDefault()
    // Here we would push to tutoring_sessions collection in Firestore
    alert('Séance enregistrée avec succès ! Le parent sera notifié.')
    setShowSessionForm(false)
    setNewSession({ date: '', hours: '2', notes: '' })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink">Mon Espace Tuteur</h1>
            <p className="text-ink-muted">Gérez votre profil public et vos contrats de tutorat.</p>
          </div>
          <Link to={`/teachers/${user.id}`} className="rounded-control bg-primary-900 px-6 py-3 text-sm font-bold text-white shadow-card hover:bg-primary-800 transition text-center whitespace-nowrap">
            Voir mon profil public
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-control text-sm font-semibold transition ${activeTab === 'profile' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-ink-muted hover:bg-primary-50'}`}
            >
              Profil Public
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`w-full text-left px-4 py-3 rounded-control text-sm font-semibold transition ${activeTab === 'experiences' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-ink-muted hover:bg-primary-50'}`}
            >
              Mes Expériences
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`w-full text-left px-4 py-3 rounded-control text-sm font-semibold transition ${activeTab === 'education' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-ink-muted hover:bg-primary-50'}`}
            >
              Formations & Diplômes
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`w-full text-left px-4 py-3 rounded-control text-sm font-semibold transition ${activeTab === 'contracts' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-ink-muted hover:bg-primary-50'}`}
            >
              Mes Contrats (2)
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-4 py-3 rounded-control text-sm font-semibold transition ${activeTab === 'account' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-ink-muted hover:bg-primary-50'}`}
            >
              Mon Compte
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8 space-y-6">
                <h2 className="text-xl font-bold text-ink border-b border-border pb-4">Informations Publiques</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink">Matières enseignées</label>
                    <input type="text" defaultValue="Mathématiques & Physique" className="mt-2 block w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">Ville / Zone d'intervention</label>
                    <input type="text" defaultValue="Cotonou" className="mt-2 block w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">Description / Bio</label>
                  <textarea rows="4" defaultValue="Docteur en mathématiques appliquées, 10 ans d'expérience..." className="mt-2 block w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink">Tarif Mensuel Indicatif (FCFA)</label>
                  <p className="text-xs text-ink-muted mb-2">Ce tarif sera affiché sur votre profil. Vous pourrez le négocier avant signature du contrat.</p>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="block w-full sm:max-w-xs rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div className="pt-4">
                  <button className="rounded-control bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-700">
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'experiences' && (
              <div className="space-y-6">
                <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8">
                  <h2 className="text-xl font-bold text-ink border-b border-border pb-4 mb-6">Ajouter une Expérience</h2>
                  <form onSubmit={handleAddExperience} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">Employeur / École</label>
                        <input required type="text" value={newExp.employer} onChange={e => setNewExp({...newExp, employer: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1">Début (Année)</label>
                          <input required type="text" value={newExp.start} onChange={e => setNewExp({...newExp, start: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1">Fin (Année)</label>
                          <input required type="text" value={newExp.end} onChange={e => setNewExp({...newExp, end: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" placeholder="Ex: 2023 ou Présent" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">Rôle et Description</label>
                      <textarea required rows="3" value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"></textarea>
                    </div>
                    <button type="submit" className="rounded-control bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-700">Ajouter</button>
                  </form>
                </div>

                <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8">
                  <h2 className="text-xl font-bold text-ink border-b border-border pb-4 mb-6">Mon Parcours</h2>
                  <div className="space-y-6">
                    {user.experiences?.length > 0 ? user.experiences.map((exp, i) => (
                      <div key={i} className="border-l-4 border-primary-200 pl-4 py-1">
                        <h3 className="font-bold text-ink">{exp.employer}</h3>
                        <p className="text-sm text-primary-600 font-medium mb-2">{exp.start} - {exp.end}</p>
                        <p className="text-sm text-ink-muted">{exp.description}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-ink-muted">Aucune expérience ajoutée pour le moment.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8">
                  <h2 className="text-xl font-bold text-ink border-b border-border pb-4 mb-6">Ajouter une Formation / Diplôme</h2>
                  <form onSubmit={handleAddEducation} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">Établissement (Université, École)</label>
                        <input required type="text" value={newEdu.school} onChange={e => setNewEdu({...newEdu, school: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" placeholder="Ex: Université d'Abomey-Calavi" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">Diplôme Obtenu</label>
                        <input required type="text" value={newEdu.degree} onChange={e => setNewEdu({...newEdu, degree: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" placeholder="Ex: Licence en Mathématiques" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1">Année d'obtention</label>
                      <input required type="text" value={newEdu.year} onChange={e => setNewEdu({...newEdu, year: e.target.value})} className="w-full sm:max-w-xs rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" placeholder="Ex: 2020" />
                    </div>
                    <button type="submit" className="rounded-control bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-card hover:bg-primary-700">Ajouter</button>
                  </form>
                </div>

                <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-8">
                  <h2 className="text-xl font-bold text-ink border-b border-border pb-4 mb-6">Mes Diplômes</h2>
                  <div className="space-y-6">
                    {user.education?.length > 0 ? user.education.map((edu, i) => (
                      <div key={i} className="border-l-4 border-success-200 pl-4 py-1">
                        <h3 className="font-bold text-ink">{edu.degree}</h3>
                        <p className="text-sm text-success-600 font-medium mb-1">{edu.school}</p>
                        <p className="text-sm text-ink-muted">Année : {edu.year}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-ink-muted">Aucun diplôme ajouté pour le moment.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="space-y-6">
                <div className="bg-surface-raised rounded-card shadow-card ring-1 ring-border p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-ink">M. Tossou (Parent) - Eleve : Kevin</h3>
                      <p className="text-sm text-ink-muted mt-1">Soutien en Mathematiques &bull; 4h / semaine</p>
                    </div>
                    <Badge tone="success">Actif (Mois 2 / 6)</Badge>
                  </div>
                  
                  {showSessionForm ? (
                    <form onSubmit={handleLogSession} className="mt-6 border-t border-border pt-6 space-y-4">
                      <h4 className="font-bold text-ink">Nouvelle seance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1">Date</label>
                          <input required type="date" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-ink mb-1">Duree (heures)</label>
                          <select value={newSession.hours} onChange={e => setNewSession({...newSession, hours: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm">
                            <option value="1">1 heure</option>
                            <option value="2">2 heures</option>
                            <option value="3">3 heures</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1">Compte-rendu (visible par le parent)</label>
                        <textarea required rows="2" value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} className="w-full rounded-control border-0 py-2 px-3 text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"></textarea>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="rounded-control bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700">Enregistrer</button>
                        <button type="button" onClick={() => setShowSessionForm(false)} className="rounded-control bg-surface px-4 py-2 text-sm font-bold text-ink hover:bg-surface-raised border border-border">Annuler</button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-sm">
                      <button onClick={() => setShowSessionForm(true)} className="rounded-control bg-accent-500 px-4 py-2 font-bold text-primary-950 shadow-sm hover:bg-accent-400">
                        + Saisir une seance
                      </button>
                      <button className="text-primary-600 hover:underline font-medium">Voir le contrat</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'account' && <MarketplaceAccountSettings />}
          </div>

        </div>
      </div>
    </div>
  )
}
