import { useParams, Link, useNavigate } from 'react-router-dom'
import { mockApi } from '../../shared/api/mockDb.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'

export default function SchoolDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const school = mockApi.getSchool(id)
  const jobs = mockApi.getJobs().filter(j => j.schoolId === parseInt(id))

  if (!school) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32">
        <EmptyState title="École introuvable" />
        <Link to="/schools" className="mt-4 inline-block text-primary-600 hover:underline">Retour à l'annuaire</Link>
      </div>
    )
  }

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-80 w-full md:h-96">
        <img src={school.image} alt={school.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:px-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{school.city}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">{school.cycle}</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{school.name}</h1>
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

      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-ink">À propos</h2>
            <p className="mt-4 text-lg text-ink-muted leading-relaxed">{school.description}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-ink">Offres d'emploi</h2>
            <div className="mt-6 space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between rounded-card bg-surface-raised p-6 shadow-card ring-1 ring-border transition hover:shadow-elevated">
                  <div>
                    <h3 className="font-bold text-ink">{job.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-ink-muted">
                      <span>{job.type}</span>
                      <span>&bull;</span>
                      <span>{job.posted}</span>
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
          <div className="rounded-card bg-surface-raised p-8 shadow-card ring-1 ring-border">
            <h3 className="font-bold text-ink text-xl mb-6">Performance</h3>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-ink-muted mb-1">Examen National</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-success-600">{school.successRate}%</span>
                  <span className="text-sm text-ink-muted mb-1">de réussite</span>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm font-medium text-ink-muted mb-1">Passage en classe supérieure (Interne)</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-ink">{school.internalRate}%</span>
                  <span className="text-sm text-ink-muted mb-1">de réussite</span>
                </div>
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  )
}
