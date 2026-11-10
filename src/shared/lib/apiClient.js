const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Fired when the session can't be refreshed; AuthContext listens and signs out.
export const SESSION_EXPIRED_EVENT = 'admin:session-expired'

export const buildUrl = (path, query = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

const NO_REFRESH_PATHS = ['/admin/auth/login', '/admin/auth/refresh-token', '/admin/auth/logout']

// Single in-flight refresh shared by every request that hits a 401.
let refreshPromise = null
const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl('/admin/auth/refresh-token'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        window.setTimeout(() => {
          refreshPromise = null
        }, 0)
      })
  }
  return refreshPromise
}

const send = (path, { method, body, query }) =>
  fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

export const requestBackend = async (path, { method = 'GET', body, query } = {}) => {
  let response
  try {
    response = await send(path, { method, body, query })
    if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
      const refreshed = await refreshSession()
      if (refreshed) {
        response = await send(path, { method, body, query })
      } else {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
      }
    }
  } catch {
    const error = new Error('Unable to reach the server. Check your connection or API URL.')
    error.status = 0
    throw error
  }

  const payload = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }))

  if (!response.ok || !payload.success) {
    const error = new Error(payload.message || `Request failed (${response.status})`)
    error.status = response.status
    error.accountBlocked = Boolean(payload.accountBlocked)
    error.accountStatus = payload.accountStatus
    throw error
  }

  return payload
}

export const createApiResponse = (data, message = 'Request completed', pagination = null) => ({
  success: true,
  message,
  data,
  pagination,
})

/**
 * Normalises any request into { success, message, data, pagination }.
 * Never throws — failures come back as success:false with the message.
 */
export const fetcher = async (request) => {
  try {
    const result = typeof request === 'function' ? await request() : request
    if (!result?.success) throw new Error(result?.message || 'Request failed')
    return {
      success: true,
      message: result.message,
      data: result.data,
      pagination: result.pagination ?? null,
    }
  } catch (error) {
    return { success: false, message: error.message, data: null, pagination: null, status: error.status }
  }
}
