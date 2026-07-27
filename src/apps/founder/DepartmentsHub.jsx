import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { useApiGet } from '../../shared/hooks/useApi.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Badge from '../../shared/ui/Badge.jsx'
import EmptyState from '../../shared/ui/EmptyState.jsx'
import Icon from '../../shared/ui/Icon.jsx'

const DEPARTMENTS = {
  secretary: { label: 'Secrétariat', icon: 'support_agent', description: 'Gère les admissions, les dossiers des élèves et la communication avec les parents.' },
  comptable: { label: 'Comptabilité', icon: 'account_balance_wallet', description: 'Gère les frais de scolarité, les factures, les paiements et la paie.' },
  censeur: { label: 'Censeur / Etudes', icon: 'menu_book', description: 'Supervise le cursus scolaire, les emplois du temps, les professeurs et les notes.' },
  surveillant: { label: 'Surveillant Général', icon: 'admin_panel_settings', description: 'Gère la discipline, contrôle les absences et les retards des élèves.' },
  hr: { label: 'Ressources Humaines', icon: 'groups', description: 'Gère le recrutement, les contrats et le personnel de l\'école.' },
  canteen: { label: 'Cantine', icon: 'restaurant', description: 'Gère les repas, les menus et les abonnements à la cantine.' },
  librarian: { label: 'Bibliothèque', icon: 'local_library', description: 'Gère les emprunts de livres et le catalogue de la bibliothèque.' },
  auditor: { label: 'Audit', icon: 'fact_check', description: 'Contrôle, audite les opérations et consulte les rapports globaux de l\'établissement.' },
  director: { label: 'Directeur', icon: 'school', description: 'Supervise l\'ensemble des opérations, approuve les décisions majeures.' }
}

export default function DepartmentsHub() {
  const { user } = useAuth()
  const [selectedDept, setSelectedDept] = useState(null)
  
  // All staff in the school's SaaS firebase (to see who is currently assigned)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(true)

  // Fetch local django staff directory for the dropdown
  const localStaff = useApiGet('/api/collab/staff-directory/')

  useEffect(() => {
    if (!user?.schoolId) return
    const q = query(collection(db, 'users'), where('schoolId', '==', user.schoolId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const m = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role && Object.keys(DEPARTMENTS).includes(data.role)) {
          m.push({ id: doc.id, ...data })
        }
      })
      setMembers(m)
      setMembersLoading(false)
    }, (err) => {
      console.error(err)
      setMembersLoading(false)
    })
    return () => unsubscribe()
  }, [user?.schoolId])

  if (selectedDept) {
    const deptInfo = DEPARTMENTS[selectedDept]
    const assignedStaff = members.filter(m => m.role === selectedDept)
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedDept(null)}
            className="p-2 rounded-full hover:bg-surface-raised text-ink-muted transition-colors"
            title="Retour aux départements"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <Icon name={deptInfo.icon} className="text-primary-600" />
              {deptInfo.label}
            </h2>
            <p className="text-sm text-ink-muted">{deptInfo.description}</p>
          </div>
        </div>

        <DepartmentManager 
          deptKey={selectedDept} 
          deptInfo={deptInfo} 
          assignedStaff={assignedStaff}
          loading={membersLoading}
          localStaffList={localStaff.data || []}
          currentUser={user}
        />
      </div>
    )
  }

  // Grid view
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink">Modules ERP & Départements</h2>
        <p className="text-sm text-ink-muted mt-1">
          Sélectionnez un département pour voir ses fonctionnalités et gérer le personnel qui y a accès sur la plateforme SaaS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(DEPARTMENTS).map(([key, info]) => {
          const staffCount = members.filter(m => m.role === key).length
          return (
            <div 
              key={key}
              onClick={() => setSelectedDept(key)}
              className="bg-surface rounded-xl border border-border p-5 hover:border-primary-400 hover:shadow-md cursor-pointer transition-all group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Icon name={info.icon} />
                </div>
                {membersLoading ? null : staffCount > 0 ? (
                  <Badge variant="blue">{staffCount} assigné{staffCount > 1 ? 's' : ''}</Badge>
                ) : (
                  <Badge variant="gray">Non assigné</Badge>
                )}
              </div>
              <h3 className="font-bold text-ink text-lg mb-2">{info.label}</h3>
              <p className="text-sm text-ink-muted flex-grow">{info.description}</p>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center text-primary-600 text-sm font-medium">
                Gérer ce département <Icon name="chevron_right" className="ml-1 text-[18px]" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DepartmentManager({ deptKey, deptInfo, assignedStaff, loading, localStaffList, currentUser }) {
  const [selectedEmail, setSelectedEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Filter local staff to those who are NOT already assigned to THIS department
  // (We use email to match since Django IDs != Firebase UIDs)
  const availableStaff = localStaffList.filter(ls => {
    return !assignedStaff.some(as => as.email === ls.email)
  })

  const handleAssign = async (emailToAssign) => {
    if (!emailToAssign) return
    setSubmitting(true)
    setStatus(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/school/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: emailToAssign, role: deptKey }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ kind: 'error', text: data.message || data.error || 'Erreur lors de l\'assignation' })
        return
      }

      setStatus({ kind: 'success', text: `${data.email} a maintenant accès à ${deptInfo.label}.` })
      setSelectedEmail('')
    } catch (error) {
      console.error(error)
      setStatus({ kind: 'error', text: 'Erreur réseau lors de l\'assignation. Réessayez.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    handleAssign(selectedEmail)
  }

  const handleSelfAssign = () => {
    handleAssign(currentUser.email)
  }

  const handleRevoke = async (uid) => {
    if (!window.confirm('Voulez-vous vraiment révoquer l\'accès SaaS de cet employé ?')) return
    setStatus(null)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch(`${getPlatformApiBaseUrl()}/api/school/staff/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus({ kind: 'error', text: data.error || 'Erreur lors de la révocation' })
        return
      }
      setStatus({ kind: 'success', text: 'Accès révoqué avec succès.' })
    } catch (error) {
      console.error(error)
      setStatus({ kind: 'error', text: 'Erreur réseau lors de la révocation.' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader 
          title="Affecter un employé" 
          subtitle="Sélectionnez un employé de votre école pour lui donner accès à ce module sur le SaaS." 
        />
        <CardBody>
          <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold leading-6 text-ink">Employé (Créé via les Registres)</label>
              <select
                required
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="mt-2 block w-full rounded-control border-0 px-3.5 py-2 text-ink shadow-sm ring-1 ring-inset ring-border bg-surface-raised focus:ring-2 focus:ring-primary-600 sm:text-sm"
              >
                <option value="">-- Sélectionner un employé --</option>
                {availableStaff.map((staff) => (
                  <option key={staff.id} value={staff.email}>
                    {staff.fullName} ({staff.email}) - {staff.role}
                  </option>
                ))}
              </select>
            </div>
            
            <Button type="submit" variant="primary" loading={submitting} disabled={!selectedEmail}>
              Affecter
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-4 border-t border-border pt-4">
            <span className="text-sm text-ink-muted">Besoin de tester vous-même ce module ?</span>
            <Button type="button" variant="outline" size="sm" onClick={handleSelfAssign} loading={submitting}>
              M'auto-assigner
            </Button>
          </div>

          {status && (
            <div className={`mt-4 p-4 rounded-control text-sm ${
              status.kind === 'error' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
            }`}>
              {status.text}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Personnel affecté" subtitle={`Employés ayant actuellement accès au module ${deptInfo.label}.`} />
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-ink-muted">Chargement de l'équipe...</div>
          ) : assignedStaff.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<Icon name="person_off" className="mx-auto h-12 w-12 text-ink-muted/50" />}
                title="Aucun personnel affecté"
                description="Personne n'a accès à ce module pour le moment."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {assignedStaff.map((member) => (
                <li key={member.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-surface-raised transition-colors">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-ink">{member.email}</span>
                    <span className="text-xs text-ink-muted">UID: {member.id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="blue">{deptInfo.label}</Badge>
                    <Button variant="danger" size="sm" onClick={() => handleRevoke(member.id)}>
                      Révoquer
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
