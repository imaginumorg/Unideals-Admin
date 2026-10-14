import { memo, useCallback, useEffect, useState } from 'react'
import { productsApi } from '../api/productsApi'
import { useToast } from '../../../shared/components/ToastContext'
import ProductDetailsDrawer from '../components/ProductDetailsDrawer'
import Avatar from '../../../shared/components/Avatar'
import { useAuth } from '../../auth/context/AuthContext'

const categoryBadgeStyles = {
  Electronics: 'bg-[#E0F2FE] text-[#0284C7] dark:bg-[#0369A1]/30 dark:text-[#7DD3FC]',
  Furniture: 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-[#581C87]/30 dark:text-[#D8B4FE]',
  'Books & Study': 'bg-[#E0E7FF] text-[#4338CA] dark:bg-[#312E81]/30 dark:text-[#A5B4FC]',
  Fashion: 'bg-[#FCE7F3] text-[#BE185D] dark:bg-[#831843]/30 dark:text-[#F472B6]',
  Sports: 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/30 dark:text-[#86EFAC]',
  'Hostel Essentials': 'bg-[#CCFBF1] text-[#0F766E] dark:bg-[#115E59]/30 dark:text-[#5EEAD4]',
  Accessories: 'bg-[#E0F2FE] text-[#0369A1] dark:bg-[#0369A1]/30 dark:text-[#7DD3FC]',
}

const campusBadgeStyles = {
  'VIT Vellore': 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-[#581C87]/40 dark:text-[#D8B4FE]',
  'SRM Chennai': 'bg-[#E0E7FF] text-[#3730A3] dark:bg-[#312E81]/40 dark:text-[#A5B4FC]',
  Amrita: 'bg-[#FCE7F3] text-[#BE185D] dark:bg-[#831843]/40 dark:text-[#F472B6]',
  Manipal: 'bg-[#FFEDD5] text-[#C2410C] dark:bg-[#7C2D12]/40 dark:text-[#FB923C]',
  'Delhi University': 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]',
  'IIT Madras': 'bg-[#FEF9C3] text-[#A16207] dark:bg-[#713F12]/40 dark:text-[#FDE047]',
}

const statusBadgeStyles = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Blocked: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  Rejected: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  listed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  blocked: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  unlisted: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  sold: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const formatListedDate = (product) => {
  const d = product?.listedOn || product?.created || product?.createdAt
  if (!d) return '—'
  if (typeof d === 'string' && (d.includes('ago') || d.includes('Just now'))) return d
  try {
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return String(d)
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(parsed)
  } catch {
    return '—'
  }
}

const Products = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusTab, setSelectedStatusTab] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Category (All)')
  const [selectedCampus, setSelectedCampus] = useState('Campus (All)')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Status (All)')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [productsList, setProductsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const { showToast } = useToast()
  const { canWrite } = useAuth()

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    const effectiveCategory = selectedCategory === 'Category (All)' ? '' : selectedCategory
    const effectiveCampus = selectedCampus === 'Campus (All)' ? '' : selectedCampus
    let effectiveStatus = ''
    if (selectedStatusTab) {
      effectiveStatus = selectedStatusTab
    } else if (selectedStatusFilter !== 'Status (All)') {
      effectiveStatus = selectedStatusFilter
    }

    const res = await productsApi.getProducts({
      search: searchQuery,
      category: effectiveCategory,
      campus: effectiveCampus,
      status: effectiveStatus,
      page: currentPage,
      limit: 10,
    })
    if (res?.success && Array.isArray(res.data)) {
      setProductsList(res.data)
      setPagination({
        total: res.pagination?.total ?? res.data.length,
        totalPages: Math.max(1, res.pagination?.totalPages ?? 1),
      })
    } else {
      setProductsList([])
      setLoadError(res?.message || 'Unable to load products.')
    }
    if (res?.success) setLoadError('')
    setLoading(false)
  }, [searchQuery, selectedStatusTab, selectedCategory, selectedCampus, selectedStatusFilter, currentPage])

  useEffect(() => {
    Promise.resolve().then(loadData)
  }, [loadData])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatusTab('')
    setSelectedCategory('Category (All)')
    setSelectedCampus('Campus (All)')
    setSelectedStatusFilter('Status (All)')
    setCurrentPage(1)
  }

  const handleStatusChange = async (productId, nextStatus) => {
    if (!canWrite) return { success: false, message: 'Support users can inspect products but cannot update listings.' }
    const res = await productsApi.updateProduct(productId, { status: nextStatus })
    if (res.success) {
      showToast({ type: 'success', message: `Product marked as ${nextStatus}` })
      loadData()
    } else {
      showToast({ type: 'error', message: res.message })
    }
    return res
  }

  const totalCount = pagination.total
  const pendingCount = productsList.filter(
    (p) => String(p.status).toLowerCase() === 'pending' || String(p.status).toLowerCase() === 'draft'
  ).length
  const approvedCount = productsList.filter(
    (p) => String(p.status).toLowerCase() === 'approved' || String(p.status).toLowerCase() === 'listed'
  ).length
  const blockedCount = productsList.filter((p) => String(p.status).toLowerCase() === 'blocked').length
  const rejectedCount = productsList.filter(
    (p) => String(p.status).toLowerCase() === 'rejected' || String(p.status).toLowerCase() === 'unlisted'
  ).length

  const statusTabs = [
    { label: 'All Products', value: '', count: totalCount },
    { label: 'Draft', value: 'draft', count: pendingCount },
    { label: 'Listed', value: 'listed', count: approvedCount },
    { label: 'Unlisted', value: 'unlisted', count: rejectedCount },
    { label: 'Blocked', value: 'blocked', count: blockedCount },
  ]

  return (
    <div className="space-y-6 font-sans">
      {/* Header (Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#0B1220] dark:text-white tracking-tight">
            Products
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage all product listings, approve new products, and monitor marketplace content.
          </p>
        </div>
      </div>
      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </p>
      )}

      {/* 4 Stat Metric Cards (Image 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m7.5 4.27 9 5.15" />
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Matching products</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{totalCount}</p>
            <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Across all result pages</p>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Drafts on this page</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{pendingCount}</p>
            <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">Current page only</p>
          </div>
        </div>

        {/* Card 3: Approved */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Listed on this page</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{approvedCount}</p>
            <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Current page only</p>
          </div>
        </div>

        {/* Card 4: Blocked */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Blocked on this page</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{blockedCount}</p>
            <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">Current page only</p>
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#1E293B] pb-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold">
          {statusTabs.map((t) => {
            const isActive = selectedStatusTab === t.value
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setSelectedStatusTab(t.value)
                  setCurrentPage(1)
                }}
                className={`pb-2 transition relative flex items-center gap-1.5 ${
                  isActive ? 'text-[#2563EB] dark:text-blue-400 font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white'
                }`}
              >
                <span>{t.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] dark:bg-blue-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search products by name, seller, or category..."
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-[#F8FAFC] dark:bg-[#1A2234] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0B1220] dark:text-white placeholder-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white dark:focus:bg-[#1A2234]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none"
            >
              <option>Category (All)</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Books & Study</option>
              <option>Fashion</option>
              <option>Sports</option>
              <option>Hostel Essentials</option>
              <option>Accessories</option>
            </select>

            <select
              value={selectedCampus}
              onChange={(e) => {
                setSelectedCampus(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none"
            >
              <option>Campus (All)</option>
              <option>VIT Vellore</option>
              <option>SRM Chennai</option>
              <option>Amrita</option>
              <option>Manipal</option>
              <option>Delhi University</option>
              <option>IIT Madras</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none"
            >
              <option>Status (All)</option>
              <option value="draft">Draft</option>
              <option value="listed">Listed</option>
              <option value="blocked">Blocked</option>
              <option value="unlisted">Unlisted</option>
              <option value="sold">Sold</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#64748B] hover:text-[#0B1220] dark:hover:text-white transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Products Table (Image 3) */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#111827] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] dark:bg-[#161F32] border-b border-[#E2E8F0] dark:border-[#1E293B] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Seller</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Campus</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Listed On</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1E293B] text-[#334155] dark:text-[#CBD5E1]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    Loading products...
                  </td>
                </tr>
              ) : productsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                productsList.map((product) => {
                  const isViewing = selectedProductId === product.id
                  const catStyle = categoryBadgeStyles[product.category] || 'bg-slate-100 text-slate-700'
                  const campusStyle = campusBadgeStyles[product.campus] || 'bg-slate-100 text-slate-700'
                  const rawStatus = product.status || 'listed'
                  const statusStyle = statusBadgeStyles[rawStatus] || statusBadgeStyles[rawStatus.toLowerCase()] || 'bg-slate-100 text-slate-700'
                  const rawThumb = product.images?.[0]
                  const thumb = (typeof rawThumb === 'string' ? rawThumb : rawThumb?.url) || ''
                  const priceVal = Number(product.price ?? product.selling_price ?? 0)

                  return (
                    <tr
                      key={product.id || product._id}
                      onClick={() => setSelectedProductId(product.id || product._id)}
                      className={`cursor-pointer transition hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234] ${
                        isViewing ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.title}
                              className="h-10 w-10 rounded-xl object-cover ring-1 ring-[#E2E8F0] dark:ring-[#334155] shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 ring-1 ring-[#E2E8F0] dark:ring-[#334155]">
                              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[#0B1220] dark:text-white leading-tight">{product.title}</p>
                            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{product.subtitle || product.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Seller */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={product.seller?.avatar}
                            name={product.seller?.name || 'Seller'}
                            className="h-7 w-7 text-[10px]"
                            ringClassName="ring-1 ring-[#E2E8F0] dark:ring-[#334155]"
                          />
                          <div>
                            <p className="font-semibold text-[#0B1220] dark:text-white leading-none">{product.seller?.name || 'Seller'}</p>
                            <p className="text-[11px] text-[#EAB308] font-bold">★ {product.seller?.rating || '4.8'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${catStyle}`}>
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Campus Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold ${campusStyle}`}>
                          {typeof product.campus === 'string' ? product.campus : product.campus?.name || 'Campus'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-[#0B1220] dark:text-white">
                        ₹{priceVal.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusStyle}`}>
                          {product.status || 'Active'}
                        </span>
                      </td>

                      {/* Listed On */}
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8]">
                        {formatListedDate(product)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedProductId(product.id)}
                          className="p-1 rounded-lg hover:bg-[#EEF2F6] dark:hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white transition"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#E2E8F0] dark:border-[#1E293B] gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <p>
            Showing {pagination.total === 0 ? 0 : (currentPage - 1) * 10 + 1}-
            {Math.min(currentPage * 10, pagination.total)} of {pagination.total} products
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="h-8 w-8 rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] flex items-center justify-center hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234] disabled:opacity-40"
            >
              ‹
            </button>
            <span className="px-2 font-semibold">Page {currentPage} of {pagination.totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="h-8 w-8 rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] flex items-center justify-center hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Product Details Drawer on the right (Image 3 inspector) */}
      <ProductDetailsDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onStatusChange={handleStatusChange}
      />

    </div>
  )
}

export default memo(Products)
