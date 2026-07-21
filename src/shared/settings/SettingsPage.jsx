import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import ProfileTab from './ProfileTab.jsx'
import SessionsTab from './SessionsTab.jsx'
import MarketplaceAccountSettings from './MarketplaceAccountSettings.jsx'

const TABS = [
  { key: 'profile', label: 'Profil' },
  { key: 'sessions', label: 'Sessions' },
]

/**
 * Settings for a logged-in school-ERP account (Founder, Teacher,
 * Secretary, Parent, ...) - profile fields + password, and the
 * "who's logged in, from where" security list. Firestore-side
 * marketplace users (browsing schools/jobs, or a parent/teacher with
 * no school attached) have no Django backend to call at all - api.*
 * falls back to the platform Worker, which has no /api/auth/me/
 * route, so every request here 404'd/failed silently as "Failed to
 * fetch". Route those users to MarketplaceAccountSettings instead,
 * which writes straight to Firestore like RegisterPage.jsx does.
 */
export default function SettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')

  if (!user?.schoolId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Parametres</h1>
          <p className="mt-1 text-sm text-ink-muted">Votre profil et votre session.</p>
        </div>
        <MarketplaceAccountSettings />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Parametres</h1>
        <p className="mt-1 text-sm text-ink-muted">Votre profil et vos sessions actives.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t.key ? 'border-b-2 border-primary-600 text-primary-700' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'sessions' && <SessionsTab />}
    </div>
  )
}
