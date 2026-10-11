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
  const [selectedStatusTab, setSelectedStatusTab] = useState('All Products')
  const [selectedCategory, setSelectedCategory] = useState('Category (All)')
  const [selectedCampus, setSelectedCampus] = useState('Campus (All)')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Status (All)')
  const [selectedProductIds, setSelectedProductIds] = useState(new Set())
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [productsList, setProductsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProductForm, setNewProductForm] = useState({
    title: '',
    subtitle: '',
    category: 'Electronics',
    campus: 'VIT Vellore',
    price: '',
    sellerName: '',
  })
  const { showToast } = useToast()
  const { canWrite } = useAuth()

  const loadData = useCallback(async () => {
    setLoading(true)
    const effectiveCategory = selectedCategory === 'Category (All)' ? '' : selectedCategory
    const effectiveCampus = selectedCampus === 'Campus (All)' ? '' : selectedCampus
    let effectiveStatus = ''
    if (selectedStatusTab !== 'All Products') {
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
    } else {
      setProductsList([])
    }
    setLoading(false)
  }, [searchQuery, selectedStatusTab, selectedCategory, selectedCampus, selectedStatusFilter, currentPage])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(new Set(productsList.map((p) => p.id)))
    } else {
      setSelectedProductIds(new Set())
    }
  }

  const handleToggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatusTab('All Products')
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
    }
    return res
  }

  const handleExport = () => {
    showToast({ type: 'success', message: 'Exporting catalog CSV (1,842 products)...' })
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProductForm.title || !newProductForm.price) return
    const res = await productsApi.createProduct(newProductForm)
    if (res.success) {
      showToast({ type: 'success', message: 'Product created and listed successfully' })
      setShowAddModal(false)
      setNewProductForm({ title: '', subtitle: '', category: 'Electronics', campus: 'VIT Vellore', price: '', sellerName: '' })
      loadData()
    }
  }

  const totalCount = productsList.length
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
    { label: 'All Products', count: totalCount },
    { label: 'Pending', count: pendingCount },
    { label: 'Approved', count: approvedCount },
    { label: 'Rejected', count: rejectedCount },
    { label: 'Blocked', count: blockedCount },
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#161F32] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0B1220] dark:text-white hover:bg-[#F8FAFC] transition shadow-2xs"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Products</span>
          </button>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              <span>Add Product</span>
            </button>
          ) : null}
        </div>
      </div>

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
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Products</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{totalCount}</p>
            <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Live listings</p>
          </div>
          <div className="h-10 w-24">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <path d="M0 35 Q 30 25, 50 15 T 80 12 T 100 5" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
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
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Pending Review</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{pendingCount}</p>
            <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">Needs review</p>
          </div>
          <div className="h-10 w-24">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <path d="M0 32 Q 30 30, 50 20 T 80 18 T 100 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
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
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Approved</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{approvedCount}</p>
            <p className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Active in store</p>
          </div>
          <div className="h-10 w-24">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <path d="M0 35 Q 25 32, 50 18 T 80 15 T 100 6" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
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
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Blocked</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-[#0B1220] dark:text-white">{blockedCount}</p>
            <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">Suspended items</p>
          </div>
          <div className="h-10 w-24">
            <svg viewBox="0 0 100 40" className="h-full w-full">
              <path d="M0 10 Q 30 15, 50 25 T 80 28 T 100 35" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status Tabs and Bulk Actions (Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#1E293B] pb-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold">
          {statusTabs.map((t) => {
            const isActive = selectedStatusTab === t.label
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setSelectedStatusTab(t.label)}
                className={`pb-2 transition relative flex items-center gap-1.5 ${
                  isActive ? 'text-[#2563EB] dark:text-blue-400 font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white'
                }`}
              >
                <span>{t.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400' : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'
                }`}>
                  {t.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] dark:bg-blue-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        <div>
          <button
            type="button"
            onClick={() => showToast({ type: 'info', message: 'Select items to apply bulk actions' })}
            className="rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#161F32] px-3 py-1.5 text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] transition shadow-2xs"
          >
            Bulk Actions ▾
          </button>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, seller, or category..."
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-[#F8FAFC] dark:bg-[#1A2234] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#0B1220] dark:text-white placeholder-[#94A3B8] outline-none transition focus:border-[#2563EB] focus:bg-white dark:focus:bg-[#1A2234]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              onChange={(e) => setSelectedCampus(e.target.value)}
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
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none"
            >
              <option>Status (All)</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Blocked</option>
              <option>Rejected</option>
            </select>

            <select className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] px-3 py-2 text-xs font-medium text-[#334155] dark:text-[#CBD5E1] outline-none hidden md:block">
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
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
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={productsList.length > 0 && selectedProductIds.size === productsList.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                </th>
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
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8]">
                    Loading products...
                  </td>
                </tr>
              ) : productsList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#94A3B8]">
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                productsList.map((product) => {
                  const isSelected = selectedProductIds.has(product.id)
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
                      {/* Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(product.id || product._id, e)}
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
                        />
                      </td>

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
            Showing 1-{productsList.length} of 1,842 products
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] flex items-center justify-center hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234] disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 1 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 2 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 3 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              3
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(4)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 4 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              4
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(5)}
              className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center ${
                currentPage === 5 ? 'bg-[#2563EB] text-white' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A2234]'
              }`}
            >
              5
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => p + 1)}
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#334155] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-[#2D3748]">
              <h3 className="text-base font-bold text-[#0B1220] dark:text-white">Add Product Listing</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newProductForm.title}
                  onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                  placeholder="e.g. MacBook Pro M1 16GB"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Specs / Subtitle</label>
                <input
                  type="text"
                  value={newProductForm.subtitle}
                  onChange={(e) => setNewProductForm({ ...newProductForm, subtitle: e.target.value })}
                  placeholder="e.g. 512GB SSD, Silver color"
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                  >
                    <option>Electronics</option>
                    <option>Furniture</option>
                    <option>Books & Study</option>
                    <option>Fashion</option>
                    <option>Sports</option>
                    <option>Hostel Essentials</option>
                    <option>Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    placeholder="2500"
                    className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Campus</label>
                <select
                  value={newProductForm.campus}
                  onChange={(e) => setNewProductForm({ ...newProductForm, campus: e.target.value })}
                  className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#111827] p-2.5 outline-none"
                >
                  <option>VIT Vellore</option>
                  <option>SRM Chennai</option>
                  <option>Amrita</option>
                  <option>Manipal</option>
                  <option>Delhi University</option>
                  <option>IIT Madras</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold shadow-xs"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(Products)
