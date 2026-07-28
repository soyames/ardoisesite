import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import Badge from '../../shared/ui/Badge.jsx'
import CountryMapWrapper from '../../shared/ui/CountryMapWrapper.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import { useGeo } from '../../shared/geo/GeoContext.jsx'
import { OHADA_COUNTRIES } from '../../shared/constants/locations.js'
import { useSeo } from '../../shared/hooks/useSeo.js'

export default function Home() {
  const [schools, setSchools] = useState([])
  const [teachers, setTeachers] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedCommune, setSelectedCommune] = useState(null)
  // GeoGate already guarantees a resolved OHADA country before Home ever
  // renders - the visitor's own country, not a user-chosen one.
  const { countryCode: activeCountry } = useGeo()
  const [communeDepartmentMap, setCommuneDepartmentMap] = useState({})

  const activeCountryName = OHADA_COUNTRIES.find((c) => c.code === activeCountry)?.name || activeCountry
  useSeo({
    title: `Écoles et tuteurs à ${activeCountryName}`,
    description: `Trouvez les meilleures écoles et tuteurs à domicile à ${activeCountryName}. Annuaire, classements, mise en relation directe - Ardoise, la plateforme de l'espace OHADA.`,
  })

  // Clear selections when country changes
  useEffect(() => {
    setSelectedDepartment(null)
    setSelectedCommune(null)
  }, [activeCountry])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schools'), (snapshot) => {
      const rows = []
      snapshot.forEach((d) => rows.push({ id: d.id, ...d.data() }))
      setSchools(rows)
    })
    return () => unsubscribe()
  }, [])

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
          price: data.price != null ? `${data.price} F` : null,
          image: data.image || null,
        })
      })
      setTeachers(rows)
    })
    return () => unsubscribe()
  }, [])

  const activeSchools = useMemo(() => {
    return schools.filter((s) => communeDepartmentMap[s.city] !== undefined)
  }, [schools, communeDepartmentMap])

  const topSchools = useMemo(
    () => [...activeSchools].sort((a, b) => (b.successRate || 0) - (a.successRate || 0)).slice(0, 3),
    [activeSchools]
  )

  const cityCounts = useMemo(() => {
    const counts = {}
    activeSchools.forEach((school) => {
      if (school.city) counts[school.city] = (counts[school.city] || 0) + 1
    })
    return counts
  }, [activeSchools])

  const regionLabel = selectedCommune || selectedDepartment
  const schoolsHref = selectedCommune
    ? `/schools?country=${activeCountry}&commune=${encodeURIComponent(selectedCommune)}`
    : selectedDepartment
      ? `/schools?country=${activeCountry}&department=${encodeURIComponent(selectedDepartment)}`
      : `/schools?country=${activeCountry}`
  const teachersHref = selectedCommune
    ? `/teachers?country=${activeCountry}&commune=${encodeURIComponent(selectedCommune)}`
    : selectedDepartment
      ? `/teachers?country=${activeCountry}&department=${encodeURIComponent(selectedDepartment)}`
      : `/teachers?country=${activeCountry}`

  // Auto-filtered the moment a region is picked on the map - no extra
  // click needed to see who's actually there. The "Voir tout" links below
  // still go to /schools and /teachers for deeper per-commune/ville
  // browsing (those pages have their own map + filters already).
  const regionSchools = useMemo(() => {
    if (!regionLabel) return []
    return activeSchools.filter((s) => (selectedCommune ? s.city === selectedCommune : communeDepartmentMap[s.city] === selectedDepartment))
  }, [activeSchools, selectedCommune, selectedDepartment, regionLabel, communeDepartmentMap])

  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => communeDepartmentMap[t.city] !== undefined)
  }, [teachers, communeDepartmentMap])

  const regionTeachers = useMemo(() => {
    if (!regionLabel) return []
    return activeTeachers.filter((t) => (selectedCommune ? t.city === selectedCommune : communeDepartmentMap[t.city] === selectedDepartment))
  }, [activeTeachers, selectedCommune, selectedDepartment, regionLabel, communeDepartmentMap])

  const featuredTutors = useMemo(() => {
    return activeTeachers.slice(0, 3)
  }, [activeTeachers])

  // "Ecoles d'Excellence"/"Tuteurs a Domicile" below used to always show
  // the country-wide top-ranked/first-3 list regardless of the map
  // selection - clicking a department/commune had no visible effect on
  // the sections a visitor was actually looking at (a separate "Resultats
  // pour X" block above the map DID filter correctly, but that's not
  // what "Ecoles d'Excellence not changing" was reporting). These two
  // now switch to the full region-filtered list once a department/
  // commune is selected, showing every match (not capped at 3) with an
  // explicit empty state - matching /schools and /teachers' own
  // department/commune filtering exactly.
  const displaySchools = regionLabel ? regionSchools : topSchools
  const displayTeachers = regionLabel ? regionTeachers : featuredTutors

  return (
    <div className="flex flex-col bg-surface">
      {/* Premium Hero Section - the map itself is the hero now */}
      <section className="relative overflow-hidden bg-primary-950 pb-16 pt-20 sm:pt-32">
        {/* Soft glow via radial-gradient, not filter: blur() - a large
            blurred layer sitting behind content that repaints often (the
            map's hover states below) is a known GPU-compositing trigger
            for visible tearing/ghosting on some Windows GPU drivers. A
            gradient gives the same soft-glow look with no blur cost. */}
        <div
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[600px] sm:-top-60 sm:h-[800px]"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.68 0.1108 72 / 0.15), transparent 70%)' }}
          aria-hidden="true"
        />
        
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-10 rounded-card border border-white/10 bg-surface-raised p-8 shadow-elevated lg:grid-cols-[1fr_450px] lg:items-center xl:grid-cols-[1fr_550px]">
            <div>
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-control border border-white/20 bg-primary-900/50 py-2 pl-3 pr-4 text-sm font-semibold text-white shadow-sm">
                <Icon name="location_on" className="text-base" />
                {OHADA_COUNTRIES.find((c) => c.code === activeCountry)?.name || activeCountry}
              </div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                L'excellence éducative, <span className="text-accent-600">à portée de clic</span>
              </h1>
              <p className="mt-4 max-w-xl text-ink-muted">
                Parcourez les écoles partenaires et les encadreurs (enseignant) par département. Cliquez une région pour voir les établissements et les enseignants qui s'y trouvent. Vous pouvez aussi filtrer par communes.
              </p>
            </div>
            <div className="flex justify-center">
              <CountryMapWrapper
                countryCode={activeCountry}
                onMapDataLoaded={(data) => setCommuneDepartmentMap(data?.communeDepartmentMap || {})}
                schoolCounts={cityCounts}
                selectedDepartment={selectedDepartment}
                selectedCommune={selectedCommune}
                onSelectDepartment={(dept) => { setSelectedDepartment(dept); setSelectedCommune(null) }}
                onSelectCommune={(commune) => setSelectedCommune((c) => (c === commune ? null : commune))}
              />
            </div>
          </div>

          {regionLabel && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              <span className="text-primary-200">
                Filtre actif : <span className="font-semibold text-white">{regionLabel}</span>
              </span>
              <button
                onClick={() => { setSelectedDepartment(null); setSelectedCommune(null) }}
                className="font-semibold text-primary-300 hover:text-primary-200"
              >
                &larr; Effacer
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Top Ranked Schools Section (or, once a department/commune is
          selected on the map above, every school in that region) */}
      <section className="mx-auto max-w-[1600px] px-6 py-24 sm:py-32 lg:px-12">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {regionLabel ? `Écoles - ${regionLabel}` : "Écoles d'Excellence"}
            </h2>
            <p className="mt-2 text-lg text-ink-muted">
              {regionLabel ? `Établissements partenaires à ${regionLabel}.` : 'Les établissements les mieux classés cette année.'}
            </p>
          </div>
          <Link to={schoolsHref} className="hidden text-sm font-semibold text-primary-600 hover:text-primary-500 sm:block">
            {regionLabel ? 'Voir sur la carte des écoles' : 'Voir tout le classement'} &rarr;
          </Link>
        </div>
        {displaySchools.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {displaySchools.map(school => (
              <Link key={school.id} to={`/schools/${school.id}`} className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-raised shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className="aspect-[16/9] w-full overflow-hidden bg-primary-100">
                  {school.image ? (
                    <img src={school.image} alt={school.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🏫</div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-ink">{school.name}</h3>
                    {school.successRate != null && <Badge tone="success">{school.successRate}% Réussite</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{school.city}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            {regionLabel ? `Aucune école partenaire à ${regionLabel} pour le moment.` : 'Aucune école enregistrée dans ce pays pour le moment.'}
          </p>
        )}
      </section>

      {/* Featured Tutors Section (or, once a department/commune is
          selected, every tutor in that region) */}
      <section className="bg-primary-950 py-24 sm:py-32">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {regionLabel ? `Enseignants - ${regionLabel}` : 'Tuteurs à Domicile'}
              </h2>
              <p className="mt-2 text-lg text-primary-300">
                {regionLabel ? `Tuteurs à domicile disponibles à ${regionLabel}.` : 'Des professionnels certifiés pour accompagner votre enfant.'}
              </p>
            </div>
            <Link to={teachersHref} className="hidden text-sm font-semibold text-accent-400 hover:text-accent-300 sm:block">
              {regionLabel ? 'Voir sur la carte des enseignants' : 'Trouver par matière'} &rarr;
            </Link>
          </div>
          {displayTeachers.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {displayTeachers.map(tutor => (
                <div key={tutor.id} className="group relative flex flex-col rounded-card bg-primary-900 p-6 shadow-elevated ring-1 ring-white/10 transition-all hover:bg-primary-800">
                  <div className="flex items-center gap-4">
                    {tutor.image ? (
                      <img src={tutor.image} alt={tutor.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-accent-500/30" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-800 text-2xl ring-2 ring-accent-500/30">👤</div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{tutor.name}</h3>
                      <p className="text-sm font-medium text-accent-400">{tutor.subject || 'Matière non renseignée'}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-end border-t border-white/10 pt-6">
                    <div className="text-sm font-semibold text-white">
                      {tutor.price || 'Tarif sur demande'} {tutor.price && <span className="text-primary-300 font-normal">/ mois</span>}
                    </div>
                  </div>
                  <Link to={`/teachers/${tutor.id}`} className="mt-6 flex w-full items-center justify-center rounded-control bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                    Voir le profil
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-primary-300">
              {regionLabel ? `Aucun enseignant à ${regionLabel} pour le moment.` : 'Aucun enseignant enregistré dans ce pays pour le moment.'}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
