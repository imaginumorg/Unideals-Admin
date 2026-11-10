import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const accessApi = {
  // { features, adminOnly, defaults, mine, support?, updatedAt?, updatedBy? }
  get: () => fetcher(() => requestBackend('/admin/access')),
  // permissions: { [section]: { view, manage } } — Super Admin only.
  updateSupport: (permissions) => fetcher(() => requestBackend('/admin/access/support', { method: 'PUT', body: { permissions } })),
  // Custom access for one support person (Super Admin only).
  updatePerson: (userId, permissions) =>
    fetcher(() => requestBackend(`/admin/access/staff/${userId}`, { method: 'PUT', body: { permissions } })),
  // Put a support person back on the role defaults.
  resetPerson: (userId) => fetcher(() => requestBackend(`/admin/access/staff/${userId}`, { method: 'DELETE' })),
  // Badge counts for the sections the caller can see.
  attention: () => fetcher(() => requestBackend('/admin/attention')),
}
