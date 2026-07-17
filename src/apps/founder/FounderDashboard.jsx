import { useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import SchoolSettings from './SchoolSettings.jsx'
import RecruitmentPanel from './RecruitmentPanel.jsx'
import EnrollmentPanel from './EnrollmentPanel.jsx'
import ApiIntegrations from './ApiIntegrations.jsx'
import SubscriptionPanel from './SubscriptionPanel.jsx'
import DepartmentsHub from './DepartmentsHub.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'

export default function FounderDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('departments')

  if (!user || !['founder', 'director'].includes(user.role)) {
    return <div className="py-20 text-center">Accès non autorisé</div>
  }

  const tabs = [
    { id: 'departments', label: 'Departements (ERP)' },
    { id: 'analytics', label: 'Analytique' },
    { id: 'overview', label: "Vue d'ensemble (Inscriptions)" },
    { id: 'recruitment', label: 'Recrutement' },
    { id: 'settings', label: "Paramètres de l'école" },
    { id: 'integrations', label: 'Intégrations API' },
    { id: 'subscription', label: 'Facturation & Abonnement' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tableau de bord Fondateur</h1>
          <p className="mt-1 text-sm text-ink-muted">Command Center</p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'departments' && <DepartmentsHub />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'overview' && <EnrollmentPanel />}
        {activeTab === 'recruitment' && <RecruitmentPanel />}
        {activeTab === 'settings' && <SchoolSettings />}
        {activeTab === 'integrations' && <ApiIntegrations schoolId={user.schoolId} />}
        {activeTab === 'subscription' && <SubscriptionPanel schoolId={user.schoolId} />}
      </div>
    </div>
  )
}