/**
 * The school ERP (saas.ardoiseeduc.com) and the marketplace
 * (ardoiseeduc.com) are one shared frontend build deployed to two
 * hostnames (see vite.config.js / deploy.yml + deploy-saas.yml).
 * Platform-internal roles (Ardoise's own team, not a school) used to
 * be exempted from this split entirely and could log in on either
 * customer-facing domain - they now belong on their own third domain,
 * ops.ardoiseeduc.com (a separate app - see /ops), so the customer
 * product's own bundle/deploy never carries internal tooling.
 * RequireRole and LoginPage enforce which hostname a given role
 * actually belongs on - a parent who followed an old bookmark to
 * saas.* (or a superadmin who somehow still lands here) gets bounced
 * to the right one with no manual correction needed. Parent/teacher
 * are marketplace-native roles (self-serve, not tied to running a
 * specific school's day-to-day ERP); every provisioned staff/student
 * role in core.Role belongs on the school's own SaaS domain; every
 * TEAM_ROLES entry (ardoise-api/src/index.ts) belongs on ops.
 */
const MARKETPLACE_HOST = 'ardoiseeduc.com'
const SAAS_HOST = 'saas.ardoiseeduc.com'
const OPS_HOST = 'ops.ardoiseeduc.com'

const MARKETPLACE_ROLES = new Set(['parent', 'teacher'])
// Mirrors ardoise-api/src/index.ts's TEAM_ROLES exactly - keep in sync.
const PLATFORM_ROLES = new Set([
  'superadmin', 'support_agent', 'school_onboarding', 'dev_onboarding', 'billing_agent', 'marketing_agent',
])

export function isSaasHost() {
  return (
    window.location.hostname.includes('saas') ||
    (window.location.hostname === 'localhost' && window.location.search.includes('saas=1'))
  )
}

/**
 * True if `role` is expected to be operating on the CURRENT hostname.
 * Always true on localhost - there is no real second hostname to
 * enforce against in dev. Platform roles never match saas/marketplace;
 * they only ever belong on ops.ardoiseeduc.com (a separate app).
 */
export function roleMatchesCurrentDomain(role) {
  if (window.location.hostname === 'localhost') return true
  if (PLATFORM_ROLES.has(role)) return false
  return MARKETPLACE_ROLES.has(role) !== isSaasHost()
}

/**
 * Cross-origin redirect (a real page load, not React Router's
 * <Navigate> - these are different origins) to the domain `role`
 * actually belongs on. `path` is only honored for the saas/marketplace
 * pair (ops is a separate app with its own routing, not this one's
 * /portal paths) - platform roles always land on ops's root. Call only
 * after confirming roleMatchesCurrentDomain(role) is false.
 */
export function redirectToCorrectDomain(role, path) {
  if (PLATFORM_ROLES.has(role)) {
    window.location.href = `https://${OPS_HOST}/`
    return
  }
  const targetHost = MARKETPLACE_ROLES.has(role) ? MARKETPLACE_HOST : SAAS_HOST
  window.location.href = `https://${targetHost}${path}`
}
