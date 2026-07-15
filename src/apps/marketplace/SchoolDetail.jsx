import { useParams, Link } from 'react-router-dom'

const SCHOOL_DB = {
  1: { id: 1, name: 'Complexe Scolaire La Liberté', city: 'Abomey-Calavi', cycle: 'Primaire & Secondaire', successRate: 98, internalRate: 95, image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80', description: 'Une école d\'excellence reconnue pour sa rigueur et ses résultats aux examens nationaux.', students: 1200, teachers: 85, established: 2005 },
  2: { id: 2, name: 'Collège Catholique Père Aupiais', city: 'Cotonou', cycle: 'Secondaire', successRate: 95, internalRate: 92, image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1200&q=80', description: 'Un cadre d\'apprentissage prestigieux au cœur de Cotonou.', students: 2500, teachers: 150, established: 1960 },
  3: { id: 3, name: 'Lycée Béhanzin', city: 'Porto-Novo', cycle: 'Secondaire', successRate: 92, internalRate: 88, image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1200&q=80', description: 'Lycée historique de la capitale offrant une formation solide.', students: 3000, teachers: 200, established: 1950 },
}

const JOBS_MOCK = [
  { id: 101, title: 'Professeur de Mathématiques (Terminale)', type: 'Temps Plein', posted: 'Il y a 2 jours' },
  { id: 102, title: 'Surveillant Général Adjoint', type: 'Temps Plein', posted: 'Il y a 1 semaine' },
]

export default function SchoolDetail() {
  const { id } = useParams()
  const school = SCHOOL_DB[id]

  if (!school) {
    return (
      <div className="py-32 text-center text-slate-500">
        <h2 className="text-2xl font-bold">École introuvable</h2>
        <Link to="/schools" className="mt-4 inline-block text-indigo-600 hover:underline">Retour à l'annuaire</Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-80 w-full md:h-96">
        <img src={school.image} alt={school.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:px-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{school.city}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{school.cycle}</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{school.name}</h1>
            </div>
            <button className="whitespace-nowrap rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-500 hover:scale-105">
              Demander l'inscription
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900">À propos</h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">{school.description}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900">Offres d'emploi</h2>
            <div className="mt-6 space-y-4">
              {JOBS_MOCK.map(job => (
                <div key={job.id} className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                  <div>
                    <h3 className="font-bold text-slate-900">{job.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                      <span>{job.type}</span>
                      <span>&bull;</span>
                      <span>{job.posted}</span>
                    </div>
                  </div>
                  <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">Postuler &rarr;</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h3 className="font-bold text-slate-900 text-xl mb-6">Performance</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Examen National</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-green-600">{school.successRate}%</span>
                  <span className="text-sm text-slate-500 mb-1">de réussite</span>
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Passage en classe supérieure (Interne)</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-slate-900">{school.internalRate}%</span>
                  <span className="text-sm text-slate-500 mb-1">de réussite</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8 shadow-sm">
            <h3 className="font-bold text-white text-xl mb-6">En chiffres</h3>
            <dl className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between border-b border-white/10 pb-4">
                <dt>Élèves inscrits</dt>
                <dd className="font-bold text-white">{school.students}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-4">
                <dt>Corps enseignant</dt>
                <dd className="font-bold text-white">{school.teachers}</dd>
              </div>
              <div className="flex justify-between pb-2">
                <dt>Année de création</dt>
                <dd className="font-bold text-white">{school.established}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
