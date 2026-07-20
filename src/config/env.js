/**
 * Every school hosts its own backend on its own machine/domain (see
 * the ardoise backend repo's PROJECT_BRIEF.md, "Hosting model").
 * The global marketplace connects to the central platform (ardoise-platform)
 * while school portals connect to specific school APIs via localStorage.
 *
 * TODO: switch the fallback to https://api.ardoise.soyames.com once its
 * Workers Custom Domain cert issue is resolved (TLS handshake currently
 * fails on that hostname). Until then it must default to a hostname
 * that actually serves TLS, since this is the platform-wide fallback
 * every session without a cached ARDOISE_SCHOOL_API_URL falls back to.
 */
const DEFAULT_URL = import.meta.env.VITE_API_BASE_URL || 'https://ardoise-api.soyames.workers.dev'

export function getApiBaseUrl() {
  return localStorage.getItem('ARDOISE_SCHOOL_API_URL') || DEFAULT_URL
}

export function setApiBaseUrl(url) {
  if (url) {
    localStorage.setItem('ARDOISE_SCHOOL_API_URL', url)
  } else {
    localStorage.removeItem('ARDOISE_SCHOOL_API_URL')
  }
}

/**
 * The central platform Worker (ardoise-api), unconditionally -- never
 * the per-school override `getApiBaseUrl()` resolves to once a founder
 * is logged in. Platform-level routes (team invites, activation,
 * FedaPay/WhatsApp webhooks) live on api.ardoise.soyames.com itself,
 * not on any individual school's own Django backend.
 */
export function getPlatformApiBaseUrl() {
  return DEFAULT_URL
}

// Keep a fallback export for simple backwards compatibility, but use the getter for dynamic fetches
export const API_BASE_URL = getApiBaseUrl()
