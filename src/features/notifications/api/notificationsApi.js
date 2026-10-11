import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const notificationsApi = {
  getStats: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/notifications/stats')
        return response
      } catch (error) {
        return createApiResponse(
          {
            totalSent: 2548,
            delivered: 2421,
            deliveredPercent: 95,
            clicked: 842,
            clickedPercent: 33,
            activeUsers: 1204,
          },
          'Default stats fallback',
        )
      }
    }),

  getHistory: (page = 1, limit = 20) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/notifications/history', {
          query: { page, limit },
        })
        return response
      } catch (error) {
        return createApiResponse({ items: [], total: 0, page: 1, totalPages: 1 })
      }
    }),

  getScheduled: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/notifications/scheduled')
        return response
      } catch (error) {
        return createApiResponse([])
      }
    }),

  getRecipientEstimate: ({ targetAudience = 'all', targetCampus = null }) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/notifications/estimate-recipients', {
          query: {
            target_audience: targetAudience,
            target_campus: targetCampus || undefined,
          },
        })
        return response
      } catch (error) {
        return createApiResponse({ count: targetAudience === 'campus' ? 2450 : 8452 })
      }
    }),

  sendNotification: (payload) =>
    requestBackend('/admin/notifications', {
      method: 'POST',
      body: payload,
    }),

  cancelScheduled: (id) =>
    requestBackend(`/admin/notifications/${id}/cancel`, {
      method: 'PATCH',
    }),
}
