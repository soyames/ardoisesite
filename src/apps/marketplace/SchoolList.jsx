import { useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../shared/ui/EmptyState.jsx'

const SCHOOLS_DATA = [
  { id: 1, name: 'Complexe Scolaire La Liberté', city: 'Abomey-Calavi', cycle: 'Primaire & Secondaire', successRate: 98, internalRate: 95, image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', description: 'Une école d\'excellence reconnue pour sa rigueur et ses résultats aux examens nationaux.' },
  { id: 2, name: 'Collège Catholique Père Aupiais', city: 'Cotonou', cycle: 'Secondaire', successRate: 95, internalRate: 92, image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80', description: 'Un cadre d\'apprentissage prestigieux au cœur de Cotonou.' },
  { id: 3, name: 'Lycée Béhanzin', city: 'Porto-Novo', cycle: 'Secondaire', successRate: 92, internalRate: 88, image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80', description: 'Lycée historique de la capitale offrant une formation solide.' },
  { id: 4, name: 'École Primaire Montaigne', city: 'Cotonou', cycle: 'Primaire', successRate: 100, internalRate: 98, image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', description: 'L\'école primaire de référence pour un début de scolarité réussi.' },
]

export default function SchoolList() {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('Toutes')

  const filteredSchools = SCHOOLS_DATA.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(search.toLowerCase())
    const matchesCity = cityFilter === 'Toutes' || school.city === cityFilter
    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Annuaire des Écoles
            </h2>
            <p className="mt-3 max-w-2xl text-xl text-ink-muted">
              Trouvez l'établissement idéal pour votre enfant, classé par performance et taux de réussite.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher une école..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs rounded-control border-0 bg-surface-raised px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
          />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full sm:max-w-xs rounded-control border-0 bg-surface-raised px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
          >
            <option value="Toutes">Toutes les villes</option>
            <option value="Cotonou">Cotonou</option>
            <option value="Abomey-Calavi">Abomey-Calavi</option>
            <option value="Porto-Novo">Porto-Novo</option>
          </select>
        </div>

        {/* List */}
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => (
            <Link key={school.id} to={`/schools/${school.id}`} className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface-raised shadow-card transition-all hover:shadow-elevated hover:-translate-y-1 hover:border-primary-200">
              <div className="aspect-[16/9] w-full overflow-hidden bg-primary-100">
                <img src={school.image} alt={school.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary-600">{school.city}</p>
                    <p className="text-xs font-semibold text-ink-muted">{school.cycle}</p>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-ink group-hover:text-primary-600 transition-colors">
                    {school.name}
                  </h3>
                  <p className="mt-3 text-sm text-ink-muted line-clamp-2">{school.description}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-ink-muted">Examen National</p>
                    <p className="text-lg font-bold text-success-600">{school.successRate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Taux Interne</p>
                    <p className="text-lg font-bold text-ink">{school.internalRate}%</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {filteredSchools.length === 0 && (
          <div className="mt-12">
            <EmptyState
              title="Aucune école ne correspond à vos critères"
              description="Essayez une autre ville ou un autre terme de recherche."
              action={
                <button
                  onClick={() => { setSearch(''); setCityFilter('Toutes') }}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-500"
                >
                  Réinitialiser les filtres
                </button>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}

