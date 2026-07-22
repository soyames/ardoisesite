/**
 * The school ERP (saas.ardoise.soyames.com) and the marketplace
 * (ardoise.soyames.com) are one shared frontend build deployed to two
 * hostnames (see vite.config.js / deploy.yml + deploy-saas.yml). Until
 * now nothing enforced which hostname a given role actually belongs
 * on - RequireRole and LoginPage let any authenticated role reach
 * /portal on either domain, so a parent who followed an old bookmark
 * to saas.* (or a founder who logged in from the marketplace) landed
 * on the wrong site with no correction. Parent/teacher are
 * marketplace-native roles (self-serve, not tied to running a
 * specific school's day-to-day ERP); every other role that reaches
 * /portal (founder, director, and every provisioned staff/student
 * role in core.Role) belongs on the school's own SaaS domain.
 */
const MARKETPLACE_HOST = 'ardoiseeduc.com'
const SAAS_HOST = 'saas.ardoiseeduc.com'

const MARKETPLACE_ROLES = new Set(['parent', 'teacher'])
// Platform-internal accounts (Ardoise's own team, not a school) have
// no schoolId and no meaningful "home" in this split - never redirect
// them.
const PLATFORM_ROLES = new Set(['superadmin', 'support_agent'])

export function isSaasHost() {
  return (
    window.location.hostname.includes('saas') ||
    (window.location.hostname === 'localhost' && window.location.search.includes('saas=1'))
  )
}

/**
 * True if `role` is expected to be operating on the CURRENT hostname.
 * Always true on localhost (and for platform roles) - there is no
 * real second hostname to enforce against in dev, and platform
 * accounts sit outside this split entirely.
 */
export function roleMatchesCurrentDomain(role) {
  if (window.location.hostname === 'localhost' || PLATFORM_ROLES.has(role)) return true
  return MARKETPLACE_ROLES.has(role) !== isSaasHost()
}

/**
 * Cross-origin redirect (a real page load, not React Router's
 * <Navigate> - saas.ardoise.soyames.com and ardoise.soyames.com are
 * different origins) to the same `path` on the domain `role` actually
 * belongs on. Call only after confirming roleMatchesCurrentDomain(role)
 * is false.
 */
export function redirectToCorrectDomain(role, path) {
  const targetHost = MARKETPLACE_ROLES.has(role) ? MARKETPLACE_HOST : SAAS_HOST
  window.location.href = `https://${targetHost}${path}`
}
