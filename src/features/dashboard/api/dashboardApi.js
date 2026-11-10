import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const dashboardApi = {
  getDashboard: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/dashboard')
      return createApiResponse(response.data, response.message)
    }),
}
