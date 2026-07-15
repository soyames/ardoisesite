import { Link } from 'react-router-dom'

const TOP_SCHOOLS = [
  { id: 1, name: 'Complexe Scolaire La Liberté', city: 'Abomey-Calavi', successRate: '98%', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80' },
  { id: 2, name: 'Collège Catholique Père Aupiais', city: 'Cotonou', successRate: '95%', image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80' },
  { id: 3, name: 'Lycée Béhanzin', city: 'Porto-Novo', successRate: '92%', image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80' },
]

const FEATURED_TUTORS = [
  { id: 1, name: 'Dr. Jean Dupont', subject: 'Mathématiques & Physique', rating: 4.9, price: '15 000 F', image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80' },
  { id: 2, name: 'Marie Mensah', subject: 'SVT & Chimie', rating: 4.8, price: '12 000 F', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
  { id: 3, name: 'Paul Kossi', subject: 'Philosophie & Français', rating: 5.0, price: '10 000 F', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80' },
]

export default function Home() {
  return (
    <div className="flex flex-col bg-slate-50">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pb-32 pt-20 sm:pt-32 lg:pb-40">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            L'excellence éducative, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">à portée de clic</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-300">
            Trouvez la meilleure école pour vos enfants grâce à des classements transparents. Réservez les tuteurs les plus qualifiés pour un suivi à domicile sur-mesure.
          </p>
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              to="/schools"
              className="rounded-full bg-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Explorer les Écoles
            </Link>
            <Link
              to="/teachers"
              className="rounded-full px-8 py-3.5 text-sm font-semibold text-white ring-1 ring-inset ring-slate-700 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200"
            >
              Trouver un Tuteur
            </Link>
          </div>
        </div>
      </section>

      {/* Top Ranked Schools Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Écoles d'Excellence</h2>
            <p className="mt-2 text-lg text-slate-600">Les établissements les mieux classés cette année.</p>
          </div>
          <Link to="/schools" className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block">
            Voir tout le classement &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TOP_SCHOOLS.map(school => (
            <Link key={school.id} to={`/schools/${school.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-200">
                <img src={school.image} alt={school.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{school.name}</h3>
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {school.successRate} Réussite
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{school.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Tutors Section */}
      <section className="bg-slate-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Tuteurs à Domicile</h2>
              <p className="mt-2 text-lg text-slate-400">Des professionnels certifiés pour accompagner votre enfant.</p>
            </div>
            <Link to="/teachers" className="hidden text-sm font-semibold text-indigo-400 hover:text-indigo-300 sm:block">
              Trouver par matière &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_TUTORS.map(tutor => (
              <div key={tutor.id} className="group relative flex flex-col rounded-3xl bg-slate-800 p-6 shadow-xl ring-1 ring-white/10 transition-all hover:bg-slate-700">
                <div className="flex items-center gap-4">
                  <img src={tutor.image} alt={tutor.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-500/20" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{tutor.name}</h3>
                    <p className="text-sm font-medium text-indigo-400">{tutor.subject}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-1 text-sm text-slate-300">
                    <span className="text-yellow-400">★</span> {tutor.rating}/5
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {tutor.price} <span className="text-slate-400 font-normal">/ mois</span>
                  </div>
                </div>
                <Link to={`/teachers/${tutor.id}`} className="mt-6 flex w-full items-center justify-center rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                  Voir le profil
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
