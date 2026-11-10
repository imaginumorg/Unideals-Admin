import { fetcher, requestBackend } from './apiClient'

export const savedViewsApi = {
  list: (page) => fetcher(() => requestBackend('/admin/saved-views', { query: { page } })),
  create: ({ page, name, query }) =>
    fetcher(() => requestBackend('/admin/saved-views', { method: 'POST', body: { page, name, query } })),
  remove: (id) => fetcher(() => requestBackend(`/admin/saved-views/${id}`, { method: 'DELETE' })),
}
