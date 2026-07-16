/**
 * Client-side mirror of ardoise's apps/core/utils.py:parse_user_agent
 * - same categories, same limits (no bot detection, no version
 * numbers). Used for the marketplace account's "this session" info,
 * since a Firebase-authenticated client has no server-side session
 * row the way the Django ERP side does (see SessionsTab.jsx there for
 * the fuller multi-device version) - this only describes the current
 * browser, not a list of devices.
 */
export function parseUserAgent(ua) {
  ua = ua || ''

  let deviceType
  if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet'
  else if (/Mobi|Android|iPhone/i.test(ua)) deviceType = 'mobile'
  else if (ua) deviceType = 'desktop'
  else deviceType = 'unknown'

  let browser = ''
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Chrome/') && !ua.includes('Chromium')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'

  let operatingSystem = ''
  if (ua.includes('Windows')) operatingSystem = 'Windows'
  else if (ua.includes('iPhone') || ua.includes('iPad')) operatingSystem = 'iOS'
  else if (ua.includes('Mac OS X')) operatingSystem = 'macOS'
  else if (ua.includes('Android')) operatingSystem = 'Android'
  else if (ua.includes('Linux')) operatingSystem = 'Linux'

  return { deviceType, browser, operatingSystem }
}
