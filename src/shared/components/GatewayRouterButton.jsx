import React, { useState, useEffect } from 'react'
import { FedaPayButton } from './FedaPayButton'
import { CinetPayButton } from './CinetPayButton'
import { TelcoPaymentButton } from './TelcoPaymentButton'

// OHADA Countries mapped by their typical IANA Timezone
const TIMEZONE_TO_OHADA = {
  'Africa/Porto-Novo': 'BEN', // Bénin
  'Africa/Ouagadougou': 'BFA', // Burkina Faso
  'Africa/Douala': 'CMR', // Cameroun
  'Africa/Bangui': 'CAF', // Centrafrique
  'Indian/Comoro': 'COM', // Comores
  'Africa/Brazzaville': 'COG', // Congo
  'Africa/Kinshasa': 'COD', // RDC (Ouest)
  'Africa/Lubumbashi': 'COD', // RDC (Est)
  'Africa/Abidjan': 'CIV', // Côte d'Ivoire
  'Africa/Libreville': 'GAB', // Gabon
  'Africa/Conakry': 'GIN', // Guinée
  'Africa/Bissau': 'GNB', // Guinée-Bissau
  'Africa/Malabo': 'GNQ', // Guinée équatoriale
  'Africa/Bamako': 'MLI', // Mali
  'Africa/Niamey': 'NER', // Niger
  'Africa/Dakar': 'SEN', // Sénégal
  'Africa/Ndjamena': 'TCD', // Tchad
  'Africa/Lome': 'TGO', // Togo
}

// Strictly Deduplicated Payment Aggregator Coverage for OHADA
const FEDAPAY_SUPPORTED = ['BEN', 'BFA', 'CIV', 'GIN', 'NER', 'SEN', 'TGO']
const CINETPAY_SUPPORTED = ['CMR', 'COG', 'COD', 'MLI', 'TCD']
const TELCO_SUPPORTED = ['CAF', 'COM', 'GAB', 'GNB', 'GNQ']

export function GatewayRouterButton({
  fedaPayPublicKey,
  cinetpaySiteId,
  cinetpayApikey,
  cinetpaySecretKey,
  cinetpayNotifyUrl,
  telcoProviderName,
  telcoApiKey,
  telcoMerchantId,
  ...props
}) {
  const [detectedCountry, setDetectedCountry] = useState(null)

  useEffect(() => {
    // Dynamic Routing: Detect user's country from timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (TIMEZONE_TO_OHADA[tz]) {
        setDetectedCountry(TIMEZONE_TO_OHADA[tz])
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const hasFedaPay = !!fedaPayPublicKey
  const hasCinetPay = !!(cinetpaySiteId && cinetpayApikey)
  const hasTelco = !!telcoApiKey

  // 1. FedaPay priority
  if (detectedCountry && FEDAPAY_SUPPORTED.includes(detectedCountry) && hasFedaPay) {
    return <FedaPayButton publicKey={fedaPayPublicKey} {...props} />
  }

  // 2. CinetPay deduplicated routing
  if (detectedCountry && CINETPAY_SUPPORTED.includes(detectedCountry) && hasCinetPay) {
    return (
      <CinetPayButton
        siteId={cinetpaySiteId}
        apikey={cinetpayApikey}
        notifyUrl={cinetpayNotifyUrl}
        {...props}
      />
    )
  }

  // 3. Direct Telco fallback for the remaining 5 OHADA countries
  if (detectedCountry && TELCO_SUPPORTED.includes(detectedCountry) && hasTelco) {
    return (
      <TelcoPaymentButton
        telcoProviderName={telcoProviderName}
        telcoApiKey={telcoApiKey}
        telcoMerchantId={telcoMerchantId}
        {...props}
      />
    )
  }

  // Fallbacks if we couldn't detect country or if the detected country is not explicitly in the support list
  if (hasFedaPay) {
    return <FedaPayButton publicKey={fedaPayPublicKey} {...props} />
  }

  if (hasCinetPay) {
    return (
      <CinetPayButton
        siteId={cinetpaySiteId}
        apikey={cinetpayApikey}
        notifyUrl={cinetpayNotifyUrl}
        {...props}
      />
    )
  }

  if (hasTelco) {
    return (
      <TelcoPaymentButton
        telcoProviderName={telcoProviderName}
        telcoApiKey={telcoApiKey}
        telcoMerchantId={telcoMerchantId}
        {...props}
      />
    )
  }

  // Nothing configured
  return (
    <button disabled className={props.className || "w-full rounded-control bg-surface-raised px-3 py-2 text-sm text-ink-muted"}>
      Aucun mode de paiement configuré
    </button>
  )
}
