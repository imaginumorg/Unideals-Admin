import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const notificationsApi = {
  getStats: () =>
    fetcher(() => requestBackend('/admin/notifications/stats')),

  getHistory: (page = 1, limit = 20) =>
    fetcher(() =>
      requestBackend('/admin/notifications/history', {
        query: { page, limit },
      }),
    ),

  getScheduled: () =>
    fetcher(() => requestBackend('/admin/notifications/scheduled')),

  getRecipientEstimate: ({ targetAudience = 'all', targetCampus = null }) =>
    fetcher(() =>
      requestBackend('/admin/notifications/estimate-recipients', {
          query: {
            target_audience: targetAudience,
            target_campus: targetCampus || undefined,
          },
        }),
    ),

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
