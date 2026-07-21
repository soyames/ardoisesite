import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { api, ApiError } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import { useSchoolSubscription } from '../../shared/hooks/useSchoolSubscription.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'

/**
 * Shared between FounderDashboard (Founder/Director) and
 * CenseurPortal.jsx's "Candidatures" tab - Censeur "could be involved
 * in the process" for teaching hires, but the final decision stays
 * with Founder/Directeur (see MarketplaceApplicationAcceptView's own
 * docstring), so canDecide gates both the job-posting form and the
 * Accepter button. A Censeur viewing this sees the same list, read-only.
 */
export default function RecruitmentPanel() {
  const { user } = useAuth()
  const canDecide = user?.role === 'founder' || user?.role === 'director'
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [acceptingId, setAcceptingId] = useState(null)
  const [jobForm, setJobForm] = useState({ title: '', type: 'Temps Plein', description: '' })
  const { isPremium } = useSchoolSubscription()

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

  const handleAccept = async (application) => {
    if (!confirm(`Accepter la candidature de ${application.teacherName} ? Un dossier personnel sera cree - le Comptable en completera les details (compte bancaire/Mobile Money, contrat...).`)) return
    setAcceptingId(application.id)
    try {
      await api.post(`/api/auth/marketplace/applications/${application.id}/accept/`, {})
      try {
        await updateDoc(doc(db, 'job_applications', application.id), { status: 'accepted' })
      } catch (e) {
        console.warn('Failed to update Firestore application status:', e)
      }
      setApplications((prev) => prev.filter((a) => a.id !== application.id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de l'acceptation.")
    } finally {
      setAcceptingId(null)
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>

  return (
    <div className="space-y-8">
      {canDecide && (
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
      )}

      <Card>
        <CardHeader
          title="Candidatures reçues"
          subtitle={canDecide ? "Professeurs intéressés par vos annonces" : "Lecture seule - la decision finale revient au Fondateur ou au Directeur"}
        />
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
                      {isPremium ? (
                        <p className="text-sm text-ink-muted">Email : <a href={"mailto:" + a.email} className="text-primary-600 hover:underline">{a.email}</a></p>
                      ) : (
                        <div className="mt-2 rounded-card bg-accent-50 p-3 border border-accent-200">
                          <p className="text-sm text-accent-800">
                            <strong>Mise a niveau requise :</strong> <a href="https://saas.ardoise.soyames.com/pricing" className="underline font-semibold" target="_blank" rel="noreferrer">Passez a la version Premium</a> pour voir les coordonnees et contacter ce candidat.
                          </p>
                        </div>
                      )}
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

                  {canDecide && (
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => handleAccept(a)} disabled={acceptingId === a.id || !isPremium}>
                        {acceptingId === a.id ? 'Acceptation...' : 'Accepter'}
                      </Button>
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
