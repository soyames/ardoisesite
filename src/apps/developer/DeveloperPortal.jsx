import React, { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../shared/api/firebase.js'
import { useAuth } from '../../shared/auth/AuthContext.jsx'
import { getPlatformApiBaseUrl } from '../../config/env.js'
import { OHADA_COUNTRIES } from '../../shared/constants/locations.js'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import Button from '../../shared/ui/Button.jsx'
import Icon from '../../shared/ui/Icon.jsx'
import DeveloperAcademy from './DeveloperAcademy.jsx'

const SCOPES = [
  { value: 'marketplace:read', label: 'Marketplace (lecture)', description: 'Ecoles, tuteurs, offres d\'emploi publiees' },
  { value: 'leads:write', label: 'Soumission de leads', description: 'Envoyer un prospect ecole ou une candidature vers le CRM Ardoise' },
  { value: 'support:access', label: 'Accès support (partenaire certifié)', description: 'Consulter l\'état/déclencher une sauvegarde d\'une école qui vous a accordé l\'accès' },
]

const PARTNER_STATUS_LABEL = {
  pending: { label: 'Candidature en cours d\'examen', tone: 'text-warning-600' },
  approved: { label: 'Partenaire certifié', tone: 'text-success-600' },
  rejected: { label: 'Candidature refusée', tone: 'text-danger-600' },
}

// Real entropy (crypto.getRandomValues), unlike the Math.random() this
// replaces - the Worker's requireApiKey() (ardoise-api/src/api-key-auth.ts)
// is what actually validates these now; before that existed, a generated
// key authenticated nothing at all.
function generateKeySecret() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export default function DeveloperPortal() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [webhooks, setWebhooks] = useState([])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [newKeyScopes, setNewKeyScopes] = useState([])
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [partnerForm, setPartnerForm] = useState({ publicName: '', bio: '', specialties: '', country: '', contactEmail: '', contactPhone: '' })

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

    const unsubscribePartner = onSnapshot(doc(db, 'certifiedPartners', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setPartnerProfile(data)
        setPartnerForm({
          publicName: data.publicName || '',
          bio: data.bio || '',
          specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : '',
          country: data.country || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
        })
      } else {
        setPartnerProfile(null)
      }
    })

    return () => {
      unsubscribeKeys()
      unsubscribeHooks()
      unsubscribePartner()
    }
  }, [user])

  const submitPartnerApplication = async (e) => {
    e.preventDefault()
    if (!partnerForm.publicName || !partnerForm.country || (!partnerForm.contactEmail && !partnerForm.contactPhone)) {
      alert('Nom public, pays, et au moins un moyen de contact sont requis.')
      return
    }
    await setDoc(doc(db, 'certifiedPartners', user.uid), {
      publicName: partnerForm.publicName,
      bio: partnerForm.bio,
      specialties: partnerForm.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      country: partnerForm.country,
      contactEmail: partnerForm.contactEmail,
      contactPhone: partnerForm.contactPhone,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    })
  }
  const hashApiKey = async (rawKey) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const generateApiKey = async (type) => {
    if (newKeyScopes.length === 0) {
      alert('Selectionnez au moins une portee (scope) pour cette cle.')
      return
    }
    const prefix = type === 'test' ? 'sk_test_' : 'sk_live_'
    const newKey = prefix + generateKeySecret()
    const hashedKey = await hashApiKey(newKey)

    await addDoc(collection(db, 'api_keys'), {
      developerId: user.uid,
      keyHash: hashedKey,
      keyPreview: newKey.substring(0, 12) + '...' + newKey.substring(newKey.length - 4),
      type,
      scopes: newKeyScopes,
      revoked: false,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      requestCount: 0,
    })
    setNewKeyScopes([])
    alert(`Votre nouvelle clé API : ${newKey}\n\nCopiez-la maintenant ! Elle ne sera plus affichée.`)
  }

  const toggleNewKeyScope = (scope) => {
    setNewKeyScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope])
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
          <CardHeader title="Clés API" subtitle="Authentifiez vos requêtes vers l'API publique Ardoise (marketplace + leads)." />
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
                    <li key={key.id} className="p-3 rounded-card border border-border bg-surface-raised">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm break-all text-ink">{key.keyPreview || key.key}</span>
                        <button onClick={() => deleteApiKey(key.id)} className="text-danger-600 hover:text-danger-700 p-2 shrink-0">
                          <Icon name="delete" />
                        </button>
                      </div>
                      <div className="text-xs text-ink-muted mt-1">
                        {key.type === 'live' ? <span className="text-danger-600 font-bold">LIVE</span> : <span className="text-warning-600 font-bold">TEST</span>} • Créée le {new Date(key.createdAt).toLocaleDateString()}
                        {key.requestCount > 0 && <> • {key.requestCount} requête{key.requestCount > 1 ? 's' : ''}</>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(key.scopes || []).map((s) => (
                          <span key={s} className="rounded-full bg-primary-100 text-primary-800 text-xs px-2 py-0.5">{SCOPES.find((x) => x.value === s)?.label || s}</span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-xs font-medium text-ink-muted">Portées de la nouvelle clé</p>
                {SCOPES.map((s) => (
                  <label key={s.value} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-0.5" checked={newKeyScopes.includes(s.value)} onChange={() => toggleNewKeyScope(s.value)} />
                    <span>
                      <span className="text-ink font-medium">{s.label}</span>
                      <span className="text-ink-muted"> - {s.description}</span>
                    </span>
                  </label>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => generateApiKey('test')}>+ Clé de test</Button>
                  <Button size="sm" variant="primary" onClick={() => generateApiKey('live')}>+ Clé de production</Button>
                </div>
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

        <Card className="md:col-span-2">
          <CardHeader
            title="Réseau de Partenaires Certifiés"
            subtitle="Devenez un partenaire vérifié pour l'installation et la maintenance des écoles - une école pourra ensuite vous accorder un accès support à distance."
          />
          <CardBody>
            {partnerProfile && (
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <Icon name={partnerProfile.status === 'approved' ? 'verified' : partnerProfile.status === 'rejected' ? 'cancel' : 'hourglass_top'} className={PARTNER_STATUS_LABEL[partnerProfile.status]?.tone} />
                <span className={PARTNER_STATUS_LABEL[partnerProfile.status]?.tone}>{PARTNER_STATUS_LABEL[partnerProfile.status]?.label || partnerProfile.status}</span>
              </div>
            )}
            <form onSubmit={submitPartnerApplication} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink-muted">Nom public</label>
                <input
                  type="text"
                  value={partnerForm.publicName}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, publicName: e.target.value }))}
                  className="mt-1 w-full rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                  placeholder="Votre nom ou celui de votre entreprise"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Pays</label>
                <select
                  value={partnerForm.country}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, country: e.target.value }))}
                  className="mt-1 w-full rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {OHADA_COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Email de contact</label>
                <input
                  type="email"
                  value={partnerForm.contactEmail}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="mt-1 w-full rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Téléphone de contact</label>
                <input
                  type="tel"
                  value={partnerForm.contactPhone}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  className="mt-1 w-full rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-ink-muted">Spécialités (séparées par des virgules)</label>
                <input
                  type="text"
                  value={partnerForm.specialties}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, specialties: e.target.value }))}
                  className="mt-1 w-full rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                  placeholder="Installation, maintenance serveur, formation..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-ink-muted">Présentation</label>
                <textarea
                  value={partnerForm.bio}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-card border-border bg-surface px-3 py-1.5 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <Button size="sm" variant="primary" type="submit">
                  {partnerProfile ? 'Mettre à jour ma candidature' : 'Candidater'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <DeveloperAcademy partnerProfile={partnerProfile} user={user} />
      </div>
    </div>
  )
}
