import { getApiBaseUrl } from '../../config/env.js'

/**
 * Thin fetch wrapper matching the backend's actual auth model
 * (see ardoise/apps/core/api_views.py): Django session cookie auth,
 * plus an X-CSRFToken header on every unsafe request.
 *
 * The token is captured from primeCsrf()'s response BODY, not read
 * from document.cookie: every real deployment has this frontend
 * (saas.ardoise.soyames.com) on a different origin than the school's
 * own backend, and document.cookie can only ever see cookies set for
 * the page's own origin - no CORS or SameSite setting changes that,
 * it's basic same-origin policy. The csrftoken cookie IS still
 * correctly stored by the browser and sent automatically on
 * subsequent cross-origin requests (SESSION_COOKIE_SAMESITE=None on
 * the backend), which is why session auth itself worked - only the
 * client's own attempt to read the cookie value to build the
 * X-CSRFToken header never could. Every unsafe request 403'd as a
 * result, for every real (necessarily cross-origin) deployment.
 *
 * The token itself is kept in sessionStorage, not a module-level
 * variable: this file is both statically and dynamically imported
 * across the app (see the Vite build's own INEFFECTIVE_DYNAMIC_IMPORT
 * warning naming this exact file), which means different route
 * chunks can each end up with their own separate bundled copy and
 * their own separate closure - a plain `let csrfToken` set by
 * AuthContext.jsx's primeCsrf() call was invisible to every other
 * chunk's copy of this module, which always saw csrfToken as null
 * and silently sent no header. sessionStorage is the one thing every
 * copy actually shares.
 */

const CSRF_STORAGE_KEY = 'ARDOISE_CSRF_TOKEN'

class ApiError extends Error {
  constructor(status, data) {
    super(typeof data?.error === 'string' ? data.error : `Request failed (${status})`)
    this.status = status
    this.data = data
  }
}

/** Call once on app boot, before any login attempt -- see LoginView's docstring on the backend for why this step is not optional. */
export async function primeCsrf() {
  const data = await request('/api/auth/csrf/', { method: 'GET' })
  if (data?.csrfToken) sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrfToken)
}

async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const isUnsafe = method !== 'GET' && method !== 'HEAD'
  const finalHeaders = { ...headers }
  if (!isFormData) {
    finalHeaders['Content-Type'] = 'application/json'
  }
  if (isUnsafe) {
    const csrfToken = sessionStorage.getItem(CSRF_STORAGE_KEY)
    if (csrfToken) finalHeaders['X-CSRFToken'] = csrfToken
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    credentials: 'include', // send/receive the session + csrf cookies cross-origin
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    throw new ApiError(response.status, data)
  }
  return data
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  patchForm: (path, formData) => request(path, { method: 'PATCH', body: formData, isFormData: true }),
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export { ApiError }
