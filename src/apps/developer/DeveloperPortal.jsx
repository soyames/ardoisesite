import React, { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Icon from '../../shared/ui/Icon.jsx'

export default function DeveloperPortal() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer')
  const [payoutBankIban, setPayoutBankIban] = useState('')
  const [payoutBankName, setPayoutBankName] = useState('')
  const [payoutPaypalEmail, setPayoutPaypalEmail] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Dummy earnings state for now
  const totalSchools = 0
  const totalEarnings = 0

  useEffect(() => {
    if (!user) return

    const keysQuery = query(collection(db, 'api_keys'), where('developerId', '==', user.uid))
    const unsubscribeKeys = onSnapshot(keysQuery, (snapshot) => {
      const keys = []
      snapshot.forEach(doc => keys.push({ id: doc.id, ...doc.data() }))
      setApiKeys(keys)
    })

    const hooksQuery = query(collection(db, 'webhooks'), where('developerId', '==', user.uid))
    const unsubscribeHooks = onSnapshot(hooksQuery, (snapshot) => {
      const hooks = []
      snapshot.forEach(doc => hooks.push({ id: doc.id, ...doc.data() }))
      setWebhooks(hooks)
    })

    // Fetch settings
    const settingsUnsub = onSnapshot(doc(db, 'developer_settings', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setPayoutMethod(data.payoutMethod || 'bank_transfer')
        setPayoutBankIban(data.payoutBankIban || '')
        setPayoutBankName(data.payoutBankName || '')
        setPayoutPaypalEmail(data.payoutPaypalEmail || '')
      }
      setLoading(false)
    })

    return () => {
      unsubscribeKeys()
      unsubscribeHooks()
      settingsUnsub()
    }
  }, [user])

  const saveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await setDoc(doc(db, 'developer_settings', user.uid), {
        payoutMethod,
        payoutBankIban,
        payoutBankName,
        payoutPaypalEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      alert("Paramètres enregistrés avec succès !")
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la sauvegarde")
    }
    setSavingSettings(false)
  }

  const generateApiKey = async (type) => {
    const prefix = type === 'test' ? 'sk_test_' : 'sk_live_'
    const newKey = prefix + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    await addDoc(collection(db, 'api_keys'), {
      developerId: user.uid,
      key: newKey,
      type: type,
      createdAt: new Date().toISOString()
    })
  }

  const deleteApiKey = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette clé ? Elle ne fonctionnera plus.")) {
      await deleteDoc(doc(db, 'api_keys', id))
    }
  }

  const addWebhook = async (e) => {
    e.preventDefault()
    if (!newWebhookUrl) return
    
    await addDoc(collection(db, 'webhooks'), {
      developerId: user.uid,
      url: newWebhookUrl,
      events: ['all'],
      createdAt: new Date().toISOString()
    })
    setNewWebhookUrl('')
  }

  const deleteWebhook = async (id) => {
    if (window.confirm("Supprimer ce webhook ?")) {
      await deleteDoc(doc(db, 'webhooks', id))
    }
  }

  if (loading) return <div className="p-4">Chargement...</div>

  const partnerLink = `https://saas.ardoise.soyames.com/register?ref=${user?.uid}`

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-ink">Espace Développeur</h1>
        <p className="mt-1 text-sm text-ink-muted">Gérez vos clés API, vos intégrations webhooks et votre programme partenaire avec Ardoise.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Clés API" subtitle="Authentifiez vos requêtes vers l'API Ardoise SaaS." />
          <CardBody>
            <div className="space-y-4">
              {apiKeys.length === 0 ? (
                <div className="rounded-card bg-surface-raised border border-border p-4 text-center">
                  <Icon name="key" className="text-4xl text-ink-muted mb-2" />
                  <p className="text-sm font-medium text-ink">Aucune clé API</p>
                  <p className="text-xs text-ink-muted mt-1">Générez une clé pour commencer à utiliser l'API.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {apiKeys.map(key => (
                    <li key={key.id} className="flex items-center justify-between p-3 rounded-card border border-border bg-surface-raised">
                      <div>
                        <span className="font-mono text-sm break-all text-ink">{key.key}</span>
                        <div className="text-xs text-ink-muted mt-1">
                          {key.type === 'live' ? <span className="text-danger-600 font-bold">LIVE</span> : <span className="text-warning-600 font-bold">TEST</span>} • Créée le {new Date(key.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button onClick={() => deleteApiKey(key.id)} className="text-danger-600 hover:text-danger-700 p-2">
                        <Icon name="delete" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => generateApiKey('test')}>+ Clé de test</Button>
                <Button size="sm" variant="primary" onClick={() => generateApiKey('live')}>+ Clé de production</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Webhooks" subtitle="Recevez des événements en temps réel sur votre serveur." />
          <CardBody>
            <div className="space-y-4">
              {webhooks.length === 0 ? (
                <div className="rounded-card bg-surface-raised border border-border p-4 text-center">
                  <Icon name="webhook" className="text-4xl text-ink-muted mb-2" />
                  <p className="text-sm font-medium text-ink">Aucun webhook</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {webhooks.map(hook => (
                    <li key={hook.id} className="flex items-center justify-between p-3 rounded-card border border-border bg-surface-raised">
                      <div className="truncate">
                        <span className="font-mono text-sm text-ink truncate">{hook.url}</span>
                        <div className="text-xs text-ink-muted mt-1">Événements: {hook.events.join(', ')}</div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const idToken = await auth.currentUser.getIdToken()
                              const res = await fetch(`https://api.ardoise.soyames.com/api/developer/webhook/test`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                                body: JSON.stringify({ webhookId: hook.id })
                              })
                              if (!res.ok) throw new Error("Erreur")
                              alert("Webhook test envoyé avec succès !")
                            } catch (e) {
                              alert("Le serveur n'a pas pu joindre cette URL ou une erreur s'est produite.")
                            }
                          }}
                          className="text-primary-600 hover:text-primary-700 p-2 text-xs font-medium"
                        >
                          Tester
                        </button>
                        <button onClick={() => deleteWebhook(hook.id)} className="text-danger-600 hover:text-danger-700 p-2">
                          <Icon name="delete" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              <form onSubmit={addWebhook} className="flex gap-2 pt-2">
                <input 
                  type="url" 
                  value={newWebhookUrl}
                  onChange={e => setNewWebhookUrl(e.target.value)}
                  placeholder="https://votre-serveur.com/webhooks" 
                  className="flex-1 rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                  required
                />
                <Button size="sm" variant="secondary" type="submit">Ajouter</Button>
              </form>
            </div>
          </CardBody>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader title="Programme Partenaire & Représentant" subtitle="Parrainez des écoles ou devenez représentant officiel." />
          <CardBody>
            <div className="space-y-8">
              <div className="rounded-card bg-primary-50 border border-primary-100 p-5 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="font-bold text-primary-900 mb-2">Votre lien d'affiliation unique</h3>
                  <p className="text-sm text-primary-800 mb-4">
                    Partagez ce lien avec des directeurs d'école. Lorsqu'ils s'inscrivent et paient leur abonnement Ardoise SaaS, 
                    vous recevrez une commission automatique de <strong>10%</strong> sur leur abonnement.
                    Devenez également notre <strong>Représentant Local</strong> dans votre pays pour des revenus supplémentaires !
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded-lg text-sm font-mono border border-primary-200 select-all flex-1">
                      {partnerLink}
                    </code>
                    <Button size="sm" variant="primary" onClick={() => {
                      navigator.clipboard.writeText(partnerLink)
                      alert("Lien copié !")
                    }}>
                      Copier
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-48 bg-white rounded-xl p-4 text-center shadow-sm border border-primary-100">
                  <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Écoles parrainées</p>
                  <p className="text-3xl font-extrabold text-primary-600">{totalSchools}</p>
                  <p className="text-xs text-ink-muted mt-2">Gains: {totalEarnings} FCFA</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-ink mb-4 border-b border-border pb-2">Configuration de vos Payouts</h3>
                <form onSubmit={saveSettings} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Mode de Paiement Préféré</label>
                    <select 
                      value={payoutMethod} 
                      onChange={e => setPayoutMethod(e.target.value)}
                      className="w-full rounded-card border-border bg-surface px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="bank_transfer">Virement Bancaire / Mobile Money</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  {payoutMethod === 'bank_transfer' && (
                    <div className="space-y-3 p-4 bg-surface-raised rounded-card border border-border">
                      <div>
                        <label className="block text-xs font-medium text-ink-muted mb-1">Nom de la Banque ou Opérateur</label>
                        <input 
                          type="text" 
                          value={payoutBankName} 
                          onChange={e => setPayoutBankName(e.target.value)} 
                          className="w-full rounded border-border px-2 py-1 text-sm" 
                          placeholder="Ex: Ecobank, MTN Mobile Money..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-muted mb-1">Numéro de Compte (RIB / IBAN / Numéro)</label>
                        <input 
                          type="text" 
                          value={payoutBankIban} 
                          onChange={e => setPayoutBankIban(e.target.value)} 
                          className="w-full rounded border-border px-2 py-1 text-sm" 
                          required
                        />
                      </div>
                    </div>
                  )}

                  {payoutMethod === 'paypal' && (
                    <div className="p-4 bg-surface-raised rounded-card border border-border">
                      <label className="block text-xs font-medium text-ink-muted mb-1">Adresse Email PayPal</label>
                      <input 
                        type="email" 
                        value={payoutPaypalEmail} 
                        onChange={e => setPayoutPaypalEmail(e.target.value)} 
                        className="w-full rounded border-border px-2 py-1 text-sm" 
                        required
                      />
                    </div>
                  )}

                  <Button type="submit" variant="primary" disabled={savingSettings}>
                    {savingSettings ? 'Enregistrement...' : 'Enregistrer mes paramètres'}
                  </Button>
                </form>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
