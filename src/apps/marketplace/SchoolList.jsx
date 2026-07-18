import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import BeninMap from '../../shared/ui/BeninMap.jsx'
import { FRANCOPHONE_AFRICA_DATA } from '../../shared/constants/locations.js'
import { BENIN_COMMUNE_DEPARTMENT } from '../../shared/constants/beninGeoCommunes.js'

// Marketplace is Benin-only for now - see FRANCOPHONE_AFRICA_DATA for the
// full multi-country list this will expand into later.
const BENIN_CITIES = FRANCOPHONE_AFRICA_DATA['Benin']

export default function SchoolList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('Toutes')
  const department = searchParams.get('department')

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schools'), (snapshot) => {
      const rows = []
      snapshot.forEach((d) => rows.push({ id: d.id, ...d.data() }))
      setSchools(rows)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsubscribe()
  }, [])

  const cityCounts = useMemo(() => {
    const counts = {}
    schools.forEach((school) => {
      if (school.city) counts[school.city] = (counts[school.city] || 0) + 1
    })
    return counts
  }, [schools])

  const filteredSchools = schools.filter(school => {
    const matchesSearch = (school.name || '').toLowerCase().includes(search.toLowerCase())
    const matchesCity = cityFilter === 'Toutes' || school.city === cityFilter
    const matchesDepartment = !department || BENIN_COMMUNE_DEPARTMENT[school.city] === department
    return matchesSearch && matchesCity && matchesDepartment
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

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Region map */}
          <div className="rounded-card border border-border bg-surface-raised p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <h3 className="text-sm font-semibold text-ink">Parcourir par departement</h3>
            <p className="mt-1 text-xs text-ink-muted">Cliquez une region pour filtrer l'annuaire, ou passez aux communes.</p>
            <div className="mt-4">
              <BeninMap
                schoolCounts={cityCounts}
                selectedDepartment={department}
                onSelectDepartment={(dept) => setSearchParams(dept ? { department: dept } : {})}
              />
            </div>
            {department && (
              <button
                onClick={() => setSearchParams({})}
                className="mt-3 text-xs font-semibold text-primary-600 hover:text-primary-500"
              >
                &larr; Effacer le filtre regional
              </button>
            )}
          </div>

          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Rechercher une école..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:max-w-xs rounded-control border-0 bg-surface px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
              />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:max-w-[200px] rounded-control border-0 bg-surface px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
              >
                <option value="Toutes">Toutes les villes</option>
                {BENIN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            )}

            {/* List */}
            {!loading && (
              <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
                {filteredSchools.map((school) => (
                  <Link key={school.id} to={`/schools/${school.id}`} className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface-raised shadow-card transition-all hover:shadow-elevated hover:-translate-y-1 hover:border-primary-200">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-primary-100">
                      {school.image ? (
                        <img src={school.image} alt={school.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">🏫</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-primary-600">{school.city}</p>
                          {school.cycle && <p className="text-xs font-semibold text-ink-muted">{school.cycle}</p>}
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-ink group-hover:text-primary-600 transition-colors">
                          {school.name}
                        </h3>
                        <p className="mt-3 text-sm text-ink-muted line-clamp-2">
                          {school.description || "Cette école n'a pas encore complété sa présentation publique."}
                        </p>
                      </div>
                      {(school.successRate != null || school.internalRate != null) && (
                        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                          <div>
                            <p className="text-xs text-ink-muted">Examen National</p>
                            <p className="text-lg font-bold text-success-600">{school.successRate ?? '—'}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-ink-muted">Taux Interne</p>
                            <p className="text-lg font-bold text-ink">{school.internalRate ?? '—'}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!loading && filteredSchools.length === 0 && (
              <div className="mt-12">
                <EmptyState
                  title="Aucune école ne correspond à vos critères"
                  description="Essayez une autre région, une autre ville, ou un autre terme de recherche."
                  action={
                    <button
                      onClick={() => { setSearch(''); setCityFilter('Toutes'); setSearchParams({}) }}
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
      </div>
    </div>
  )
}

