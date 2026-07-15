import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './shared/auth/AuthContext.jsx'
import RequireRole from './shared/auth/RequireRole.jsx'
import LoginPage from './shared/auth/LoginPage.jsx'
import RegisterPage from './shared/auth/RegisterPage.jsx'
import AppShell from './shared/layout/AppShell.jsx'
import EmptyState from './shared/ui/EmptyState.jsx'
import FounderDashboard from './apps/founder/FounderDashboard.jsx'
import ParentPortal from './apps/parent/ParentPortal.jsx'
import CashierPortal from './apps/cashier/CashierPortal.jsx'
import TeacherPortal from './apps/teacher/TeacherPortal.jsx'

// Public Marketplace Layout & Pages
import PublicLayout from './shared/layout/PublicLayout.jsx'
import Home from './apps/marketplace/Home.jsx'
import SchoolList from './apps/marketplace/SchoolList.jsx'
import SchoolDetail from './apps/marketplace/SchoolDetail.jsx'
import SchoolEnrollment from './apps/marketplace/SchoolEnrollment.jsx'
import JobApplicationFlow from './apps/marketplace/JobApplicationFlow.jsx'
import TeacherList from './apps/marketplace/TeacherList.jsx'
import TeacherDetail from './apps/marketplace/TeacherDetail.jsx'
import TutoringBookingFlow from './apps/marketplace/TutoringBookingFlow.jsx'
import Recruitment from './apps/marketplace/Recruitment.jsx'
import TeacherMarketplaceDashboard from './apps/marketplace/TeacherMarketplaceDashboard.jsx'
import Privacy from './apps/marketplace/Privacy.jsx'
import Terms from './apps/marketplace/Terms.jsx'
import InstallGuide from './apps/marketplace/InstallGuide.jsx'
import ContactForm from './apps/marketplace/ContactForm.jsx'
import HowItWorks from './apps/marketplace/HowItWorks.jsx'

const NAV_BY_ROLE = {
  founder: [{ to: '/portal', label: 'Tableau de bord', end: true }],
  director: [{ to: '/portal', label: 'Tableau de bord', end: true }],
  parent: [{ to: '/portal', label: 'Mes enfants', end: true }],
  cashier: [{ to: '/portal', label: 'Encaissement', end: true }],
  teacher: [{ to: '/portal', label: 'Mes classes', end: true }],
}

const PORTAL_BY_ROLE = {
  founder: FounderDashboard,
  director: FounderDashboard,
  parent: ParentPortal,
  cashier: CashierPortal,
  teacher: TeacherPortal,
}

function PortalHome() {
  const { user } = useAuth()
  const Portal = PORTAL_BY_ROLE[user.role]
  if (!Portal) {
    return (
      <EmptyState
        title={`Portail ${user.role_display} pas encore disponible`}
        description="Cette interface n'a pas encore ete construite pour ce role. Contactez l'administrateur si vous pensez que c'est une erreur."
      />
    )
  }
  return <Portal />
}

function Shell() {
  const { user } = useAuth()
  const navItems = NAV_BY_ROLE[user.role] ?? []
  return (
    <AppShell navItems={navItems}>
      <PortalHome />
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Public Marketplace Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/schools" element={<SchoolList />} />
          <Route path="/schools/:id" element={<SchoolDetail />} />
          <Route path="/schools/:id/enroll" element={<SchoolEnrollment />} />
          <Route path="/teachers" element={<TeacherList />} />
          <Route path="/teachers/:id" element={<TeacherDetail />} />
          <Route path="/teachers/:id/book" element={<TutoringBookingFlow />} />
          <Route path="/jobs" element={<Recruitment />} />
          <Route path="/jobs/:id/apply" element={<JobApplicationFlow />} />
          <Route path="/teacher-dashboard" element={<TeacherMarketplaceDashboard />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="install" element={<InstallGuide />} />
          <Route path="contact" element={<ContactForm />} />
          <Route path="how-it-works" element={<HowItWorks />} />
        </Route>

        {/* Private School Portal Routes */}
        <Route
          path="/portal"
          element={
            <RequireRole>
              <Shell />
            </RequireRole>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
