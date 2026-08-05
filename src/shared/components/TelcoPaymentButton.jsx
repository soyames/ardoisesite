import React, { useState } from 'react'
import { api } from '../api/client.js'

export function TelcoPaymentButton({ telcoProviderName, telcoApiKey, telcoMerchantId, amount, schoolId, onPaymentSuccess, className }) {
  const [showModal, setShowModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const isOrange = (telcoProviderName || '').toLowerCase().includes('orange')

  const handlePay = async (e) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)

    try {
      const response = await api.post('/api/finance/telco/initiate/', {
        amount,
        school_id: schoolId,
        phone_number: isOrange ? undefined : phoneNumber
      })
      
      if (response.status === 'redirect' && response.payment_url) {
        // Orange Money flow
        window.location.href = response.payment_url
      } else if (response.status === 'pending') {
        // Airtel Money flow (USSD Push)
        setShowModal(false)
        if (onPaymentSuccess) onPaymentSuccess({ status: 'pending', message: response.message || 'Veuillez valider le paiement sur votre téléphone.' })
      }
      
    } catch (err) {
      // In development, this will typically fail with 401 Unauthorized until real keys are provided
      const errMsg = err.response?.data?.error || err.message || 'Erreur lors de l\'initiation du paiement.'
      setError(errMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!telcoApiKey) {
    return (
      <button disabled className={className || "w-full rounded-control bg-surface-raised px-3 py-2 text-sm text-ink-muted"}>
        {telcoProviderName || "Paiement Mobile"} non configuré
      </button>
    )
  }

  return (
    <>
      <button 
        onClick={() => {
          if (isOrange) {
            // Orange Web Payment redirects to a web portal where the user enters their phone number.
            // We don't need to ask for it here.
            handlePay({ preventDefault: () => {} })
          } else {
            // Airtel USSD Push needs the phone number upfront
            setShowModal(true)
          }
        }}
        disabled={isProcessing}
        className={className || "w-full rounded-control bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"}
      >
        {isProcessing && isOrange ? "Redirection..." : `Payer via ${telcoProviderName || "Mobile Money"} (${amount} FCFA)`}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-card p-6 w-full max-w-sm shadow-raised relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-2">Paiement Mobile</h3>
            <p className="text-sm text-ink-muted mb-4">
              Veuillez saisir votre numéro de téléphone pour recevoir la demande de paiement (Push USSD).
            </p>

            <form onSubmit={handlePay}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="ex: +241 66 00 00 00"
                  className="w-full px-3 py-2 border border-border rounded-control focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {error && (
                <div className="text-sm text-danger-600 bg-danger-50 p-2 rounded mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || !phoneNumber}
                className="w-full bg-primary-600 text-white rounded-control px-3 py-2 font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {isProcessing ? "Traitement..." : `Confirmer (${amount} FCFA)`}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
