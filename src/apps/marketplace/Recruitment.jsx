import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

export default function Recruitment() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const j = []
      snapshot.forEach((d) => j.push({ id: d.id, ...d.data() }))
      setJobs(j)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    (job.schoolName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Opportunités de Carrière
          </h2>
          <p className="mt-4 text-xl text-ink-muted">
            Rejoignez les meilleures écoles. Consultez les appels à candidatures.
          </p>
        </div>

        <div className="mb-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Rechercher un poste ou une école..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-control border-0 px-6 py-4 text-ink shadow-sm ring-1 ring-inset ring-border placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-lg"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="group relative flex flex-col md:flex-row items-start md:items-center justify-between rounded-card bg-surface-raised p-6 shadow-card ring-1 ring-border transition hover:shadow-elevated hover:ring-primary-200">
              <div className="flex items-center gap-6">
                {job.schoolImage && <img src={job.schoolImage} alt={job.schoolName} className="h-16 w-16 rounded-control object-cover ring-1 ring-border" />}
                <div>
                  <h3 className="text-xl font-bold text-ink group-hover:text-primary-600 transition-colors">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                    <span className="font-semibold text-ink">{job.schoolName}</span>
                    <span>&bull;</span>
                    <span>{job.schoolCity}</span>
                    <span>&bull;</span>
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold">{job.type}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex flex-col items-end gap-3 w-full md:w-auto">
                <button onClick={() => navigate(`/jobs/${job.id}/apply`)} className="w-full md:w-auto rounded-control bg-surface-raised px-6 py-2.5 text-sm font-semibold text-primary-600 ring-1 ring-inset ring-primary-200 transition hover:bg-primary-50">
                  Postuler
                </button>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="py-20">
              <EmptyState title="Aucune offre ne correspond à votre recherche." />
            </div>
          )}
        </div>
        )}

      </div>
    </div>
  )
}

