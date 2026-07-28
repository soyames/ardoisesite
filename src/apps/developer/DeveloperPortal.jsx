import React, { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { auth, db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Icon from '../../shared/ui/Icon.jsx'

export default function DeveloperPortal() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [loading, setLoading] = useState(true)
  
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
      setLoading(false)
    })

    return () => {
      unsubscribeKeys()
      unsubscribeHooks()
    }
  }, [user])

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

  const partnerLink = `https://saas.ardoiseeduc.com/register?ref=${user?.uid}`

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Espace Développeur</h1>
          <p className="mt-1 text-sm text-ink-muted">Gérez vos clés API, vos intégrations webhooks et votre programme partenaire avec Ardoise.</p>
        </div>
        <a
          href="https://docs.ardoiseeduc.com"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Icon name="menu_book" className="text-base" />
          Documentation
        </a>
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
                              const res = await fetch(`${getPlatformApiBaseUrl()}/api/developer/webhook/test`, {
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
          <CardHeader title="Lien de Parrainage" subtitle="Partagez Ardoise avec des directeurs d'école." />
          <CardBody>
            <div className="rounded-card bg-primary-50 border border-primary-100 p-5">
              <h3 className="font-bold text-primary-900 mb-2">Votre lien unique</h3>
              <p className="text-sm text-primary-800 mb-4">
                Partagez ce lien avec des directeurs d'école pour qu'ils inscrivent leur établissement.
                Ardoise ERP est entièrement gratuit - il n'y a pas de commission associée à ce lien.
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
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
