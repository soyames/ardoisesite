import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { api, ApiError } from '../../shared/api/client.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import InfoTooltip from '../../shared/ui/InfoTooltip.jsx'

const INPUT_CLASS = "mt-1 block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"

export default function ApiIntegrations() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [config, setConfig] = useState({
    fedaPayPublicKey: '',
    fedaPaySecretKey: '',
    fedaPayWebhookSecret: '',
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
          fedaPayWebhookSecret: data.fedapayWebhookSecret || '',
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
        fedapayWebhookSecret: config.fedaPayWebhookSecret,
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
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
              Adresse de votre serveur
              <InfoTooltip text="C'est l'adresse à laquelle l'application vous connecte, sur tous vos appareils, à votre propre installation Ardoise plutôt qu'au site public. Sans elle, aucune des fonctionnalités de gestion de votre école (élèves, paiements, personnel...) ne peut fonctionner." />
            </label>
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
      <CardHeader title="Paramètres Système & APIs" subtitle="Configurez votre passerelle de paiement et WhatsApp pour votre école." />
      <CardBody>
        <form onSubmit={handleSave} className="space-y-6">

          <div className="bg-surface p-4 rounded-card ring-1 ring-border">
            <h3 className="flex items-center gap-1.5 font-bold text-ink mb-4">
              Passerelle de paiement
              <InfoTooltip text="Le service qui encaisse les paiements en ligne (Mobile Money, carte...) pour votre école. C'est votre propre compte : les frais de scolarité que les parents paient ici sont votre argent, versé directement sur votre compte - Ardoise ne les touche jamais. Ardoise encaisse uniquement les frais d'inscription lors d'une demande sur le marketplace, avec sa propre clé séparée de celle-ci, et vous en reverse le montant." />
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  Clé publique
                  <InfoTooltip text="Fournie par votre passerelle de paiement lors de la création de votre compte marchand. Elle permet d'afficher la page de paiement - elle n'est pas secrète et peut être partagée sans risque." />
                </label>
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
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  Clé secrète
                  <InfoTooltip text="Fournie par votre passerelle de paiement, elle aussi. Contrairement à la clé publique, celle-ci doit rester confidentielle : quiconque la possède peut agir sur votre compte marchand." />
                </label>
                <input
                  type="password"
                  name="fedaPaySecretKey"
                  value={config.fedaPaySecretKey}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="sk_..."
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  URL de webhook à configurer sur votre passerelle
                  <InfoTooltip text="Copiez cette adresse dans les réglages de webhooks de votre passerelle de paiement. C'est ce qui permet à votre serveur d'être notifié automatiquement dès qu'un parent a réellement payé, sans que personne n'ait à le confirmer à la main." />
                </label>
                <input
                  type="text"
                  readOnly
                  value={backendUrlInput ? `${backendUrlInput.replace(/\/+$/, '')}/api/finance/webhooks/fedapay/` : "Connectez d'abord votre installation ci-dessus"}
                  className={`${INPUT_CLASS} cursor-not-allowed opacity-70`}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  Secret de signature du webhook
                  <InfoTooltip text="Fourni par votre passerelle de paiement au moment où vous créez le webhook ci-dessus. Sans ce secret, votre serveur ne peut pas vérifier qu'un paiement confirmé vient vraiment de votre passerelle, et refusera le webhook - aucun paiement ne sera alors validé automatiquement." />
                </label>
                <input
                  type="password"
                  name="fedaPayWebhookSecret"
                  value={config.fedaPayWebhookSecret}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                  placeholder="Fourni lors de la création du webhook"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-card ring-1 ring-border">
            <h3 className="flex items-center gap-1.5 font-bold text-ink mb-4">
              Configuration WhatsApp Business API
              <InfoTooltip text="Permet à votre école d'envoyer automatiquement des reçus de paiement et des rappels aux parents par WhatsApp, plutôt que de le faire manuellement un par un." />
            </h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  Jeton d'accès (Access Token)
                  <InfoTooltip text="Généré depuis votre compte Meta for Developers pour votre application WhatsApp Business. Il doit rester confidentiel - quiconque le possède peut envoyer des messages au nom de votre école." />
                </label>
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
                <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  ID du Numéro de Téléphone (Phone Number ID)
                  <InfoTooltip text="L'identifiant du numéro WhatsApp que votre école utilise pour envoyer ces messages, disponible dans les réglages de votre application Meta for Developers." />
                </label>
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
