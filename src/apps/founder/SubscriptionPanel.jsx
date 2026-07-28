import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import { usePwaInstall } from '../../shared/hooks/usePwaInstall.js'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'

const ENTERPRISE_PRICE_FCFA = 50000

const ENTERPRISE_MODULES = [
  { icon: '💰', label: 'Finance & Comptabilité', description: 'Facturation, encaissements, comptabilité conforme SYSCOHADA' },
  { icon: '🧑‍💼', label: 'RH & Paie', description: 'Contrats, bulletins de paie, gestion du personnel' },
  { icon: '🛒', label: 'Cantine & Bibliothèque', description: 'Point de vente, portefeuille élève, inventaire' },
  { icon: '📊', label: 'Analytique & BI', description: "Tableaux de bord d'activité et de performance" },
]

// Ardoise ERP core (élèves, notes, présences) is free forever - the
// 2026-07-28 Odoo-style pivot only paywalls the "run the business"
// modules above (see apps/licensing/middleware.py's
// ENTERPRISE_FEATURE_CODES). This panel still shows the school's
// activation code (identity, not a feature gate) and the PWA install
// prompt, plus - new - the Enterprise upgrade itself.
export default function SubscriptionPanel({ schoolId }) {
  const { promptInstall, isIOS, canOfferInstall } = usePwaInstall()
  const [loading, setLoading] = useState(true)
  const [activationCode, setActivationCode] = useState(null)
  const [school, setSchool] = useState(null)
  const [error, setError] = useState(null)

  const loadSchool = () => {
    if (!schoolId) return
    setLoading(true)
    Promise.all([
      // activationCode lives in schools/{id}/secrets/config (firestore.rules
      // restricts that subcollection to the founder of this exact school,
      // which is who's viewing this panel) - see the security-review note
      // in firestore.rules.
      getDoc(doc(db, 'schools', String(schoolId), 'secrets', 'config')),
      getDoc(doc(db, 'schools', String(schoolId))),
    ])
      .then(([secretsSnap, schoolSnap]) => {
        setActivationCode(secretsSnap.exists() ? secretsSnap.data().activationCode || null : null)
        setSchool(schoolSnap.exists() ? schoolSnap.data() : null)
      })
      .catch((err) => {
        setError("Erreur lors du chargement des informations de l'école.")
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(loadSchool, [schoolId])

  if (loading) {
    return <div className="p-8 text-center text-ink-muted">Chargement...</div>
  }

  if (error) {
    return <div className="p-4 bg-error-50 text-error-800 rounded-card">{error}</div>
  }

  const expiresAt = school?.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt) : null
  const hasEnterprise = school?.subscriptionActive === true && (!expiresAt || expiresAt.getTime() > Date.now())

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Ardoise ERP" />
        <CardBody>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-success-100 text-success-800">
                  <span className="h-2 w-2 rounded-full bg-success-500"></span>
                  Gratuit - Élèves, Notes & Présences
                </span>
                {hasEnterprise && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-accent-100 text-accent-800">
                    <span className="h-2 w-2 rounded-full bg-accent-500"></span>
                    Enterprise actif
                  </span>
                )}
              </div>
              <p className="text-ink-muted text-sm leading-relaxed mb-6">
                Ardoise vous donne accès à notre <strong>logiciel à installer sur place</strong> pour une sécurité maximale,
                ainsi qu'une vitrine publique sur notre Marketplace pour recruter les meilleurs professeurs. Vos données ne quittent jamais votre école !
              </p>

              <div className="bg-primary-50 p-6 rounded-xl border border-primary-200 mb-6">
                <h4 className="font-bold text-primary-900 mb-2">Logiciel prêt à installer !</h4>
                <p className="text-sm text-primary-800 mb-4">
                  L'installation locale et toutes les fonctionnalités sont <strong>entièrement gratuites</strong>. Voici votre clé d'activation à insérer lors du premier démarrage de l'ERP dans votre école :
                </p>
                <div className="bg-white p-3 rounded border border-primary-200 font-mono text-center text-lg text-primary-700 tracking-wider mb-6 break-all">
                  {activationCode || 'Génération en cours...'}
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => {
                    if (isIOS) {
                      alert("Pour installer sur iOS, appuyez sur l'icône de partage puis 'Sur l'écran d'accueil'.")
                    } else if (canOfferInstall) {
                      promptInstall()
                    } else {
                      alert("L'application est déjà installée, ou votre navigateur ne permet pas l'installation automatique.")
                    }
                  }} className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-500 flex justify-center items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Installer Ardoise Serveur
                  </button>
                  <p className="text-xs text-center text-primary-600 mt-2">
                    Ou branchez simplement votre <strong>Ardoise Box</strong> si vous en avez commandé une.
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-[1px] bg-border h-full min-h-[250px]"></div>

            <div className="flex-1 space-y-4">
              <h4 className="font-bold text-ink mb-3">Avantages de l'On-Premise</h4>
              <ul className="space-y-3 text-sm text-ink-muted">
                <li className="flex items-start gap-2">
                  <span className="text-success-500 mt-0.5">🔒</span>
                  <div>
                    <strong className="text-ink">Sécurité Totale</strong>
                    <p className="text-xs mt-0.5">Aucune donnée privée (notes, comptabilité) ne quitte l'école.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500 mt-0.5">⚡</span>
                  <div>
                    <strong className="text-ink">Ultra-Rapide (Réseau Local)</strong>
                    <p className="text-xs mt-0.5">Pas besoin de connexion Internet pour utiliser le système en interne.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500 mt-0.5">🌍</span>
                  <div>
                    <strong className="text-ink">Connecté au Monde</strong>
                    <p className="text-xs mt-0.5">Synchronisation sécurisée avec le Marketplace Ardoise pour recruter.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500 mt-0.5">🛠️</span>
                  <div>
                    <strong className="text-ink">Installation Zéro Technique</strong>
                    <p className="text-xs mt-0.5">Un simple double-clic sur l'installeur, ou une petite box à brancher.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Ardoise Enterprise"
          subtitle="Les modules avancés pour gérer toute l'activité financière et administrative de l'école."
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {ENTERPRISE_MODULES.map((mod) => (
              <div key={mod.label} className="flex items-start gap-3 rounded-control border border-border bg-surface p-4">
                <span className="text-2xl">{mod.icon}</span>
                <div>
                  <p className="font-semibold text-ink text-sm">{mod.label}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>

          {hasEnterprise ? (
            <div className="rounded-control bg-accent-50 border border-accent-200 p-4">
              <p className="text-sm font-semibold text-accent-800">
                Abonnement actif{expiresAt ? ` jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}` : ''}.
              </p>
              <p className="text-xs text-ink-muted mt-1">Contactez le support pour renouveler ou modifier votre offre.</p>
            </div>
          ) : (
            <div className="rounded-control bg-primary-50 border border-primary-200 p-4">
              <p className="text-sm text-primary-900 mb-3">
                <strong>{ENTERPRISE_PRICE_FCFA.toLocaleString('fr-FR')} FCFA / an</strong> - active les quatre modules ci-dessus pour toute l'école. Élèves, notes et présences restent gratuits, avec ou sans Enterprise.
              </p>
              <FedaPayButton
                amount={ENTERPRISE_PRICE_FCFA}
                description="Abonnement Ardoise Enterprise (1 an)"
                customMetadata={{ type: 'school_subscription_payment', schoolId: String(schoolId) }}
                onComplete={() => loadSchool()}
                className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-500"
              >
                Passer à Enterprise
              </FedaPayButton>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
