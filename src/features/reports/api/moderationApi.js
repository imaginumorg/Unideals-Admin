import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

const SEED_QUEUE = [
  {
    targetId: 'PRD007',
    targetModel: 'Product',
    priority: 'high',
    reportCount: 3,
    target: {
      type: 'product',
      title: 'Study Lamp (Flickering wiring)',
      image: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600&auto=format&fit=crop&q=80',
      status: 'blocked',
      campus: 'Amrita',
      seller: {
        id: 'USR011',
        name: 'Divya Iyer',
        email: 'divya.iyer@amrita.edu',
      },
    },
    reports: [
      {
        reason: 'prohibited_item',
        notes: 'Electrical safety hazard with exposed wiring near socket.',
        createdAt: '2026-10-06T13:20:00.000Z',
        reporter: { name: 'Karan Sharma', email: 'karan@amrita.edu' },
      },
      {
        reason: 'misleading',
        notes: 'Product is defective and trips breaker.',
        createdAt: '2026-10-06T14:10:00.000Z',
        reporter: { name: 'Preeti Roy', email: 'preeti@amrita.edu' },
      },
      {
        reason: 'spam',
        notes: 'Duplicate listing with incorrect description.',
        createdAt: '2026-10-06T15:00:00.000Z',
        reporter: { name: 'Amrita Admin', email: 'admin@amrita.edu' },
      },
    ],
  },
  {
    targetId: 'USR006',
    targetModel: 'User',
    priority: 'medium',
    reportCount: 2,
    target: {
      type: 'user',
      title: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      status: 'suspended',
      campus: 'Delhi University',
      email: 'priya.sharma@gmail.com',
    },
    reports: [
      {
        reason: 'scam',
        notes: 'Requested UPI prepayment before showing condition of study chair.',
        createdAt: '2026-09-25T16:45:00.000Z',
        reporter: { name: 'Vivek Oberoi', email: 'vivek@du.ac.in' },
      },
      {
        reason: 'harassment',
        notes: 'Unresponsive after scheduling pickup at college gate.',
        createdAt: '2026-09-26T09:20:00.000Z',
        reporter: { name: 'Arjun Das', email: 'arjun@du.ac.in' },
      },
    ],
  },
  {
    targetId: 'PRD004',
    targetModel: 'Product',
    priority: 'low',
    reportCount: 1,
    target: {
      type: 'product',
      title: 'GATE CSE Books Set',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
      status: 'listed',
      campus: 'VIT Vellore',
      seller: {
        id: 'USR005',
        name: 'Sarthak Krishak',
        email: 'sarthakkrishak1234@gmail.com',
      },
    },
    reports: [
      {
        reason: 'inaccurate_price',
        notes: 'Listed price is lower than what seller quoted in chat.',
        createdAt: '2026-10-08T12:00:00.000Z',
        reporter: { name: 'Tanmay Bhatt', email: 'tanmay@vitstudent.ac.in' },
      },
    ],
  },
]

let runtimeQueue = [...SEED_QUEUE]

export const moderationApi = {
  getQueue: (params = {}) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/moderation/queue', { query: params })
        if (response && Array.isArray(response.data)) {
          return {
            success: response.success ?? true,
            message: response.message ?? 'Moderation queue loaded',
            data: response.data,
            pagination: response.pagination ?? {
              page: 1,
              limit: 20,
              total: response.data.length,
              totalPages: 1,
            },
          }
        }
      } catch {
        // Network error
      }

      return {
        success: true,
        message: 'No reports in queue',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
        },
      }
    }),

  dismissReports: ({ targetId, targetModel }) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/moderation/dismiss', {
          method: 'POST',
          body: { targetId, targetModel },
        })
        return createApiResponse(response.data, response.message)
      } catch (err) {
        return createApiResponse({ dismissedCount: 0 }, err?.message || 'Failed to dismiss reports', null, false)
      }
    }),

  resolveReports: ({ targetId, targetModel, adminNote = '' }) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/moderation/resolve', {
          method: 'POST',
          body: { targetId, targetModel, adminNote },
        })
        return createApiResponse(response.data, response.message)
      } catch (err) {
        return createApiResponse({ resolvedCount: 0 }, err?.message || 'Failed to resolve reports', null, false)
      }
    }),
}
