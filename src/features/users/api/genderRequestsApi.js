import { createApiResponse, fetcher, requestBackend, requestBlob } from '../../../shared/lib/apiClient'

export const genderRequestsApi = {
  getPending: ({ page = 1, limit = 20 } = {}) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/gender-requests', { query: { page, limit } })
      return createApiResponse(response.data, response.message, response.pagination)
    }),

  // `note` is optional and shown to the student when a request is rejected.
  review: (userId, action, note) =>
    fetcher(async () => {
      const trimmed = typeof note === 'string' ? note.trim() : ''
      const response = await requestBackend(`/admin/gender-requests/${userId}`, {
        method: 'PATCH',
        body: { action, ...(trimmed ? { note: trimmed } : {}) },
      })
      return createApiResponse(response.data, response.message)
    }),

  // College ID photo for a pending request. Never cached by the server, and
  // every view is recorded in the audit log.
  getIdCard: (userId) =>
    fetcher(async () => {
      const blob = await requestBlob(`/admin/gender-requests/${userId}/id-card`)
      return createApiResponse(blob, 'ID photo loaded')
    }),
}
