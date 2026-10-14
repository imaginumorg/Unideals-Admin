import { createApiResponse, fetcher, requestBackend } from '../../../shared/lib/apiClient'

const mapStatusToBackend = (status) => {
  if (!status) return ''
  const normalized = String(status).toLowerCase().trim()
  if (normalized.includes('all')) return ''
  if (['pending', 'draft', 'drafts'].includes(normalized)) return 'draft'
  if (['approved', 'listed', 'active'].includes(normalized)) return 'listed'
  if (normalized === 'blocked') return 'blocked'
  if (['rejected', 'unlisted'].includes(normalized)) return 'unlisted'
  if (normalized === 'sold') return 'sold'
  return ''
}

export const productsApi = {
  getProducts: ({ search = '', category = '', campus = '', status = '', page = 1, limit = 10 } = {}) =>
    fetcher(async () => {
      const query = { page, limit }
      if (search) query.search = search
      if (category && !category.includes('All')) query.category = category
      if (campus && !campus.includes('All')) query.campus = campus
      const backendStatus = mapStatusToBackend(status)
      if (backendStatus) query.status = backendStatus

      const response = await requestBackend('/admin/products', { query })
      return createApiResponse(response.data, response.message, response.pagination)
    }),

  getProductDetails: (productId) =>
    fetcher(async () => {
      if (!productId) throw new Error('Product ID is required')
      const response = await requestBackend(`/admin/products/${productId}`)
      return createApiResponse(response.data, response.message)
    }),

  updateProduct: (productId, updates) =>
    fetcher(async () => {
      const backendUpdates = { ...updates }
      if (updates.status) {
        const status = String(updates.status).toLowerCase().trim()
        if (status === 'approved') backendUpdates.status = 'listed'
        else if (status === 'rejected' || status === 'unlisted') backendUpdates.status = 'unlisted'
        else if (status === 'blocked') backendUpdates.status = 'blocked'
        else if (status === 'pending') backendUpdates.status = 'draft'
      }
      const response = await requestBackend(`/admin/products/${productId}/status`, {
        method: 'PATCH',
        body: backendUpdates,
      })
      return createApiResponse(response.data, response.message)
    }),

  hardDeleteProduct: (productId) =>
    fetcher(async () => {
      if (!productId) throw new Error('Product ID is required')
      const response = await requestBackend(`/admin/products/${productId}`, {
        method: 'DELETE',
      })
      return createApiResponse(response.data, response.message)
    }),
}
