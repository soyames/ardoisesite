import { useState, useEffect } from 'react'
import { api } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

export default function RecruitmentPanel() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [jobForm, setJobForm] = useState({ title: '', type: 'Temps Plein', description: '' })

  useEffect(() => {
    let active = true
    api.get('/api/auth/marketplace/applications/')
      .then(data => {
        if (active) {
          setApplications(data)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error(err)
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const handleJobSubmit = async (e) => {
    e.preventDefault()
    setPosting(true)
    try {
      await api.post('/api/auth/marketplace/jobs/', jobForm)
      alert("Offre publiée sur la Marketplace !")
      setJobForm({ title: '', type: 'Temps Plein', description: '' })
    } catch (err) {
      alert("Erreur lors de la publication.")
      console.error(err)
    } finally {
      setPosting(false)
    }
  }

  // NOTE: updating application status only exists on the client via Firestore directly for now.
  // The marketplace_client.py doesn't have an update method yet.
  // We can just keep it read-only here or re-implement the firestore status update if needed.
  // For the sake of the plan, we just show them.

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader title="Publier une offre d'emploi" subtitle="L'offre apparaîtra publiquement sur ardoise.soyames.com" />
        <CardBody>
          <form onSubmit={handleJobSubmit} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-ink">Titre du poste</label>
              <input required type="text" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" placeholder="ex: Professeur de Mathématiques" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Type de contrat</label>
              <select value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface">
                <option value="Temps Plein">Temps Plein</option>
                <option value="Temps Partiel">Temps Partiel</option>
                <option value="Vacataire">Vacataire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Description</label>
              <textarea required rows={4} value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-surface" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={posting}>
                {posting ? 'Publication...' : 'Publier sur la Marketplace'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Candidatures reçues" subtitle="Professeurs intéressés par vos annonces" />
        <CardBody>
          {applications.length === 0 ? (
            <EmptyState title="Aucune candidature" description="Vos annonces d'emploi n'ont pas encore reçu de candidatures récentes." />
          ) : (
            <ul className="space-y-4">
              {applications.map(a => (
                <li key={a.id} className="flex flex-col rounded-card border border-border p-4 shadow-card bg-surface-raised">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-ink text-lg">{a.teacherName}</p>
                      <p className="text-sm text-ink-muted">Postule pour : <span className="font-semibold text-ink">{a.jobTitle}</span></p>
                      <p className="text-sm text-ink-muted">Email : <a href={"mailto:" + a.email} className="text-primary-600 hover:underline">{a.email}</a></p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {a.motivation && (
                    <div className="mt-2 text-sm text-ink bg-surface p-3 rounded border border-border whitespace-pre-wrap">
                      <p className="text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Lettre de Motivation / CV</p>
                      {a.motivation}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
