import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useApiGet } from '../hooks/useApi.js'
import { Card, CardBody, CardHeader } from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Spinner from '../ui/Spinner.jsx'

const INPUT_CLASS =
  'block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm'

function ProfileForm({ me, onSaved }) {
  const [firstName, setFirstName] = useState(me.first_name || '')
  const [lastName, setLastName] = useState(me.last_name || '')
  const [phone, setPhone] = useState(me.phone || '')
  const [preferredLanguage, setPreferredLanguage] = useState(me.preferred_language || 'fr')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.patch('/api/auth/me/profile/', {
        first_name: firstName, last_name: lastName, phone, preferred_language: preferredLanguage,
      })
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-muted">Prenom</label>
          <input className={INPUT_CLASS} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Nom</label>
          <input className={INPUT_CLASS} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Telephone</label>
          <input className={INPUT_CLASS} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Langue</label>
          <select className={INPUT_CLASS} value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
            <option value="fr">Francais</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 opacity-70">
        <div>
          <label className="text-xs font-medium text-ink-muted">Email</label>
          <input className={INPUT_CLASS} value={me.email || '-'} disabled />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Role</label>
          <input className={INPUT_CLASS} value={me.role_display || '-'} disabled />
        </div>
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {saved && !error && <p className="text-sm text-success-600">Profil mis a jour.</p>}
      <Button size="sm" type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
    </form>
  )
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setDone(false)
    try {
      await api.post('/api/auth/me/change-password/', { current_password: currentPassword, new_password: newPassword })
      setDone(true)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-muted">Mot de passe actuel</label>
          <input type="password" className={INPUT_CLASS} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-muted">Nouveau mot de passe</label>
          <input type="password" className={INPUT_CLASS} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {done && !error && <p className="text-sm text-success-600">Mot de passe modifie.</p>}
      <Button size="sm" variant="secondary" type="submit" disabled={submitting || !currentPassword || newPassword.length < 8}>
        {submitting ? 'Modification...' : 'Changer le mot de passe'}
      </Button>
    </form>
  )
}

export default function ProfileTab() {
  const me = useApiGet('/api/auth/me/')

  if (me.loading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (me.error) return <div className="text-danger-600">Erreur de chargement du profil : {me.error.message || String(me.error)}</div>
  if (!me.data) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Informations personnelles" />
        <CardBody>
          <ProfileForm me={me.data} onSaved={me.refetch} />
        </CardBody>
      </Card>

      {me.data.has_usable_password ? (
        <Card>
          <CardHeader title="Mot de passe" />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Mot de passe" />
          <CardBody>
            <p className="text-sm text-ink-muted">
              Ce compte se connecte via l'application mobile/Firebase - il n'y a pas de mot de passe local a gerer ici.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
