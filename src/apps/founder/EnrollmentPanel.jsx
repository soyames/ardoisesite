import { useState, useEffect } from 'react'
import { api } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Spinner from '../../shared/ui/Spinner.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'

// Helper just for updating UI status in Firestore directly for the Marketplace
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'

export default function EnrollmentPanel() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get('/api/auth/marketplace/enrollment-requests/')
      .then(data => {
        if (active) {
          setEnrollments(data)
          setLoading(false)
        }
      })
      .catch(err => {
        console.error(err)
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (newStatus === 'accepted') {
        // We must pass through Django so it creates the Student and Parent locally!
        await api.post(`/api/auth/marketplace/enrollment-requests/${id}/accept/`)
      }
      
      // Update the Marketplace Firestore doc so parents see the status
      await updateDoc(doc(db, 'school_enrollment_requests', id), { status: newStatus })
      
      // Update local UI
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
      alert(`La demande a été ${newStatus === 'accepted' ? 'acceptée' : 'refusée'}.`)
    } catch (err) {
      alert("Une erreur est survenue.")
      console.error(err)
    }
  }

  if (loading) return <div className="py-10 flex justify-center"><Spinner /></div>

  const pendingEnrollments = enrollments.filter(e => e.status === 'pending')

  return (
    <Card>
      <CardHeader title="Demandes d'inscription" subtitle="Inscriptions reçues depuis ardoise.soyames.com" />
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
                  <p className="text-xs text-ink-muted mt-2">Parent: {e.parentName} &bull; {e.parentPhone} &bull; {e.parentEmail}</p>
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
  )
}