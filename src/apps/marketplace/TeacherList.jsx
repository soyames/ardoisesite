import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import CountryMapWrapper from '../../shared/ui/CountryMapWrapper.jsx'
import { OHADA_COUNTRIES } from '../../shared/constants/locations.js'
import { SUBJECTS } from '../../shared/constants/subjects.js'
import { COUNTRY_CITIES } from '../../shared/constants/cities.js'

export default function TeacherList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('Toutes')
  const [subjectFilter, setSubjectFilter] = useState('Toutes')
  const [communeDepartmentMap, setCommuneDepartmentMap] = useState({})

  const country = searchParams.get('country') || 'BEN'
  const department = searchParams.get('department')
  const commune = searchParams.get('commune')

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = []
      snapshot.forEach((d) => {
        const data = d.data()
        rows.push({
          id: d.id,
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          subject: data.subject || '',
          city: data.city || '',
          price: data.price != null ? `${data.price} F / mois` : null,
          description: data.bio || '',
          image: data.image || null,
        })
      })
      setTeachers(rows)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsubscribe()
  }, [])

  const cityCounts = useMemo(() => {
    const counts = {}
    teachers.forEach((teacher) => {
      if (teacher.city && communeDepartmentMap[teacher.city] !== undefined) {
        counts[teacher.city] = (counts[teacher.city] || 0) + 1
      }
    })
    return counts
  }, [teachers, communeDepartmentMap])

  const filteredTeachers = teachers.filter(teacher => {
    const matchesCountry = communeDepartmentMap[teacher.city] !== undefined
    const matchesSearch = teacher.name.toLowerCase().includes(search.toLowerCase())
    const matchesCity = cityFilter === 'Toutes' || teacher.city === cityFilter
    const matchesSubject = subjectFilter === 'Toutes' || teacher.subject === subjectFilter
    const matchesDepartment = !department || communeDepartmentMap[teacher.city] === department
    const matchesCommune = !commune || teacher.city === commune
    return matchesCountry && matchesSearch && matchesCity && matchesSubject && matchesDepartment && matchesCommune
  })

  const availableCities = useMemo(() => {
    const officialCities = COUNTRY_CITIES[country]
    if (officialCities) {
      return [...officialCities].sort()
    }
    return Object.keys(communeDepartmentMap).sort()
  }, [country, communeDepartmentMap])

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
              Tuteurs à domicile
            </h2>
            <p className="mt-3 max-w-2xl text-xl text-ink-muted">
              Trouvez l'encadreur idéal pour accompagner votre enfant vers l'excellence.
            </p>
          </div>
          <div className="w-full md:w-auto shrink-0 pt-2">
            <label htmlFor="country-select" className="sr-only">Choisir un pays</label>
            <select
              id="country-select"
              value={country}
              onChange={(e) => setSearchParams({ country: e.target.value })}
              className="w-full md:w-48 rounded-control border-0 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-900 shadow-sm ring-1 ring-inset ring-primary-200 focus:ring-2 focus:ring-primary-600"
            >
              {OHADA_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <div className="rounded-card border border-border bg-surface-raised p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <h3 className="text-sm font-semibold text-ink">Parcourir par département</h3>
            <p className="mt-1 text-xs text-ink-muted">Cliquez une région pour filtrer l'annuaire, ou passez aux communes.</p>
            <div className="mt-4">
              <CountryMapWrapper
                countryCode={country}
                onMapDataLoaded={(data) => setCommuneDepartmentMap(data?.communeDepartmentMap || {})}
                schoolCounts={cityCounts}
                selectedDepartment={department}
                onSelectDepartment={(dept) => setSearchParams(dept ? { country, department: dept } : { country })}
                onSelectCommune={(c) => setSearchParams({ country, commune: c })}
              />
            </div>
            {(department || commune) && (
              <button
                onClick={() => setSearchParams({ country })}
                className="mt-3 text-xs font-semibold text-primary-600 hover:text-primary-500"
              >
                &larr; Effacer le filtre régional ({commune || department})
              </button>
            )}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:flex-1 sm:min-w-[200px] rounded-control border-0 bg-surface-raised px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
              />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:max-w-[180px] rounded-control border-0 bg-surface-raised px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
              >
                <option value="Toutes">Toutes les villes</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full sm:max-w-[180px] rounded-control border-0 bg-surface-raised px-4 py-3 text-ink shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject === 'Toutes' ? 'Toutes les matières' : subject}
                  </option>
                ))}
              </select>
            </div>
            
            {loading && (
              <div className="flex justify-center py-20">
                <Spinner />
              </div>
            )}

            {!loading && (
              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTeachers.map((teacher) => (
                  <Link key={teacher.id} to={`/teachers/${teacher.id}`} className="group relative flex flex-col overflow-hidden rounded-card bg-surface-raised shadow-card ring-1 ring-border transition-all hover:shadow-elevated hover:-translate-y-1 hover:ring-primary-200">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-primary-100">
                      {teacher.image ? (
                        <img src={teacher.image} alt={teacher.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">👤</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <p className="text-sm font-medium text-primary-600">{teacher.subject || 'Matière non renseignée'}</p>
                        <h3 className="mt-2 text-xl font-bold text-ink group-hover:text-primary-600 transition-colors">
                          {teacher.name}
                        </h3>
                        <p className="mt-1 text-xs text-ink-muted">{teacher.city || 'Ville non renseignée'}</p>
                        <p className="mt-3 text-sm text-ink-muted line-clamp-2">{teacher.description}</p>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                        <div className="text-sm font-bold text-ink">
                          {teacher.price || 'Tarif sur demande'}
                        </div>
                        <span className="text-sm font-semibold text-primary-600 group-hover:text-primary-500">Profil &rarr;</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && filteredTeachers.length === 0 && (
              <div className="mt-12">
                <EmptyState
                  icon="person"
                  title="Aucun tuteur ne correspond à vos critères"
                  description={
                    Object.keys(communeDepartmentMap).length === 0 || !teachers.some(t => communeDepartmentMap[t.city] !== undefined)
                      ? "Aucun tuteur enregistré dans ce pays pour le moment."
                      : "Essayez une autre région, une autre ville, ou un autre terme de recherche."
                  }
                  action={
                    <button
                      onClick={() => { setSearch(''); setCityFilter('Toutes'); setSubjectFilter('Toutes'); setSearchParams({ country }) }}
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
