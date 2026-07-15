import React, { useState } from 'react'

export function FedaPayButton({ 
  amount, 
  description, 
  customMetadata, 
  customerEmail,
  customerName,
  publicKey,
  onComplete,
  className = "w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
  children 
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = () => {
    if (!window.FedaPay) {
      alert("Le module de paiement n'a pas pu être chargé. Veuillez rafraîchir la page.")
      return
    }

    setIsProcessing(true)

    // Si le composant reçoit une clé en prop (ex: clé de l'école), on l'utilise
    // Sinon on prend la clé globale (Ardoise)
    const effectivePublicKey = publicKey || import.meta.env.VITE_FEDAPAY_PUBLIC_KEY
    if (!effectivePublicKey) {
      console.error("Clé publique FedaPay manquante")
      alert("Erreur de configuration du paiement.")
      setIsProcessing(false)
      return
    }

    const widget = window.FedaPay.init({
      public_key: effectivePublicKey,
      transaction: {
        amount: amount,
        description: description,
        custom_metadata: customMetadata
      },
      customer: {
        email: customerEmail,
        name: customerName,
      },
      onComplete: (resp) => {
        setIsProcessing(false)
        if (onComplete) {
          onComplete(resp.transaction)
        }
      },
      onClose: () => {
        setIsProcessing(false)
      }
    })

    widget.open()
  }

  return (
    <button 
      onClick={handlePayment} 
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? 'Ouverture...' : (children || 'Payer avec FedaPay')}
    </button>
  )
}
