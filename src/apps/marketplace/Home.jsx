import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import Badge from '../../shared/ui/Badge.jsx'
import BeninMap from '../../shared/ui/BeninMap.jsx'
import { BENIN_COMMUNE_DEPARTMENT } from '../../shared/constants/beninGeoCommunes.js'
import { TEACHERS_DATA } from './TeacherList.jsx'

// Tutors aren't wired to Firestore yet - TeacherList/TeacherDetail still
// resolve profiles from TeacherDetail.jsx's TEACHER_DB mock, so pointing
// this teaser at real `users` docs would produce "Voir le profil" links
// that 404. Keeping this mock until that surface is rewired together.
const FEATURED_TUTORS = [
  { id: 1, name: 'Dr. Jean Dupont', subject: 'Mathématiques & Physique', rating: 4.9, price: '15 000 F', image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80' },
  { id: 2, name: 'Marie Mensah', subject: 'SVT & Chimie', rating: 4.8, price: '12 000 F', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
  { id: 3, name: 'Paul Kossi', subject: 'Philosophie & Français', rating: 5.0, price: '10 000 F', image: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&q=80' },
]

export default function Home() {
  const [schools, setSchools] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedCommune, setSelectedCommune] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schools'), (snapshot) => {
      const rows = []
      snapshot.forEach((d) => rows.push({ id: d.id, ...d.data() }))
      setSchools(rows)
    })
    return () => unsubscribe()
  }, [])

  const topSchools = useMemo(
    () => [...schools].sort((a, b) => (b.successRate || 0) - (a.successRate || 0)).slice(0, 3),
    [schools]
  )

  const cityCounts = useMemo(() => {
    const counts = {}
    schools.forEach((school) => {
      if (school.city) counts[school.city] = (counts[school.city] || 0) + 1
    })
    return counts
  }, [schools])

  const regionLabel = selectedCommune || selectedDepartment
  const schoolsHref = selectedCommune
    ? `/schools?commune=${encodeURIComponent(selectedCommune)}`
    : selectedDepartment
      ? `/schools?department=${encodeURIComponent(selectedDepartment)}`
      : '/schools'
  const teachersHref = selectedCommune
    ? `/teachers?commune=${encodeURIComponent(selectedCommune)}`
    : selectedDepartment
      ? `/teachers?department=${encodeURIComponent(selectedDepartment)}`
      : '/teachers'

  // Auto-filtered the moment a region is picked on the map - no extra
  // click needed to see who's actually there. The "Voir tout" links below
  // still go to /schools and /teachers for deeper per-commune/ville
  // browsing (those pages have their own map + filters already).
  const regionSchools = useMemo(() => {
    if (!regionLabel) return []
    return schools.filter((s) => (selectedCommune ? s.city === selectedCommune : BENIN_COMMUNE_DEPARTMENT[s.city] === selectedDepartment))
  }, [schools, selectedCommune, selectedDepartment, regionLabel])

  const regionTeachers = useMemo(() => {
    if (!regionLabel) return []
    return TEACHERS_DATA.filter((t) => (selectedCommune ? t.city === selectedCommune : BENIN_COMMUNE_DEPARTMENT[t.city] === selectedDepartment))
  }, [selectedCommune, selectedDepartment, regionLabel])

  return (
    <div className="flex flex-col bg-surface">
      {/* Premium Hero Section - the map itself is the hero now */}
      <section className="relative overflow-hidden bg-primary-950 pb-16 pt-20 sm:pt-32">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-accent-500 opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 rounded-card border border-white/10 bg-surface-raised p-8 shadow-elevated lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                L'excellence éducative, <span className="text-accent-600">à portée de clic</span>
              </h1>
              <p className="mt-4 max-w-xl text-ink-muted">
                Parcourez les écoles partenaires et les encadreurs (enseignant) par département. Cliquez une région pour voir les établissements et les enseignants qui s'y trouvent. Vous pouvez aussi filtrer par communes.
              </p>
            </div>
            <div className="flex justify-center">
              <BeninMap
                schoolCounts={cityCounts}
                selectedDepartment={selectedDepartment}
                onSelectDepartment={(dept) => { setSelectedDepartment(dept); setSelectedCommune(null) }}
                onSelectCommune={(commune) => setSelectedCommune(commune)}
              />
            </div>
          </div>

          {regionLabel && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-primary-200">
                  Resultats pour <span className="font-semibold text-white">{regionLabel}</span>
                </p>
                <button
                  onClick={() => { setSelectedDepartment(null); setSelectedCommune(null) }}
                  className="text-xs font-semibold text-primary-300 hover:text-primary-200"
                >
                  &larr; Effacer la selection
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <RegionResultsCard
                  title={`Écoles - ${regionLabel}`}
                  items={regionSchools}
                  emptyLabel={`Aucune école partenaire à ${regionLabel} pour le moment.`}
                  seeAllHref={schoolsHref}
                  renderItem={(school) => (
                    <Link key={school.id} to={`/schools/${school.id}`} className="flex items-center justify-between gap-2 rounded-control border border-border bg-surface p-3 hover:border-primary-200">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{school.name}</p>
                        <p className="text-xs text-ink-muted">{school.city}</p>
                      </div>
                      {school.successRate != null && <Badge tone="success">{school.successRate}%</Badge>}
                    </Link>
                  )}
                />
                <RegionResultsCard
                  title={`Enseignants - ${regionLabel}`}
                  items={regionTeachers}
                  emptyLabel={`Aucun enseignant a ${regionLabel} pour le moment.`}
                  seeAllHref={teachersHref}
                  renderItem={(teacher) => (
                    <Link key={teacher.id} to={`/teachers/${teacher.id}`} className="flex items-center justify-between gap-2 rounded-control border border-border bg-surface p-3 hover:border-primary-200">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{teacher.name}</p>
                        <p className="text-xs text-ink-muted">{teacher.subject} - {teacher.city}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-ink">
                        <span className="text-accent-500">★</span> {teacher.rating}
                      </div>
                    </Link>
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Top Ranked Schools Section */}
      <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Écoles d'Excellence</h2>
            <p className="mt-2 text-lg text-ink-muted">Les établissements les mieux classés cette année.</p>
          </div>
          <Link to="/schools" className="hidden text-sm font-semibold text-primary-600 hover:text-primary-500 sm:block">
            Voir tout le classement &rarr;
          </Link>
        </div>
        {topSchools.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {topSchools.map(school => (
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
          <p className="text-sm text-ink-muted">Les écoles partenaires apparaîtront ici dès leur inscription.</p>
        )}
      </section>

      {/* Featured Tutors Section */}
      <section className="bg-primary-950 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Tuteurs à Domicile</h2>
              <p className="mt-2 text-lg text-primary-300">Des professionnels certifiés pour accompagner votre enfant.</p>
            </div>
            <Link to="/teachers" className="hidden text-sm font-semibold text-accent-400 hover:text-accent-300 sm:block">
              Trouver par matière &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_TUTORS.map(tutor => (
              <div key={tutor.id} className="group relative flex flex-col rounded-card bg-primary-900 p-6 shadow-elevated ring-1 ring-white/10 transition-all hover:bg-primary-800">
                <div className="flex items-center gap-4">
                  <img src={tutor.image} alt={tutor.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-accent-500/30" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{tutor.name}</h3>
                    <p className="text-sm font-medium text-accent-400">{tutor.subject}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                  <div className="flex items-center gap-1 text-sm text-primary-200">
                    <span className="text-accent-400">★</span> {tutor.rating}/5
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {tutor.price} <span className="text-primary-300 font-normal">/ mois</span>
                  </div>
                </div>
                <Link to={`/teachers/${tutor.id}`} className="mt-6 flex w-full items-center justify-center rounded-control bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
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

function RegionResultsCard({ title, items, emptyLabel, seeAllHref, renderItem }) {
  return (
    <div className="rounded-card border border-border bg-surface-raised p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <Link to={seeAllHref} className="text-xs font-semibold text-primary-600 hover:text-primary-500">
          Voir tout &rarr;
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((item) => renderItem(item))}
        </div>
      )}
    </div>
  )
}
