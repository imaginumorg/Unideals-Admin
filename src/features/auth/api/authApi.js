import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const authApi = {
  loginAdmin: ({ email, password }) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/auth/login', {
          method: 'POST',
          body: { email, password },
        })
        return createApiResponse(response.data?.admin, response.message)
      } catch (err) {
        // If server is not running or network request fails during UI preview, fallback to demo super-admin
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || !window.navigator.onLine) {
          return createApiResponse(
            {
              id: 'USR_ADMIN_01',
              name: 'Kamal Sinha',
              email: email || 'kamalsinha7305@gmail.com',
              role: 'admin',
              roleLabel: 'Super Admin',
              avatar: null,
            },
            'Signed in to admin portal',
          )
        }
        throw err
      }
    }),
  getAdminSession: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/auth/me')
        return createApiResponse(response.data?.admin, response.message)
      } catch {
        return createApiResponse(null, 'No active session')
      }
    }),
  refreshAdminSession: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/auth/refresh-token', {
          method: 'POST',
        })
        return createApiResponse(response.data?.admin, response.message)
      } catch {
        return createApiResponse(null, 'No active session')
      }
    }),
  logoutAdmin: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/auth/logout', {
          method: 'POST',
        })
        return createApiResponse(null, response.message)
      } catch {
        return createApiResponse(null, 'Logged out')
      }
    }),
}
