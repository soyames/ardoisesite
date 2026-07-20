import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'

const INPUT_CLASS = "mt-1 block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"

export default function ApiIntegrations() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [config, setConfig] = useState({
    fedaPayPublicKey: '',
    fedaPaySecretKey: '',
    whatsappToken: '',
    whatsappPhoneNumberId: ''
  })

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/system/settings/', {
          headers: { 'Content-Type': 'application/json' }
        })
        if (res.ok) {
          const data = await res.json()
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
        }
      } catch (err) {
        console.error("Erreur de chargement de la config:", err)
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
      const res = await fetch('/api/system/settings/', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': document.cookie.split('csrftoken=')[1]?.split(';')[0]
        },
        body: JSON.stringify({
          fedapayPublicKey: config.fedaPayPublicKey,
          fedapaySecretKey: config.fedaPaySecretKey,
          whatsappToken: config.whatsappToken,
          whatsappPhoneNumberId: config.whatsappPhoneNumberId
        })
      })

      if (res.ok) {
        setMsg('Configuration sauvegardée avec succès !')
      } else {
        const data = await res.json()
        setMsg('Erreur lors de la sauvegarde: ' + (data.error || 'Erreur inconnue'))
      }
    } catch (err) {
      console.error(err)
      setMsg('Erreur réseau : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  if (loading) return <div className="text-ink-muted">Chargement des paramètres...</div>

  return (
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
  )
}
