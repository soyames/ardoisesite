import { useState } from 'react'

// FedaPay's customer.phone_number is an object ({number, country}), not
// a plain string - confirmed against docs.fedapay.com/integration-api/fr/
// customer-management-fr. Passing a bare string (the earlier fix) left
// the phone field on their payment page still blank. The marketplace is
// Benin-only today (see FRANCOPHONE_AFRICA_DATA/BENIN_CITIES in
// SchoolList.jsx), so default the country to 'bj' and strip a leading
// +229 if present - a phone stored some other way isn't a real case
// yet, not worth a full libphonenumber dependency for one country.
function toFedaPayPhoneNumber(raw) {
  if (!raw) return undefined
  const digitsOnly = raw.replace(/[^\d+]/g, '')
  const withoutCountryCode = digitsOnly.startsWith('+229')
    ? digitsOnly.slice(4)
    : digitsOnly.replace(/^\+/, '')
  return { number: withoutCountryCode, country: 'bj' }
}

export function FedaPayButton({
  amount,
  description,
  customMetadata,
  customerEmail,
  customerName,
  customerFirstname,
  customerLastname,
  customerPhoneNumber,
  publicKey,
  onComplete,
  onBeforeOpen,
  className = "w-full rounded-control bg-accent-500 px-3 py-2 text-sm font-semibold text-primary-950 shadow-sm hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
  children
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!window.FedaPay) {
      alert("Le module de paiement n'a pas pu être chargé. Veuillez rafraîchir la page.")
      return
    }

    setIsProcessing(true)

    let finalMetadata = customMetadata || {}

    if (onBeforeOpen) {
      try {
        const result = await onBeforeOpen()
        if (result === false) {
          setIsProcessing(false)
          return // Abort if hook returns false
        }
        if (typeof result === 'object') {
          finalMetadata = { ...finalMetadata, ...result }
        }
      } catch (err) {
        setIsProcessing(false)
        return // Abort on error
      }
    }

    // Si le composant reçoit une clé en prop (ex: clé de l'école), on l'utilise
    // Sinon on prend la clé globale (Ardoise)
    const effectivePublicKey = publicKey || import.meta.env.VITE_FEDAPAY_PUBLIC_KEY
    if (!effectivePublicKey) {
      console.error("Clé publique FedaPay manquante")
      alert("Erreur de configuration du paiement.")
      setIsProcessing(false)
      return
    }

    // FedaPay's checkout.js customer object takes firstname/lastname/
    // phone_number, not a combined `name` field - that mismatch is why
    // the Nom/Prenom/telephone fields on the FedaPay payment page never
    // pre-filled, confirmed live: the widget rendered them blank even
    // though callers were passing real values. Split customerName as a
    // fallback for call sites that only have one combined string.
    const [fallbackFirstname, ...fallbackLastnameParts] = (customerName || '').split(' ')
    const firstname = customerFirstname || fallbackFirstname || undefined
    const lastname = customerLastname || (fallbackLastnameParts.length ? fallbackLastnameParts.join(' ') : undefined)

    const widget = window.FedaPay.init({
      public_key: effectivePublicKey,
      environment: import.meta.env.VITE_FEDAPAY_ENVIRONMENT || 'sandbox',
      transaction: {
        amount: amount,
        description: description,
        custom_metadata: finalMetadata
      },
      customer: {
        email: customerEmail,
        firstname,
        lastname,
        phone_number: toFedaPayPhoneNumber(customerPhoneNumber),
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
