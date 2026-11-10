import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

// Backend product statuses, used as-is: draft | listed | sold | unlisted | blocked
export const productsApi = {
  getProducts: ({ search = '', category = '', campus = '', status = '', flag = '', page = 1, limit = 12 } = {}) =>
    fetcher(async () => {
      const response = await requestBackend('/admin/products', {
        query: { search: search.trim(), category, campus, status, flag, page, limit },
      })
      return createApiResponse(
        { items: response.data || [], statusCounts: response.statusCounts || null },
        response.message,
        response.pagination,
      )
    }),

  getProductDetails: (productId) =>
    fetcher(async () => {
      if (!productId) throw new Error('Product ID is required')
      const response = await requestBackend(`/admin/products/${productId}`)
      return createApiResponse(response.data, response.message)
    }),

  updateProductStatus: (productId, status, reason = '') =>
    fetcher(async () => {
      const response = await requestBackend(`/admin/products/${productId}/status`, {
        method: 'PATCH',
        body: { status, ...(reason ? { reason } : {}) },
      })
      return createApiResponse(response.data, response.message)
    }),

  softDeleteProduct: (productId) =>
    fetcher(async () => {
      const response = await requestBackend(`/admin/products/${productId}/soft-delete`, { method: 'PATCH' })
      return createApiResponse(response.data, response.message)
    }),

  hardDeleteProduct: (productId, reason = '') =>
    fetcher(async () => {
      if (!productId) throw new Error('Product ID is required')
      const response = await requestBackend(`/admin/products/${productId}`, {
        method: 'DELETE',
        ...(reason ? { body: { reason } } : {}),
      })
      return createApiResponse(response.data, response.message)
    }),
}

// action: 'blocked' | 'unlisted' | 'listed' | 'delete'
export const bulkProducts = (ids, action, reason = '') =>
  fetcher(async () => {
    const response = await requestBackend('/admin/products/bulk', { method: 'POST', body: { ids, action, reason } })
    return createApiResponse(response.data, response.message)
  })

export const PRODUCT_CATEGORY_OPTIONS = [
  'electronics',
  'study_material',
  'hostel_essentials',
  'clothing',
  'accessories',
  'lab_equipment',
  'sports',
  'fitness',
  'vehicles',
  'event_passes',
  'others',
  'beauty_personal_care',
  'womens_fashion',
  'jewellery_hair_accessories',
  'footwear_handbags',
  'room_decor',
]
