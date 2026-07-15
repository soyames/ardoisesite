import React, { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'

export default function ApiIntegrations({ schoolId }) {
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

  useEffect(() => {
    if (!schoolId) return
    const fetchConfig = async () => {
      try {
        // Fetch public data
        const schoolDoc = await getDoc(doc(db, 'schools', String(schoolId)))
        let pubKey = ''
        if (schoolDoc.exists()) {
          pubKey = schoolDoc.data().fedaPayPublicKey || ''
        }

        // Fetch private data
        const secretDoc = await getDoc(doc(db, 'schools', String(schoolId), 'secrets', 'config'))
        let privConfig = { fedaPaySecretKey: '', whatsappToken: '', whatsappPhoneNumberId: '' }
        if (secretDoc.exists()) {
          privConfig = secretDoc.data()
        }

        setConfig({
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
      // 1. Sauvegarder la clé publique dans le document principal (public)
      await setDoc(doc(db, 'schools', String(schoolId)), {
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

  if (loading) return <div>Chargement des paramètres...</div>

  return (
    <Card>
      <CardHeader title="Intégrations API (Paiements & WhatsApp)" subtitle="Configurez vos propres clés pour recevoir directement l'argent et envoyer des messages WhatsApp." />
      <CardBody>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg ring-1 ring-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Configuration FedaPay</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Clé Publique FedaPay (pk_live_... ou pk_sandbox_...)</label>
                <input 
                  type="text" 
                  name="fedaPayPublicKey" 
                  value={config.fedaPayPublicKey} 
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  placeholder="pk_..." 
                />
                <p className="text-xs text-slate-500 mt-1">Cette clé sera utilisée publiquement pour afficher le module de paiement sur le portail parent.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Clé Secrète FedaPay (sk_live_... ou sk_sandbox_...)</label>
                <input 
                  type="password" 
                  name="fedaPaySecretKey" 
                  value={config.fedaPaySecretKey} 
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  placeholder="sk_..." 
                />
                <p className="text-xs text-slate-500 mt-1">Stockée de façon sécurisée. Utilisée par le serveur pour les remboursements ou vérifications.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg ring-1 ring-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Configuration WhatsApp Business API</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Jeton d'accès (Access Token)</label>
                <input 
                  type="password" 
                  name="whatsappToken" 
                  value={config.whatsappToken} 
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  placeholder="EAXXXXX..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">ID du Numéro de Téléphone (Phone Number ID)</label>
                <input 
                  type="text" 
                  name="whatsappPhoneNumberId" 
                  value={config.whatsappPhoneNumberId} 
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                  placeholder="101010101010..." 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder les clés'}
            </Button>
            {msg && <p className={`text-sm ${msg.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="font-bold text-slate-900 mb-2">Tester l'envoi WhatsApp</h3>
          <p className="text-sm text-slate-600 mb-4">Envoyez un message test pour vérifier que votre configuration WhatsApp API fonctionne.</p>
          <div className="flex gap-3 max-w-lg">
            <input 
              type="text" 
              id="testPhone"
              placeholder="Numéro (ex: 22997000000)" 
              className="flex-1 rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
            <Button onClick={async () => {
              const phone = document.getElementById('testPhone').value
              if (!phone) return alert('Entrez un numéro')
              try {
                const token = await user?.getIdToken?.() || ''
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/schools/${schoolId}/whatsapp/send`, {
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
                if (data.success) alert('Message envoyé avec succès !')
                else alert('Erreur: ' + (data.error || JSON.stringify(data.details)))
              } catch (e) {
                alert('Erreur réseau')
              }
            }}>Envoyer</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
