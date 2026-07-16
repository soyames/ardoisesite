import { useState } from 'react'
import ProfileTab from './ProfileTab.jsx'
import SessionsTab from './SessionsTab.jsx'

const TABS = [
  { key: 'profile', label: 'Profil' },
  { key: 'sessions', label: 'Sessions' },
]

/**
 * Settings for a logged-in school-ERP account (Founder, Teacher,
 * Secretary, Parent, ...) - profile fields + password, and the
 * "who's logged in, from where" security list. Firestore-side
 * marketplace users (browsing schools/jobs before or without a school
 * account) get the separate MarketplaceSettingsPage - this one is
 * Django-backed, scoped to whichever school's ERP the user is
 * currently inside (see shared/api/client.js's per-school base URL).
 */
export default function SettingsPage() {
  const [tab, setTab] = useState('profile')

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
