import { useState } from 'react'

export function CinetPayButton({
  amount,
  description,
  customMetadata,
  customerEmail,
  customerName,
  customerFirstname,
  customerLastname,
  customerPhoneNumber,
  siteId,
  apikey,
  notifyUrl,
  onComplete,
  onBeforeOpen,
  className = "w-full rounded-control bg-accent-500 px-3 py-2 text-sm font-semibold text-primary-950 shadow-sm hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
  children
}) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!window.CinetPay) {
      alert("Le module CinetPay n'a pas pu être chargé. Veuillez rafraîchir la page.")
      return
    }

    setIsProcessing(true)

    let finalMetadata = customMetadata || {}

    if (onBeforeOpen) {
      try {
        const result = await onBeforeOpen()
        if (result === false) {
          setIsProcessing(false)
          return
        }
        if (typeof result === 'object') {
          finalMetadata = { ...finalMetadata, ...result }
        }
      } catch (err) {
        setIsProcessing(false)
        return
      }
    }

    if (!siteId || !apikey) {
      console.error("Clés CinetPay manquantes")
      alert("Erreur de configuration du paiement.")
      setIsProcessing(false)
      return
    }

    const [fallbackFirstname, ...fallbackLastnameParts] = (customerName || '').split(' ')
    const firstname = customerFirstname || fallbackFirstname || 'Client'
    const lastname = customerLastname || (fallbackLastnameParts.length ? fallbackLastnameParts.join(' ') : 'Ardoise')
    
    // CinetPay needs a unique transaction_id for every attempt
    const transactionId = `TX_${Date.now()}_${Math.floor(Math.random() * 10000)}`

    try {
      window.CinetPay.setConfig({
        apikey: apikey,
        site_id: siteId,
        notify_url: notifyUrl || `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/finance/webhooks/cinetpay/`,
        mode: import.meta.env.VITE_CINETPAY_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
      })

      window.CinetPay.getCheckout({
        transaction_id: transactionId,
        amount: Math.round(amount),
        currency: 'XOF', // Assuming XOF for now, though CinetPay supports XAF, CDF, etc.
        channels: 'ALL',
        description: description || 'Paiement',
        customer_name: lastname,
        customer_surname: firstname,
        customer_email: customerEmail || 'test@example.com',
        customer_phone_number: customerPhoneNumber || '',
        customer_city: 'Ville',
        customer_country: 'CI',
        customer_state: 'CI',
        customer_zip_code: '00000',
        cpm_custom: JSON.stringify(finalMetadata)
      })

      window.CinetPay.waitResponse(function(data) {
        setIsProcessing(false)
        if (data.status === "REFUSED") {
          alert("Votre paiement a échoué. Veuillez réessayer.")
        } else if (data.status === "ACCEPTED") {
          if (onComplete) {
            onComplete({ id: transactionId, ...data })
          }
        }
      })
      
      window.CinetPay.onError(function(data) {
        console.error('CinetPay error:', data)
        setIsProcessing(false)
        alert("Une erreur est survenue lors du paiement.")
      })
    } catch (err) {
      console.error('CinetPay widget failed to open:', err)
      alert("Le module de paiement n'a pas pu s'ouvrir. Veuillez rafraîchir la page et réessayer.")
      setIsProcessing(false)
    }
  }

  return (
    <button 
      onClick={handlePayment} 
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? 'Ouverture...' : (children || 'Payer avec CinetPay')}
    </button>
  )
}
