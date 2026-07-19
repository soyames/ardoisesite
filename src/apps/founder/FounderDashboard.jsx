import { useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import SchoolSettings from './SchoolSettings.jsx'
import RecruitmentPanel from './RecruitmentPanel.jsx'
import EnrollmentPanel from './EnrollmentPanel.jsx'
import ApiIntegrations from './ApiIntegrations.jsx'
import SubscriptionPanel from './SubscriptionPanel.jsx'
import DepartmentsHub from './DepartmentsHub.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import SupportPage from './SupportPage.jsx'
import PortalTabs from '../../shared/ui/PortalTabs.jsx'

export default function FounderDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (!user || !['founder', 'director'].includes(user.role)) {
    return <div className="py-20 text-center">Accès non autorisé</div>
  }

  const tabs = [
    { key: 'dashboard', label: 'Tableau de bord' },
    { key: 'departments', label: 'Departements (ERP)' },
    { key: 'overview', label: "Vue d'ensemble (Inscriptions)" },
    { key: 'recruitment', label: 'Recrutement' },
    { key: 'settings', label: "Paramètres de l'école" },
    { key: 'integrations', label: 'Intégrations API' },
    { key: 'subscription', label: 'Facturation & Abonnement' },
    { key: 'support', label: 'Support & Aide' }
  ]

  return (
    <div className="space-y-6">
      {activeTab !== 'dashboard' && (
        <div>
          <h1 className="text-2xl font-bold text-ink">Tableau de bord Fondateur</h1>
          <p className="mt-1 text-sm text-ink-muted">Command Center</p>
        </div>
      )}

      <PortalTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'dashboard' && <AnalyticsDashboard onNavigate={setActiveTab} />}
        {activeTab === 'departments' && <DepartmentsHub />}
        {activeTab === 'overview' && <EnrollmentPanel />}
        {activeTab === 'recruitment' && <RecruitmentPanel />}
        {activeTab === 'settings' && <SchoolSettings />}
        { activeTab === 'integrations' && <ApiIntegrations schoolId={user.schoolId} /> }
        { activeTab === 'subscription' && <SubscriptionPanel schoolId={user.schoolId} /> }
        { activeTab === 'support' && <SupportPage /> }
      </div>
    </div>
  )
}