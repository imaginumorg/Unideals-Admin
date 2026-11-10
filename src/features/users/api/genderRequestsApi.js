import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const genderRequestsApi = {
  getPending: ({ page = 1, limit = 20 } = {}) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/gender-requests', { query: { page, limit } })
      return createApiResponse(response.data, response.message, response.pagination)
    }),

  review: (userId, action) =>
    fetcher(async () => {
      const response = await requestBackend(`/admin/gender-requests/${userId}`, {
        method: 'PATCH',
        body: { action },
      })
      return createApiResponse(response.data, response.message)
    }),
}
