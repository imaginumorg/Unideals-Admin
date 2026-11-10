import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const authApi = {
  loginAdmin: ({ email, password }) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      return createApiResponse(response.data?.admin, response.message)
    }),

  getAdminSession: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/auth/me')
      return createApiResponse(response.data?.admin, response.message)
    }),

  refreshAdminSession: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/auth/refresh-token', { method: 'POST' })
      return createApiResponse(response.data?.admin, response.message)
    }),

  logoutAdmin: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/auth/logout', { method: 'POST' })
      return createApiResponse(null, response.message)
    }),
}
