import { useState, useEffect } from 'react'
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import StatCard from '../../shared/ui/StatCard.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'

import ApiIntegrations from './ApiIntegrations.jsx'

export default function FounderDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const [school, setSchool] = useState(undefined)
  const [enrollments, setEnrollments] = useState([])
  const [applications, setApplications] = useState([])

  const schoolId = user?.schoolId

  useEffect(() => {
    if (!schoolId) return
    let cancelled = false
    getDoc(doc(db, 'schools', schoolId)).then((snap) => {
      if (!cancelled) setSchool(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
    return () => { cancelled = true }
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'school_enrollment_requests'), where('schoolId', '==', schoolId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const e = []
      snapshot.forEach((d) => e.push({ id: d.id, ...d.data() }))
      setEnrollments(e)
    })
    return () => unsubscribe()
  }, [schoolId])

  useEffect(() => {
    if (!schoolId) return
    const q = query(collection(db, 'job_applications'), where('schoolId', '==', schoolId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const a = []
      snapshot.forEach((d) => a.push({ id: d.id, ...d.data() }))
      setApplications(a)
    })
    return () => unsubscribe()
  }, [schoolId])

  if (!user || user.role !== 'founder') {
    return <div className="py-20 text-center">Accès non autorisé</div>
  }

  const pendingEnrollments = enrollments.filter(e => e.status === 'pending')
  const pendingApps = applications.filter(a => a.status === 'pending')

  const handleToggleCapacity = async () => {
    if (!school) return
    await updateDoc(doc(db, 'schools', school.id), { isFull: !school.isFull })
    setSchool((prev) => ({ ...prev, isFull: !prev.isFull }))
  }

  const handleStatusUpdate = async (id, newStatus) => {
    await updateDoc(doc(db, 'school_enrollment_requests', id), { status: newStatus })
  }

  const handleAppStatusUpdate = async (id, newStatus) => {
    await updateDoc(doc(db, 'job_applications', id), { status: newStatus })
  }

  if (school === undefined) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tableau de bord Fondateur</h1>
          <p className="mt-1 text-sm text-ink-muted">Gérez {school?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink">Capacité Atteinte ?</span>
          <button
            onClick={handleToggleCapacity}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${school?.isFull ? 'bg-danger-500' : 'bg-primary-100'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${school?.isFull ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            Intégrations API (Paiements & WhatsApp)
          </button>
        </nav>
      </div>

      {activeTab === 'overview' ? (
        <>
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
                      <li key={e.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-card border border-border p-4 shadow-card bg-surface-raised">
                        <div>
                          <p className="font-bold text-ink">{e.childName} <span className="text-sm font-normal text-ink-muted">({e.childAge} ans)</span></p>
                          <p className="text-sm text-ink-muted mt-1">Classe demandée: <span className="font-semibold">{e.childClass}</span></p>
                          <p className="text-xs text-ink-muted mt-2">Parent: {e.parentName} &bull; {e.parentPhone}</p>
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
                    {pendingApps.map(a => (
                      <li key={a.id} className="flex flex-col md:flex-row md:items-center justify-between rounded-card border border-border p-4 shadow-card bg-surface-raised">
                        <div>
                          <p className="font-bold text-ink">{a.teacherName}</p>
                          <p className="text-sm text-ink-muted mt-1">Poste: <span className="font-semibold">{a.jobTitle}</span></p>
                          <p className="text-xs text-ink-muted mt-2">Email: {a.email}</p>
                          {a.motivation && <p className="text-sm text-ink-muted mt-2 italic border-l-2 border-primary-200 pl-2">"{a.motivation}"</p>}
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
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        <ApiIntegrations schoolId={school?.id} />
      )}
    </div>
  )
}
