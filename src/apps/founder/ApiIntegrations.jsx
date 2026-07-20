import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { api, ApiError } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'

const INPUT_CLASS = "mt-1 block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"

export default function ApiIntegrations() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [config, setConfig] = useState({
    fedaPayPublicKey: '',
    fedaPaySecretKey: '',
    whatsappToken: '',
    whatsappPhoneNumberId: ''
  })

  // Deliberately separate from `config`/handleSave below: this writes
  // straight to Firestore (schools/{schoolId}.backendUrl), not through
  // the Django API, because that's the whole point - until this field
  // is set, getApiBaseUrl() has no way to know this school's backend
  // exists at all, so every api.* call here would 404 against the
  // platform Worker instead. See AuthContext.jsx's resolveSchoolBackendUrl,
  // which already documented this field as living here - it just never
  // got built. Founder pastes the public URL their own `docker compose up`
  // reported (tunnel, VPS domain, etc.) once; from then on the whole
  // app, on every device, routes here automatically.
  const [backendUrlInput, setBackendUrlInput] = useState('')
  const [backendUrlSaving, setBackendUrlSaving] = useState(false)
  const [backendUrlMsg, setBackendUrlMsg] = useState('')

  useEffect(() => {
    if (!user?.schoolId) return
    getDoc(doc(db, 'schools', String(user.schoolId)))
      .then(snap => {
        if (snap.exists()) setBackendUrlInput(snap.data().backendUrl || '')
      })
      .catch(err => console.error('Could not load backendUrl:', err))
  }, [user?.schoolId])

  const handleSaveBackendUrl = async (e) => {
    e.preventDefault()
    if (!user?.schoolId) return
    setBackendUrlSaving(true)
    setBackendUrlMsg('')
    try {
      const trimmed = backendUrlInput.trim().replace(/\/+$/, '')
      await updateDoc(doc(db, 'schools', String(user.schoolId)), { backendUrl: trimmed || null })
      setBackendUrlMsg('Adresse enregistrée ! Rechargez la page pour vous connecter à votre installation.')
    } catch (err) {
      console.error(err)
      setBackendUrlMsg("Erreur lors de l'enregistrement : " + err.message)
    } finally {
      setBackendUrlSaving(false)
    }
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/api/system/settings/')
        // SystemSettingsView returns a plain dict, but the project's
        // CamelCaseJSONRenderer (djangorestframework-camel-case) still
        // camelCases it at the render layer regardless of whether a
        // Serializer was used - fedapay_public_key -> fedapayPublicKey
        // etc. in the actual wire response, not the snake_case Python
        // field names on SystemSettings.
        setConfig({
          fedaPayPublicKey: data.fedapayPublicKey || '',
          fedaPaySecretKey: data.fedapaySecretKey || '',
          whatsappToken: data.whatsappToken || '',
          whatsappPhoneNumberId: data.whatsappPhoneNumberId || ''
        })
      } catch (err) {
        // Expected (not an error worth surfacing) until backendUrl above
        // is configured - there's nothing to reach yet.
        if (!(err instanceof ApiError)) console.error("Erreur de chargement de la config:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      await api.patch('/api/system/settings/', {
        fedapayPublicKey: config.fedaPayPublicKey,
        fedapaySecretKey: config.fedaPaySecretKey,
        whatsappToken: config.whatsappToken,
        whatsappPhoneNumberId: config.whatsappPhoneNumberId
      })
      setMsg('Configuration sauvegardée avec succès !')
    } catch (err) {
      console.error(err)
      setMsg('Erreur lors de la sauvegarde : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  if (loading) return <div className="text-ink-muted">Chargement des paramètres...</div>

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader title="Votre installation Ardoise" subtitle="L'adresse publique de votre propre serveur, une fois votre installation Docker démarrée (voir le guide d'installation)." />
      <CardBody>
        <form onSubmit={handleSaveBackendUrl} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Adresse de votre serveur</label>
            <input
              type="url"
              value={backendUrlInput}
              onChange={e => setBackendUrlInput(e.target.value)}
              className={INPUT_CLASS}
              placeholder="https://votre-ecole.trycloudflare.com"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={backendUrlSaving || !user?.schoolId}>
              {backendUrlSaving ? 'Enregistrement...' : 'Connecter mon installation'}
            </Button>
            {backendUrlMsg && <p className={`text-sm ${backendUrlMsg.includes('Erreur') ? 'text-danger-600' : 'text-success-600'}`}>{backendUrlMsg}</p>}
          </div>
        </form>
      </CardBody>
    </Card>
    <Card>
      <CardHeader title="Paramètres Système & APIs" subtitle="Configurez vos clés WhatsApp et FedaPay pour votre école." />
      <CardBody>
        <form onSubmit={handleSave} className="space-y-6">

          <div className="bg-surface p-4 rounded-card ring-1 ring-border">
            <h3 className="font-bold text-ink mb-4">Configuration FedaPay</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">Clé Publique FedaPay (pk_live_... ou pk_sandbox_...)</label>
                <input
                  type="text"
                  name="fedaPayPublicKey"
                  value={config.fedaPayPublicKey}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="pk_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Clé Secrète FedaPay (sk_live_... ou sk_sandbox_...)</label>
                <input
                  type="password"
                  name="fedaPaySecretKey"
                  value={config.fedaPaySecretKey}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="sk_..."
                />
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-card ring-1 ring-border">
            <h3 className="font-bold text-ink mb-4">Configuration WhatsApp Business API</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">Jeton d'accès (Access Token)</label>
                <input
                  type="password"
                  name="whatsappToken"
                  value={config.whatsappToken}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="EAXXXXX..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">ID du Numéro de Téléphone (Phone Number ID)</label>
                <input
                  type="text"
                  name="whatsappPhoneNumberId"
                  value={config.whatsappPhoneNumberId}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="101010101010..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder les clés'}
            </Button>
            {msg && <p className={`text-sm ${msg.includes('Erreur') ? 'text-danger-600' : 'text-success-600'}`}>{msg}</p>}
          </div>
        </form>
      </CardBody>
    </Card>
    </div>
  )
}
