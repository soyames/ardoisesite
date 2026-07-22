import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

export default function SchoolDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [school, setSchool] = useState(undefined) // undefined = loading, null = not found
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    let cancelled = false
    getDoc(doc(db, 'schools', id)).then((snap) => {
      if (cancelled) return
      setSchool(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      
      // Fetch rating from backend
      if (snap.exists()) {
        import('../../shared/api/client.js').then(({ api }) => {
          api.get(`/api/core/school-ratings/${snap.id}/`)
            .then(res => {
              if (!cancelled && res?.average_rating !== undefined) {
                setSchool(prev => prev ? { ...prev, rating: res.average_rating } : prev)
              }
            })
            .catch(err => console.error("Failed to fetch rating", err))
        })
      }
    }).catch(() => { if (!cancelled) setSchool(null) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'jobs'), where('schoolId', '==', id))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const j = []
      snapshot.forEach((d) => j.push({ id: d.id, ...d.data() }))
      setJobs(j)
    })
    return () => unsubscribe()
  }, [id])

  if (school === undefined) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    )
  }

  if (!school) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32">
        <EmptyState title="École introuvable" />
        <Link to="/schools" className="mt-4 inline-block text-primary-600 hover:underline">Retour à l'annuaire</Link>
      </div>
    )
  }

  // A school that just self-registered via RegisterPage.jsx only has
  // name/city/country/backendUrl/isFull set -- the richer marketplace
  // profile (image, description, cycle, stats) is filled in later.
  // Fall back to honest placeholders rather than rendering "undefined".
  const description = school.description || "Cette école n'a pas encore complété sa présentation publique."
  const image = school.image || null
  const cycle = school.cycle || null
  const hasStats = school.successRate != null || school.internalRate != null
  const hasCounts = school.students != null || school.teachers != null || school.established != null

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-80 w-full md:h-96 bg-primary-100">
        {image && <img src={image} alt={school.name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:px-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {school.city && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{school.city}</span>}
                {cycle && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{cycle}</span>}
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{school.name}</h1>
              {school.rating != null && (
                <div className="mt-3 flex items-center justify-start gap-1 text-warning-400">
                  <span className="material-symbols-outlined font-variation-fill text-xl">star</span>
                  <span className="text-lg font-bold">{Number(school.rating).toFixed(1)}</span>
                  <span className="text-sm text-primary-300 ml-1">/ 5.0</span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/schools/${school.id}/enroll`)}
              disabled={school.isFull}
              className={`whitespace-nowrap rounded-control px-8 py-4 text-sm font-bold shadow-elevated transition ${school.isFull ? 'bg-primary-400 text-white cursor-not-allowed' : 'bg-accent-500 text-primary-950 hover:bg-accent-400 hover:scale-105'}`}
            >
              {school.isFull ? 'Capacité Atteinte (Complet)' : 'Demander l\'inscription'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 lg:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-ink">À propos</h2>
            <p className="mt-4 text-lg text-ink-muted leading-relaxed">{description}</p>
          </section>

          {(school.enrollmentRequirements || school.hasPreselectionTest) && (
            <section className="bg-primary-50 rounded-xl p-6 border border-primary-100">
              <h2 className="text-2xl font-bold text-primary-900 mb-4">Conditions d'admission</h2>
              {school.enrollmentRequirements && (
                <div className="mb-4">
                  <h3 className="font-bold text-primary-800 mb-2">Pièces à fournir :</h3>
                  <p className="text-primary-900 whitespace-pre-wrap">{school.enrollmentRequirements}</p>
                </div>
              )}
              {school.hasPreselectionTest && (
                <div className="flex items-center gap-2 text-accent-700 font-semibold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Cette école exige un test de présélection.
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold text-ink">Offres d'emploi</h2>
            <div className="mt-6 space-y-4">
              {jobs.length === 0 && (
                <p className="text-sm text-ink-muted">Aucune offre d'emploi publiée pour le moment.</p>
              )}
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between rounded-card bg-surface-raised p-6 shadow-card ring-1 ring-border transition hover:shadow-elevated">
                  <div>
                    <h3 className="font-bold text-ink">{job.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-ink-muted">
                      <span>{job.type}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/jobs/${job.id}/apply`)} className="text-sm font-semibold text-primary-600 hover:text-primary-500">Postuler &rarr;</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {hasStats && (
          <div className="rounded-card bg-surface-raised p-8 shadow-card ring-1 ring-border">
            <h3 className="font-bold text-ink text-xl mb-6">Performance</h3>
            <div className="space-y-6">
              {school.successRate != null && (
              <div>
                <p className="text-sm font-medium text-ink-muted mb-1">Examen National</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-success-600">{school.successRate}%</span>
                  <span className="text-sm text-ink-muted mb-1">de réussite</span>
                </div>
              </div>
              )}
              {school.successRate != null && school.internalRate != null && <div className="h-px bg-border" />}
              {school.internalRate != null && (
              <div>
                <p className="text-sm font-medium text-ink-muted mb-1">Passage en classe supérieure (Interne)</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-ink">{school.internalRate}%</span>
                  <span className="text-sm text-ink-muted mb-1">de réussite</span>
                </div>
              </div>
              )}
            </div>
          </div>
          )}

          {hasCounts && (
          <div className="rounded-card bg-primary-900 p-8 shadow-card">
            <h3 className="font-bold text-white text-xl mb-6">En chiffres</h3>
            <dl className="space-y-4 text-sm text-primary-300">
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
          )}
        </div>
      </div>
    </div>
  )
}
