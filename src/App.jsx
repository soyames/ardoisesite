import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './shared/auth/AuthContext.jsx'
import RequireRole from './shared/auth/RequireRole.jsx'
import LoginPage from './shared/auth/LoginPage.jsx'
import RegisterPage from './shared/auth/RegisterPage.jsx'
import ForgotPasswordPage from './shared/auth/ForgotPasswordPage.jsx'
import { isSaasHost } from './shared/auth/domainRedirect.js'
import AppShell from './shared/layout/AppShell.jsx'
import EmptyState from './shared/ui/EmptyState.jsx'
import FounderDashboard from './apps/founder/FounderDashboard.jsx'
import ParentPortal from './apps/parent/ParentPortal.jsx'
import CashierPortal from './apps/cashier/CashierPortal.jsx'
import TeacherPortal from './apps/teacher/TeacherPortal.jsx'
import SecretaryPortal from './apps/secretary/SecretaryPortal.jsx'
import HrPortal from './apps/hr/HrPortal.jsx'
import ComptablePortal from './apps/comptable/ComptablePortal.jsx'
import CenseurPortal from './apps/censeur/CenseurPortal.jsx'
import SurveillantPortal from './apps/surveillant/SurveillantPortal.jsx'
import CanteenPortal from './apps/canteen/CanteenPortal.jsx'
import LibrarianPortal from './apps/librarian/LibrarianPortal.jsx'
import StudentPortal from './apps/student/StudentPortal.jsx'
import AuditorPortal from './apps/auditor/AuditorPortal.jsx'
import SuperadminDashboard from './apps/superadmin/SuperadminDashboard.jsx'
import DeveloperPortal from './apps/developer/DeveloperPortal.jsx'
import CollabHub from './shared/collab/CollabHub.jsx'
import SettingsPage from './shared/settings/SettingsPage.jsx'

// Public Marketplace Layout & Pages
import PublicLayout from './shared/layout/PublicLayout.jsx'
import SaasLanding from './apps/saas/SaasLanding.jsx'
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

// Settings (Profil + Sessions) is Django-backed (see SettingsPage.jsx)
// - added to every role that actually has a Django session on this
// school's ERP. superadmin/support_agent don't: AuthContext.jsx only
// calls /api/auth/firebase-login/ when a schoolId is known, and those
// two roles are platform-level Firestore accounts with no schoolId,
// so there's no Django session for a Settings page to manage here -
// their profile page is the separate marketplace-side one instead.
const SETTINGS_NAV_ITEM = { to: '/portal/settings', label: 'Parametres', end: false, icon: 'settings' }
// Every Stitch mockup pairs each nav item with a Material Symbols icon
// (see brand/DESIGN.md + shared/ui/Icon.jsx) - one per role here, kept
// alongside each item rather than in a lookup table since a given
// label ("Tableau de bord") can map to a different icon per role.
const collabItem = (icon) => ({ to: '/portal/collab', label: 'Collaboration', end: false, icon })

const NAV_BY_ROLE = {
  founder: [{ to: '/portal', label: 'Tableau de bord', end: true, icon: 'dashboard' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  director: [{ to: '/portal', label: 'Tableau de bord', end: true, icon: 'dashboard' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  parent: [{ to: '/portal', label: 'Mes enfants', end: true, icon: 'family_restroom' }, SETTINGS_NAV_ITEM],
  cashier: [{ to: '/portal', label: 'Encaissement', end: true, icon: 'point_of_sale' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  teacher: [{ to: '/portal', label: 'Mes classes', end: true, icon: 'school' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  secretary: [{ to: '/portal', label: 'Secretariat', end: true, icon: 'contact_page' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  hr: [{ to: '/portal', label: 'RH & Paie', end: true, icon: 'badge' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  comptable: [{ to: '/portal', label: 'Comptabilite', end: true, icon: 'account_balance' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  censeur: [{ to: '/portal', label: 'Censorat', end: true, icon: 'insights' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  surveillant: [{ to: '/portal', label: 'Surveillance', end: true, icon: 'shield' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  canteen: [{ to: '/portal', label: 'Cantine', end: true, icon: 'restaurant' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  librarian: [{ to: '/portal', label: 'Librairie', end: true, icon: 'menu_book' }, collabItem('forum'), SETTINGS_NAV_ITEM],
  student: [{ to: '/portal', label: 'Mon espace', end: true, icon: 'person' }, SETTINGS_NAV_ITEM],
  auditor: [{ to: '/portal', label: 'Audit', end: true, icon: 'fact_check' }, SETTINGS_NAV_ITEM],
  superadmin: [{ to: '/portal', label: 'Administration', end: true, icon: 'admin_panel_settings' }, collabItem('forum')],
  support_agent: [{ to: '/portal', label: 'Support Tickets', end: true, icon: 'support_agent' }, collabItem('forum')],
  developer: [{ to: '/portal', label: 'Espace Developpeur', end: true, icon: 'code' }, SETTINGS_NAV_ITEM],
}

const PORTAL_BY_ROLE = {
  founder: FounderDashboard,
  director: FounderDashboard,
  parent: ParentPortal,
  cashier: CashierPortal,
  teacher: TeacherPortal,
  secretary: SecretaryPortal,
  hr: HrPortal,
  comptable: ComptablePortal,
  censeur: CenseurPortal,
  surveillant: SurveillantPortal,
  canteen: CanteenPortal,
  librarian: LibrarianPortal,
  student: StudentPortal,
  auditor: AuditorPortal,
  superadmin: SuperadminDashboard,
  support_agent: SuperadminDashboard,
  developer: DeveloperPortal,
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

function Shell({ children }) {
  const { user } = useAuth()
  const navItems = NAV_BY_ROLE[user.role] ?? []
  return (
    <AppShell navItems={navItems}>
      {children || <PortalHome />}
    </AppShell>
  )
}

function DomainRouter() {
  return isSaasHost() ? <SaasLanding /> : <Home />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Public Marketplace Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<DomainRouter />} />
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
        <Route
          path="/portal/collab"
          element={
            <RequireRole>
              <Shell>
                <CollabHub />
              </Shell>
            </RequireRole>
          }
        />
        <Route
          path="/portal/settings"
          element={
            <RequireRole>
              <Shell>
                <SettingsPage />
              </Shell>
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
