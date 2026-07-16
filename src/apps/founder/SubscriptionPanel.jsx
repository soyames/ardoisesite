import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../shared/api/firebase'
import { FedaPayButton } from '../../shared/components/FedaPayButton.jsx'
import { Card, CardHeader, CardBody } from '../../shared/ui/Card.jsx'

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
      // Activer l'abonnement dans Firestore
      await updateDoc(docRef, {
        subscriptionStatus: 'active',
        lastPaymentDate: serverTimestamp(),
        lastPaymentTx: tx.id || 'manual'
      })
      // Mettre à jour l'état local
      setSchoolData((prev) => ({
        ...prev,
        subscriptionStatus: 'active',
        lastPaymentDate: new Date()
      }))
      alert("Paiement réussi ! Votre abonnement est maintenant actif. Votre conteneur ERP va être déployé (une fois le système implémenté).")
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
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-ink mb-2">Statut de la licence</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${isActive ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success-500' : 'bg-warning-500'}`}></span>
                  {isActive ? 'Actif' : 'Inactif / En attente de paiement'}
                </span>
              </div>
              <p className="text-ink-muted text-sm leading-relaxed mb-6">
                L'abonnement Ardoise ERP vous donne accès à votre instance Cloud dédiée pour la gestion de votre école, 
                ainsi qu'une vitrine publique sur notre Marketplace pour attirer de nouveaux élèves et recruter les meilleurs professeurs.
              </p>
              
              {!isActive && (
                <div className="bg-surface-raised p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-ink">Licence Annuelle</span>
                    <span className="text-xl font-bold text-primary-600">{PRICE_FCFA.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  
                  {/* On force la clé publique globale de la plateforme, pas celle de l'école */}
                  <FedaPayButton
                    publicKey={import.meta.env.VITE_FEDAPAY_PUBLIC_KEY}
                    amount={PRICE_FCFA}
                    description={`Abonnement SaaS ERP pour l'école ${schoolData?.name || schoolId}`}
                    customerEmail={schoolData?.email || 'ecole@example.com'}
                    onComplete={handlePaymentComplete}
                  >
                    <button className="w-full rounded-control bg-primary-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-500">
                      Payer l'abonnement
                    </button>
                  </FedaPayButton>
                </div>
              )}
            </div>

            <div className="hidden md:block w-[1px] bg-border h-40"></div>

            <div className="flex-1 space-y-4">
              <h4 className="font-bold text-ink mb-3">Avantages inclus</h4>
              <ul className="space-y-2 text-sm text-ink-muted">
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  Serveur cloud privé (Conteneur Docker)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  Nombre illimité d'élèves et de professeurs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  Visibilité sur la Marketplace Ardoise
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success-500">✓</span>
                  Support technique prioritaire
                </li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
