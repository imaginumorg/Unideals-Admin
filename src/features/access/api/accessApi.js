import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const accessApi = {
  // { features, adminOnly, campusScoped, defaults, mine, mineIsCustom, mineCampuses,
  //   support?, supportCampuses?, staff?, campuses?, updatedAt?, updatedBy? }
  get: () => fetcher(() => requestBackend('/admin/access')),
  // permissions: { [section]: { view, manage } }; campuses: [campusId] ([] = every campus). Super Admin only.
  updateSupport: (permissions, campuses) =>
    fetcher(() => requestBackend('/admin/access/support', { method: 'PUT', body: { permissions, campuses } })),
  // Custom access for one support person (Super Admin only).
  updatePerson: (userId, permissions, campuses) =>
    fetcher(() => requestBackend(`/admin/access/staff/${userId}`, { method: 'PUT', body: { permissions, campuses } })),
  // Put a support person back on the role defaults.
  resetPerson: (userId) => fetcher(() => requestBackend(`/admin/access/staff/${userId}`, { method: 'DELETE' })),
  // Badge counts for the sections the caller can see.
  attention: () => fetcher(() => requestBackend('/admin/attention')),
}
