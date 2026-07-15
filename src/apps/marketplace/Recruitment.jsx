import { useState } from 'react'

const JOBS_DATA = [
  { id: 1, school: 'Complexe Scolaire La Liberté', city: 'Abomey-Calavi', title: 'Professeur de Mathématiques (Terminale)', type: 'Temps Plein', posted: 'Il y a 2 jours', logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&q=80' },
  { id: 2, school: 'Lycée Béhanzin', city: 'Porto-Novo', title: 'Professeur de Philosophie', type: 'Temps Partiel', posted: 'Il y a 3 jours', logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&q=80' },
  { id: 3, school: 'École Primaire Montaigne', city: 'Cotonou', title: 'Instituteur/Institutrice (CM2)', type: 'Temps Plein', posted: 'Il y a 1 semaine', logo: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&q=80' },
  { id: 4, school: 'Collège Catholique Père Aupiais', city: 'Cotonou', title: 'Surveillant Général Adjoint', type: 'Temps Plein', posted: 'Il y a 1 semaine', logo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=100&q=80' },
]

export default function Recruitment() {
  const [search, setSearch] = useState('')

  const filteredJobs = JOBS_DATA.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase()) || 
    job.school.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Opportunités de Carrière
          </h2>
          <p className="mt-4 text-xl text-slate-500">
            Rejoignez les meilleures écoles. Consultez les appels à candidatures.
          </p>
        </div>

        <div className="mb-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Rechercher un poste ou une école..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border-0 px-6 py-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg"
          />
        </div>

        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="group relative flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-indigo-200">
              <div className="flex items-center gap-6">
                <img src={job.logo} alt={job.school} className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{job.school}</span>
                    <span>&bull;</span>
                    <span>{job.city}</span>
                    <span>&bull;</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{job.type}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end gap-3 w-full md:w-auto">
                <span className="text-xs text-slate-400">{job.posted}</span>
                <button className="w-full md:w-auto rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-50">
                  Postuler
                </button>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-slate-500">Aucune offre ne correspond à votre recherche.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

