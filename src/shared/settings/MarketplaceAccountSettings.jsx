import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../api/firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { Card, CardBody, CardHeader } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import { parseUserAgent } from './parseUserAgent.js'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

const DEVICE_LABEL = { desktop: 'Ordinateur', mobile: 'Mobile', tablet: 'Tablette', unknown: 'Appareil inconnu' }

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Account settings for a marketplace user (parent browsing schools,
 * teacher on TeacherMarketplaceDashboard, superadmin/support_agent) -
 * name/phone editable, written straight to Firestore's users/{uid}
 * doc (same pattern AuthContext.jsx/RegisterPage.jsx already use for
 * this collection).
 *
 * "Session" here is deliberately scoped to what's actually available:
 * Firebase Auth's own sign-in metadata plus a client-side User-Agent
 * parse of the current browser - not a server-tracked list of every
 * device you've ever signed in from (that's what the Django ERP
 * side's SessionsTab.jsx does, backed by a real per-request session
 * row; a Firebase-authenticated marketplace client has no equivalent
 * server-side session store to list from).
 */
export default function MarketplaceAccountSettings() {
  const { user, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState(user?.firstName || user?.first_name || '')
  const [lastName, setLastName] = useState(user?.lastName || user?.last_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateDoc(doc(db, 'users', user.uid), { firstName, lastName, phone })
      await refreshUser()
      setSaved(true)
    } catch (err) {
      console.error(err)
      setError("Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const { deviceType, browser, operatingSystem } = parseUserAgent(navigator.userAgent)
  const metadata = auth.currentUser?.metadata

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Profil" />
        <CardBody>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">Prénom</label>
                <input
                  className={INPUT_CLASS}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">Nom</label>
                <input
                  className={INPUT_CLASS}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Telephone</label>
                <input className={INPUT_CLASS} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 opacity-70">
              <div>
                <label className="text-xs font-medium text-ink-muted">Email</label>
                <input className={INPUT_CLASS} value={user?.email || '-'} disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Role</label>
                <input className={INPUT_CLASS} value={user?.role || '-'} disabled />
              </div>
            </div>
            {error && <p className="text-sm text-danger-600">{error}</p>}
            {saved && !error && <p className="text-sm text-success-600">Profil mis a jour.</p>}
            <Button size="sm" type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Cette session" subtitle="Informations disponibles pour la session en cours sur ce navigateur." />
        <CardBody className="space-y-1 text-sm">
          <p className="text-ink">
            {DEVICE_LABEL[deviceType]}{browser && ` - ${browser}`}{operatingSystem && ` (${operatingSystem})`}
          </p>
          <p className="text-ink-muted">Premiere connexion : {formatDate(metadata?.creationTime)}</p>
          <p className="text-ink-muted">Derniere connexion : {formatDate(metadata?.lastSignInTime)}</p>
        </CardBody>
      </Card>
    </div>
  )
}
