import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const accessApi = {
  // { features, adminOnly, defaults, mine, support?, updatedAt?, updatedBy? }
  get: () => fetcher(() => requestBackend('/admin/access')),
  // permissions: { [section]: { view, manage } } — Super Admin only.
  updateSupport: (permissions) => fetcher(() => requestBackend('/admin/access/support', { method: 'PUT', body: { permissions } })),
  // Badge counts for the sections the caller can see.
  attention: () => fetcher(() => requestBackend('/admin/attention')),
}
