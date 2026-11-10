import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const profileApi = {
  getProfile: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/profile')
      return createApiResponse(response.data, response.message)
    }),

  updateProfile: (updates) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/profile', { method: 'PATCH', body: updates })
      return createApiResponse(response.data, response.message)
    }),

  changePassword: ({ currentPassword, newPassword }) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/profile/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      return createApiResponse(null, response.message)
    }),
}
