import { getApiBaseUrl } from '../../config/env.js'

/**
 * Thin fetch wrapper matching the backend's actual auth model exactly
 * (see ardoise/apps/core/api_views.py): Django session cookie auth,
 * plus an X-CSRFToken header read from the csrftoken cookie on every
 * unsafe request. No token/JWT storage anywhere in this file on
 * purpose -- there is nothing to store, the cookie IS the session.
 */

class ApiError extends Error {
  constructor(status, data) {
    super(typeof data?.error === 'string' ? data.error : `Request failed (${status})`)
    this.status = status
    this.data = data
  }
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Call once on app boot, before any login attempt -- see LoginView's docstring on the backend for why this step is not optional. */
export async function primeCsrf() {
  await request('/api/auth/csrf/', { method: 'GET' })
}

async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const isUnsafe = method !== 'GET' && method !== 'HEAD'
  const finalHeaders = { ...headers }
  if (!isFormData) {
    finalHeaders['Content-Type'] = 'application/json'
  }
  if (isUnsafe) {
    const csrfToken = readCookie('csrftoken')
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
  postForm: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export { ApiError }
