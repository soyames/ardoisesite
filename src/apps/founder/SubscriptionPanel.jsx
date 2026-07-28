import React, { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../shared/api/firebase'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'
import { usePwaInstall } from '../../shared/hooks/usePwaInstall.js'

// Ardoise ERP is free - no more subscription/payment flow here (see the
// 2026-07 paywall removal). This panel now only shows the school's
// activation code (still needed for marketplace/notification identity,
// not for unlocking anything) and the PWA install prompt.
export default function SubscriptionPanel({ schoolId }) {
  const { promptInstall, isIOS, canOfferInstall } = usePwaInstall()
  const [loading, setLoading] = useState(true)
  const [activationCode, setActivationCode] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!schoolId) return
    setLoading(true)
    // activationCode lives in schools/{id}/secrets/config (firestore.rules
    // restricts that subcollection to the founder of this exact school,
    // which is who's viewing this panel) - see the security-review note
    // in firestore.rules.
    getDoc(doc(db, 'schools', String(schoolId), 'secrets', 'config'))
      .then((secretsSnap) => setActivationCode(secretsSnap.exists() ? secretsSnap.data().activationCode || null : null))
      .catch((err) => {
        setError("Erreur lors du chargement des informations de l'école.")
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [schoolId])

  if (loading) {
    return <div className="p-8 text-center text-ink-muted">Chargement...</div>
  }

  if (error) {
    return <div className="p-4 bg-error-50 text-error-800 rounded-card">{error}</div>
  }

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
                  Gratuit - toutes les fonctionnalités actives
                </span>
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
    </div>
  )
}
