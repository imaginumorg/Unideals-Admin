import { fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const jobsApi = {
  getJobs: () => fetcher(() => requestBackend('/admin/system/jobs')),
  getRuns: (key, { page = 1, status = '' } = {}) =>
    fetcher(() => requestBackend(`/admin/system/jobs/${key}/runs`, { query: { page, status, limit: 20 } })),
  runNow: (key) => fetcher(() => requestBackend(`/admin/system/jobs/${key}/run`, { method: 'POST' })),
}

export const systemApi = {
  // window: minutes of traffic to summarise (15 or 60). refresh re-probes external services.
  getStatus: ({ window = 15, refresh = false } = {}) =>
    fetcher(() => requestBackend('/admin/system/status', { query: { window, refresh: refresh ? 'true' : undefined } })),
}
