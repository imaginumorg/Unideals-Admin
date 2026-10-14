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
      return createApiResponse(response.data, response.message, response.pagination)
    }),

  getOrderStats: () =>
    fetcher(async () => {
      const response = await requestBackend('/admin/orders/stats')
      return createApiResponse(response.data, response.message)
    }),

  getOrderDetails: (orderId) =>
    fetcher(async () => {
      if (!orderId) throw new Error('Order ID is required')
      const response = await requestBackend(`/admin/orders/${orderId}`)
      return createApiResponse(response.data, response.message)
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
