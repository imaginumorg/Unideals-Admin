import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const usersApi = {
  getUsers: ({ search = '', campus = '', status = '', page = 1, limit = 10 } = {}) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/users', {
        query: { search, status, campus, page, limit },
      })
      return createApiResponse(response.data, response.message, response.pagination)
    }),

  getUserDetails: (userId) =>
    fetcher(async () => {
      if (!userId) throw new Error('User ID is required')
      const response = await requestBackend(`/admin/users/${userId}`)
      return createApiResponse(response.data, response.message)
    }),

  updateUserStatus: (userId, status) =>
    fetcher(async () => {
      const response = await requestBackend(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: { status },
      })
      return createApiResponse(response.data, response.message)
    }),

  updateUserRole: (userId, role) =>
    fetcher(async () => {
      const response = await requestBackend(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role },
      })
      return createApiResponse(response.data, response.message)
    }),

  getUserStats: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/users/stats')
      return createApiResponse(response.data, response.message)
    }),
}
