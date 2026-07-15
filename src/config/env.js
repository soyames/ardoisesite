/**
 * Every school hosts its own backend on its own machine/domain (see
 * the ardoise backend repo's PROJECT_BRIEF.md, "Hosting model").
 * The global marketplace connects to the central platform (ardoise-platform)
 * while school portals connect to specific school APIs via localStorage.
 */
const DEFAULT_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.ardoise.soyames.com'

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

// Keep a fallback export for simple backwards compatibility, but use the getter for dynamic fetches
export const API_BASE_URL = getApiBaseUrl()
