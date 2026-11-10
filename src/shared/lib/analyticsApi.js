import { fetcher, requestBackend } from './apiClient'

// Buckets follow the viewer's calendar (the API defaults to Asia/Kolkata).
const timeZone = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
})()

export const analyticsApi = {
  // metrics: users,listings,orders,deals,gmv,cancelled,revenue,reports,reportsClosed,staffActions
  trends: (params) => fetcher(() => requestBackend('/admin/analytics/trends', { query: { tz: timeZone, ...params } })),
  // dims: listingStatus,listingCategory,campusComparison,reportStatus,queueType,queuePriority,queueReason,auditAction,auditActor
  breakdown: (params) => fetcher(() => requestBackend('/admin/analytics/breakdown', { query: { tz: timeZone, ...params } })),
  jobs: (params) => fetcher(() => requestBackend('/admin/analytics/jobs', { query: { tz: timeZone, ...params } })),
}
