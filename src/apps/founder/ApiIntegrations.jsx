import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../shared/api/firebase.js'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'

const INPUT_CLASS = "mt-1 block w-full rounded-control border-0 py-2 px-3 bg-surface-raised text-ink ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary-500 sm:text-sm"

export default function ApiIntegrations({ schoolId }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [config, setConfig] = useState({
    backendUrl: '',
    fedaPayPublicKey: '',
    fedaPaySecretKey: '',
    whatsappToken: '',
    whatsappPhoneNumberId: ''
  })

  useEffect(() => {
    if (!schoolId) return
    const fetchConfig = async () => {
      try {
        // Fetch public data
        const schoolDoc = await getDoc(doc(db, 'schools', String(schoolId)))
        let pubKey = ''
        let backendUrl = ''
        if (schoolDoc.exists()) {
          pubKey = schoolDoc.data().fedaPayPublicKey || ''
          backendUrl = schoolDoc.data().backendUrl || ''
        }

        // Fetch private data
        const secretDoc = await getDoc(doc(db, 'schools', String(schoolId), 'secrets', 'config'))
        let privConfig = { fedaPaySecretKey: '', whatsappToken: '', whatsappPhoneNumberId: '' }
        if (secretDoc.exists()) {
          privConfig = secretDoc.data()
        }

        setConfig({
          backendUrl,
          fedaPayPublicKey: pubKey,
          fedaPaySecretKey: privConfig.fedaPaySecretKey || '',
          whatsappToken: privConfig.whatsappToken || '',
          whatsappPhoneNumberId: privConfig.whatsappPhoneNumberId || ''
        })
      } catch (err) {
        console.error("Erreur de chargement de la config:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [schoolId])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      // 1. Sauvegarder l'URL du backend + la clé publique dans le document principal (public) --
      // backendUrl n'est pas un secret, c'est ce qui permet a n'importe quel
      // utilisateur de cette ecole d'etre route vers le bon serveur apres connexion
      // (voir AuthContext.jsx: resolveSchoolBackendUrl).
      await setDoc(doc(db, 'schools', String(schoolId)), {
        backendUrl: config.backendUrl.trim().replace(/\/+$/, ''), // pas de slash final
        fedaPayPublicKey: config.fedaPayPublicKey
      }, { merge: true })

      // 2. Sauvegarder les clés privées dans la sous-collection (protégé)
      await setDoc(doc(db, 'schools', String(schoolId), 'secrets', 'config'), {
        fedaPaySecretKey: config.fedaPaySecretKey,
        whatsappToken: config.whatsappToken,
        whatsappPhoneNumberId: config.whatsappPhoneNumberId
      }, { merge: true })

      setMsg('Configuration sauvegardée avec succès !')
    } catch (err) {
      console.error(err)
      setMsg('Erreur lors de la sauvegarde: ' + err.message)
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
      <CardHeader title="Intégrations API (Paiements & WhatsApp)" subtitle="Configurez vos propres clés pour recevoir directement l'argent et envoyer des messages WhatsApp." />
      <CardBody>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-warning-50 p-4 rounded-card ring-1 ring-warning-500/30">
            <h3 className="font-bold text-ink mb-2">Adresse de votre serveur (obligatoire)</h3>
            <p className="text-sm text-ink-muted mb-4">
              L'adresse a laquelle votre instance Ardoise est joignable depuis internet.
              Sans elle, personne de votre école (caissier, enseignant, parent) ne peut
              se connecter à votre portail - voir le guide d'installation pour les 3 façons
              d'obtenir cette adresse selon votre situation (ordinateur seul, serveur local,
              serveur avec nom de domaine).
            </p>
            <div>
              <label className="block text-sm font-medium text-ink">URL du backend</label>
              <input
                type="url"
                name="backendUrl"
                value={config.backendUrl}
                onChange={handleChange}
                placeholder="https://laliberte.exemple.com  ou  https://12.34.56.78:8000"
                className={INPUT_CLASS}
              />
              <p className="text-xs text-ink-muted mt-1">
                Doit être accessible en HTTPS pour un serveur avec nom de domaine (voir le guide).
                Pour un ordinateur unique sans domaine, utilisez l'adresse IP locale de l'école
                (ex. http://192.168.1.50:8000) - seuls les appareils du même réseau Wi-Fi y auront accès.
              </p>
            </div>
          </div>

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
                <p className="text-xs text-ink-muted mt-1">Cette clé sera utilisée publiquement pour afficher le module de paiement sur le portail parent.</p>
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
                <p className="text-xs text-ink-muted mt-1">Stockée de façon sécurisée. Utilisée par le serveur pour les remboursements ou vérifications.</p>
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

        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="font-bold text-ink mb-2">Tester l'envoi WhatsApp</h3>
          <p className="text-sm text-ink-muted mb-4">Envoyez un message test pour vérifier que votre configuration WhatsApp API fonctionne.</p>
          <div className="flex gap-3 max-w-lg">
            <input
              type="text"
              id="testPhone"
              placeholder="Numéro (ex: 22997000000)"
              className={`flex-1 ${INPUT_CLASS} mt-0`}
            />
            <Button onClick={async () => {
              const phone = document.getElementById('testPhone').value
              if (!phone) return alert('Entrez un numéro')
              try {
                const token = await auth.currentUser?.getIdToken() || ''
                // Fixed: this is a call to the CENTRAL platform Worker
                // (ardoise-api), never the school's own backend --
                // getApiBaseUrl() resolves to the school's Django URL
                // post-login and would silently misroute this request.
                const res = await fetch(`${getPlatformApiBaseUrl()}/api/schools/${schoolId}/whatsapp/send`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    to: phone,
                    text: '👋 Bonjour ! Ce message est un test automatique depuis votre plateforme Ardoise.'
                  })
                })
                const data = await res.json()
                if (res.ok && data.success) alert('Message envoyé avec succès !')
                else alert('Erreur: ' + (data.error || JSON.stringify(data.details || data)))
              } catch (e) {
                console.error(e)
                alert('Erreur réseau ou du serveur : ' + e.message)
              }
            }}>Envoyer</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
