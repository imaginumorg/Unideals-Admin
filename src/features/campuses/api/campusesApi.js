import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const campusesApi = {
  getCampuses: () => fetcher(() => requestBackend('/admin/campuses')),
  createCampus: (campus) =>
    fetcher(() =>
      requestBackend('/admin/campuses', {
        method: 'POST',
        body: campus,
      }),
    ),
  updateCampus: (campusId, updates) =>
    fetcher(() =>
      requestBackend(`/admin/campuses/${campusId}`, {
        method: 'PATCH',
        body: updates,
      }),
    ),
  deleteCampus: (campusId) =>
    fetcher(() =>
      requestBackend(`/admin/campuses/${campusId}`, {
        method: 'DELETE',
      }),
    ),
}
