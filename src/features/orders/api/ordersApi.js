import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

export const ordersApi = {
  getOrders: ({
    search = '',
    status = 'all',
    campus = 'all',
    payment = 'all',
    page = 1,
    limit = 10,
  } = {}) =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/orders', {
          query: {
            search: search.trim(),
            status: status === 'all' || status === 'Status (All)' ? '' : status,
            campus: campus === 'all' || campus === 'Campus (All)' ? '' : campus,
            payment: payment === 'all' || payment === 'Payment (All)' ? '' : payment,
            page,
            limit,
          },
        })
        if (response?.data) {
          return createApiResponse(response.data, response.message, response.pagination)
        }
      } catch (err) {
        // Network or server error
      }

      return createApiResponse([], 'No orders found', {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 1,
      })
    }),

  getOrderStats: () =>
    fetcher(async () => {
      try {
        const response = await requestBackend('/admin/orders/stats')
        if (response?.data) {
          return createApiResponse(response.data, response.message)
        }
      } catch (err) {
        // Network or server error
      }

      return createApiResponse(
        {
          totalOrders: 0,
          totalGrowth: 0,
          pendingOrders: 0,
          processingOrders: 0,
          scheduledOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
        },
        'Order stats unavailable'
      )
    }),

  getOrderDetails: (orderId) =>
    fetcher(async () => {
      if (!orderId) return createApiResponse(null, 'Order ID is required')
      try {
        const response = await requestBackend(`/admin/orders/${orderId}`)
        if (response?.data) {
          return createApiResponse(response.data, response.message)
        }
      } catch (err) {
        // Network or server error
      }
      return createApiResponse(null, 'Order not found')
    }),

  updateOrderStatus: (orderId, status, reason = '') =>
    fetcher(async () => {
      const response = await requestBackend(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status, reason },
      })
      return createApiResponse(response.data, response.message)
    }),
}
