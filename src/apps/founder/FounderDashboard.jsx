import { useState, useEffect } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { mockApi } from '../../shared/api/mockDb.js'
import StatCard from '../../shared/ui/StatCard.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import Button from '../../shared/ui/Button.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

export default function FounderDashboard() {
  const { user } = useAuth()
  
  if (!user || user.role !== 'founder') {
    return <div className="py-20 text-center">Accès non autorisé</div>
  }

  const [school, setSchool] = useState(mockApi.getSchool(user.schoolId))
  const [enrollments, setEnrollments] = useState([])
  const [applications, setApplications] = useState([])
  
  const refreshData = () => {
    setSchool(mockApi.getSchool(user.schoolId))
    setEnrollments(mockApi.getEnrollmentsForSchool(user.schoolId))
    setApplications(mockApi.getApplicationsForSchool ? mockApi.getApplicationsForSchool(user.schoolId) : [])
  }

  useEffect(() => {
    refreshData()
  }, [])

  const pendingEnrollments = enrollments.filter(e => e.status === 'pending')

  const handleToggleCapacity = () => {
    mockApi.setSchoolCapacity(school.id, !school.isFull)
    refreshData()
  }

  const handleStatusUpdate = (id, newStatus) => {
    mockApi.updateEnrollmentStatus(id, newStatus)
    refreshData()
  }

  const handleAppStatusUpdate = (id, newStatus) => {
    mockApi.updateApplicationStatus(id, newStatus)
    refreshData()
  }

  const pendingApps = applications.filter(a => a.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord Fondateur</h1>
          <p className="mt-1 text-sm text-slate-500">Gérez {school?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">Capacité Atteinte ?</span>
          <button
            onClick={handleToggleCapacity}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${school?.isFull ? 'bg-red-500' : 'bg-slate-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${school?.isFull ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Inscriptions" value={pendingEnrollments.length} tone="warning" />
        <StatCard label="Candidatures" value={pendingApps.length} tone="primary" />
        <StatCard label="Total élèves" value={school?.students || 0} tone="neutral" />
        <StatCard label="Professeurs" value={school?.teachers || 0} tone="neutral" />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader title="Demandes d'inscription" subtitle="En attente de votre décision" />
          <CardBody>
            {pendingEnrollments.length === 0 ? (
              <EmptyState title="Aucune demande" description="Il n'y a pas de nouvelle demande d'inscription." />
            ) : (
              <ul className="space-y-4">
                {pendingEnrollments.map(e => (
                  <li key={e.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                    <div>
                      <p className="font-bold text-slate-900">{e.childName} <span className="text-sm font-normal text-slate-500">({e.childAge} ans)</span></p>
                      <p className="text-sm text-slate-600 mt-1">Classe demandée: <span className="font-semibold">{e.childClass}</span></p>
                      <p className="text-xs text-slate-400 mt-2">Parent: {e.parentName} &bull; {e.parentPhone}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(e.id, 'rejected')}>
                        Refuser
                      </Button>
                      <Button size="sm" onClick={() => handleStatusUpdate(e.id, 'accepted')}>
                        Accepter
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader title="Dernières candidatures reçues" subtitle="Professeurs intéressés par vos annonces" />
          <CardBody>
            {pendingApps.length === 0 ? (
              <EmptyState title="Aucune candidature" description="Vos annonces d'emploi n'ont pas encore reçu de candidatures récentes." />
            ) : (
              <ul className="space-y-4">
                {pendingApps.map(a => {
                  const job = mockApi.getJob(a.jobId)
                  return (
                    <li key={a.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                      <div>
                        <p className="font-bold text-slate-900">{a.teacherName}</p>
                        <p className="text-sm text-slate-600 mt-1">Poste: <span className="font-semibold">{job?.title}</span></p>
                        <p className="text-xs text-slate-400 mt-2">Email: {a.email}</p>
                        {a.motivation && <p className="text-sm text-slate-500 mt-2 italic border-l-2 border-indigo-200 pl-2">"{a.motivation}"</p>}
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleAppStatusUpdate(a.id, 'rejected')}>
                          Refuser
                        </Button>
                        <Button size="sm" onClick={() => handleAppStatusUpdate(a.id, 'accepted')}>
                          Accepter
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
