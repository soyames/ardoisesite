import { createContext, useContext, useEffect, useState } from 'react'
import { ALPHA2_TO_OHADA_CODE } from '../constants/ohadaAlpha2Codes.js'
import { OHADA_COUNTRIES } from '../constants/locations.js'

const GeoContext = createContext(null)
const OHADA_CODES = new Set(OHADA_COUNTRIES.map((c) => c.code))

export function GeoProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', countryCode: null })

  useEffect(() => {
    let cancelled = false

    // No Cloudflare edge in local dev, so geo detection can't run there -
    // default to Benin (or honor ?country=XXX for testing other OHADA
    // countries) instead of blocking every local session.
    if (window.location.hostname === 'localhost') {
      const debugCode = new URLSearchParams(window.location.search).get('country')
      const countryCode = debugCode && OHADA_CODES.has(debugCode) ? debugCode : 'BEN'
      setState({ status: 'resolved', countryCode })
      return
    }

    fetch('/api/geo')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const alpha2 = data?.country || null
        const countryCode = alpha2 ? ALPHA2_TO_OHADA_CODE[alpha2] || null : null
        setState({ status: 'resolved', countryCode })
      })
      .catch(() => {
        if (cancelled) return
        // Detection genuinely failed - treat as "not a covered country"
        // rather than silently granting access to an unknown visitor.
        setState({ status: 'resolved', countryCode: null })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <GeoContext.Provider value={{ status: state.status, countryCode: state.countryCode, isOhada: Boolean(state.countryCode) }}>
      {children}
    </GeoContext.Provider>
  )
}

export function useGeo() {
  const ctx = useContext(GeoContext)
  if (!ctx) throw new Error('useGeo must be used within a GeoProvider')
  return ctx
}
