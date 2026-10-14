import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const moderationApi = {
  getQueue: (params = {}) =>
    fetcher(() => requestBackend('/admin/moderation/queue', { query: params })),

  dismissReports: ({ targetId, targetModel }) =>
    fetcher(() =>
      requestBackend('/admin/moderation/dismiss', {
          method: 'POST',
          body: { targetId, targetModel },
        }),
    ),

  resolveReports: ({ targetId, targetModel, adminNote = '' }) =>
    fetcher(() =>
      requestBackend('/admin/moderation/resolve', {
          method: 'POST',
          body: { targetId, targetModel, adminNote },
        }),
    ),
}
