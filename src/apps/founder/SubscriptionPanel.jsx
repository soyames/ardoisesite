import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'

// Helper function to generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function SubscriptionPanel({ schoolId }) {
  const [loading, setLoading] = useState(true)
  const [schoolData, setSchoolData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!schoolId) return

    const fetchSchoolData = async () => {
      try {
        const docRef = doc(db, 'schools', schoolId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setSchoolData(docSnap.data())
        }
      } catch (err) {
        setError("Erreur lors du chargement des informations de l'école.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolData()
  }, [schoolId])

  const handlePaymentComplete = async (tx) => {
    try {
      setLoading(true)
      const docRef = doc(db, 'schools', schoolId)
      
      const newActivationCode = schoolData?.activationCode || generateUUID()
      
      // Activer l'abonnement dans Firestore
      await updateDoc(docRef, {
        subscriptionStatus: 'active',
        activationCode: newActivationCode,
        lastPaymentDate: serverTimestamp(),
        lastPaymentTx: tx.id || 'manual'
      })
      // Mettre à jour l'état local
      setSchoolData((prev) => ({
        ...prev,
        subscriptionStatus: 'active',
        activationCode: newActivationCode,
        lastPaymentDate: new Date()
      }))
      alert("Paiement réussi ! Votre abonnement est actif. Veuillez récupérer votre clé d'activation et télécharger le logiciel.")
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'abonnement :", err)
      alert("Le paiement a réussi, mais nous n'avons pas pu activer votre abonnement. Veuillez contacter le support.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-ink-muted">Chargement de l'abonnement...</div>
  }

  if (error) {
    return <div className="p-4 bg-error-50 text-error-800 rounded-card">{error}</div>
  }

  const isActive = schoolData?.subscriptionStatus === 'active'
  const PRICE_FCFA = 50000

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Votre Abonnement Ardoise ERP" />
        <CardBody>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1 w-full">
              <h3 className="text-xl font-bold text-ink mb-2">Statut de la licence</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${isActive ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success-500' : 'bg-warning-500'}`}></span>
                  {isActive ? 'Actif' : 'Inactif / En attente de paiement'}
                </span>
              </div>
              <p className="text-ink-muted text-sm leading-relaxed mb-6">
                L'abonnement Ardoise ERP vous donne accès à notre <strong>logiciel à installer sur place</strong> pour une sécurité maximale, 
                ainsi qu'une vitrine publique sur notre Marketplace pour recruter les meilleurs professeurs. Vos données ne quittent jamais votre école !
              </p>
              
              {!isActive ? (
                <div className="bg-surface-raised p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-ink">Licence Annuelle</span>
                    <span className="text-xl font-bold text-primary-600">{PRICE_FCFA.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  
                  {/* On force la clé publique globale de la plateforme */}
                  <FedaPayButton
                    publicKey={import.meta.env.VITE_FEDAPAY_PUBLIC_KEY}
                    amount={PRICE_FCFA}
                    description={`Abonnement SaaS ERP pour l'école ${schoolData?.name || schoolId}`}
                    customerEmail={schoolData?.email || 'ecole@example.com'}
                    onComplete={handlePaymentComplete}
                  >
                    <button className="w-full rounded-control bg-primary-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-500">
                      Payer l'abonnement annuel
                    </button>
                  </FedaPayButton>
                </div>
              ) : (
                <div className="bg-primary-50 p-6 rounded-xl border border-primary-200">
                  <h4 className="font-bold text-primary-900 mb-2">Logiciel prêt à installer !</h4>
                  <p className="text-sm text-primary-800 mb-4">
                    Votre abonnement est actif. Voici votre clé d'activation secrète à insérer lors du premier démarrage du logiciel dans votre école :
                  </p>
                  <div className="bg-white p-3 rounded border border-primary-200 font-mono text-center text-lg text-primary-700 tracking-wider mb-6 break-all">
                    {schoolData?.activationCode || 'Génération en cours...'}
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => alert("Le téléchargement de l'installeur Windows (.exe) démarrera ici.")} className="w-full rounded-control bg-primary-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-500 flex justify-center items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Télécharger Ardoise Serveur (Windows)
                    </button>
                    <p className="text-xs text-center text-primary-600 mt-2">
                      Ou branchez simplement votre <strong>Ardoise Box</strong> si vous en avez commandé une.
                    </p>
                  </div>
                </div>
              )}
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
