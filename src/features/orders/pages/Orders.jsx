import { memo, useCallback, useEffect, useState } from 'react'
import { ordersApi } from '../api/ordersApi'
import { campusesApi } from '../../campuses/api/campusesApi'
import { useToast } from '../../../shared/components/ToastContext'
import Avatar from '../../../shared/components/Avatar'
import OrderDetailsDrawer from '../components/OrderDetailsDrawer'
import { useAuth } from '../../auth/context/AuthContext'
import { useFetch } from '../../../shared/hooks/useFetch'

const statusStyles = {
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  shipped: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  refunded: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
}

const paymentStyles = {
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  COD: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  Failed: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  Refunded: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
}

const campusBadgeStyles = {
  'VIT Vellore': 'bg-[#F3E8FF] text-[#7E22CE] dark:bg-[#581C87]/40 dark:text-[#D8B4FE]',
  'SRM Chennai': 'bg-[#E0E7FF] text-[#3730A3] dark:bg-[#312E81]/40 dark:text-[#A5B4FC]',
  Amrita: 'bg-[#FCE7F3] text-[#BE185D] dark:bg-[#831843]/40 dark:text-[#F472B6]',
  Manipal: 'bg-[#FFEDD5] text-[#C2410C] dark:bg-[#7C2D12]/40 dark:text-[#FB923C]',
  'Delhi University': 'bg-[#DCFCE7] text-[#15803D] dark:bg-[#14532D]/40 dark:text-[#86EFAC]',
  'IIT Madras': 'bg-[#FEF9C3] text-[#A16207] dark:bg-[#713F12]/40 dark:text-[#FDE047]',
}

const formatPrice = (p) =>
  p != null ? `₹${Number(p).toLocaleString('en-IN')}` : '₹0'

const formatDate = (d) => {
  if (!d) return '—'
  try {
    const parsed = new Date(d)
    if (isNaN(parsed.getTime())) return String(d)
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  } catch {
    return '—'
  }
}

/**
 * Sparkline curve for order stat cards
 */
const Sparkline = ({ color = '#3B82F6', id = 'spark', isZero = false }) => {
  if (isZero) {
    return (
      <div className="h-9 w-20 shrink-0 select-none opacity-60">
        <svg viewBox="0 0 80 36" className="h-full w-full">
          <line x1="0" y1="30" x2="80" y2="30" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      </div>
    )
  }

  return (
    <div className="h-9 w-20 shrink-0 select-none">
      <svg viewBox="0 0 80 36" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 28 Q 15 32, 28 20 T 50 16 T 65 10 T 80 4 L 80 36 L 0 36 Z"
          fill={`url(#spark-grad-${id})`}
        />
        <path
          d="M 0 28 Q 15 32, 28 20 T 50 16 T 65 10 T 80 4"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

const Orders = () => {
  const [selectedStatusTab, setSelectedStatusTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampus, setSelectedCampus] = useState('Campus (All)')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Status (All)')
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('Payment (All)')
  const [campuses, setCampuses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [drawerOrderId, setDrawerOrderId] = useState(null)
  const { showToast } = useToast()
  const { canWrite } = useAuth()

  // Load campus list for filter dropdown
  useEffect(() => {
    campusesApi.getCampuses().then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setCampuses(res.data)
      }
    })
  }, [])

  const effectiveStatus =
    selectedStatusTab !== 'all'
      ? selectedStatusTab
      : selectedStatusFilter !== 'Status (All)'
        ? selectedStatusFilter.toLowerCase()
        : 'all'

  const loadOrders = useCallback(() => {
    return ordersApi.getOrders({
      search: searchQuery,
      status: effectiveStatus,
      campus: selectedCampus === 'Campus (All)' ? 'all' : selectedCampus,
      payment: selectedPaymentFilter === 'Payment (All)' ? 'all' : selectedPaymentFilter.toLowerCase(),
      page: currentPage,
      limit: 10,
    })
  }, [
    searchQuery,
    effectiveStatus,
    selectedCampus,
    selectedPaymentFilter,
    currentPage,
  ])
  const {
    data: orders = [],
    pagination: orderPagination,
    loading,
    error: ordersError,
    refetch: refreshOrders,
  } = useFetch(loadOrders)

  const loadStats = useCallback(() => ordersApi.getOrderStats(), [])
  const {
    data: statsData,
    error: statsError,
    refetch: refreshStats,
  } = useFetch(loadStats)
  const stats = statsData || {
    totalOrders: 0,
    totalGrowth: 0,
    pendingOrders: 0,
    processingOrders: 0,
    scheduledOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  }
  const pagination = {
    total: orderPagination?.total ?? 0,
    totalPages: Math.max(1, orderPagination?.totalPages ?? 1),
  }
  const pageWindowStart = Math.max(1, Math.min(currentPage - 2, pagination.totalPages - 4))
  const visiblePages = Array.from(
    { length: Math.min(pagination.totalPages, 5) },
    (_, index) => pageWindowStart + index,
  )

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatusTab('all')
    setSelectedCampus('Campus (All)')
    setSelectedStatusFilter('Status (All)')
    setSelectedPaymentFilter('Payment (All)')
    setCurrentPage(1)
  }

  const handleStatusChangeFromDrawer = async (orderId, newStatus) => {
    if (!canWrite) return { success: false, message: 'Support users can inspect orders but cannot update order stages.' }
    try {
      const res = await ordersApi.updateOrderStatus(orderId, newStatus)
      if (res?.success) {
        refreshOrders()
        refreshStats()
      }
      return res
    } catch (err) {
      return { success: false, message: err?.message || 'Update failed' }
    }
  }

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast({ type: 'warning', message: 'No orders available to export' })
      return
    }

    const headers = ['Order ID', 'Buyer Name', 'Buyer Email', 'Product', 'Campus', 'Amount', 'Payment Status', 'Order Status', 'Date']
    const rows = orders.map((o) => [
      `"${o.orderId}"`,
      `"${o.buyer?.name || ''}"`,
      `"${o.buyer?.email || ''}"`,
      `"${o.product?.title || ''}"`,
      `"${o.campus || ''}"`,
      `"${o.amount || 0}"`,
      `"${o.payment?.status || ''}"`,
      `"${o.status || ''}"`,
      `"${formatDate(o.orderDate)}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast({ type: 'success', message: 'Orders exported to CSV successfully' })
  }

  // Status tabs config
  const statusTabs = [
    { id: 'all', label: `All Orders (${stats.totalOrders})` },
    { id: 'pending', label: `Pending (${stats.pendingOrders})` },
    { id: 'processing', label: `Processing (${stats.processingOrders})` },
    { id: 'scheduled', label: `Shipped (${stats.scheduledOrders})` },
    { id: 'delivered', label: `Delivered (${stats.deliveredOrders})` },
    { id: 'cancelled', label: `Cancelled (${stats.cancelledOrders})` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white">
            Orders
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Manage customer orders, track deliveries, and handle refunds or disputes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1E293B] px-4 py-2.5 text-xs font-semibold text-[#0B1220] dark:text-white shadow-xs hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#64748B] dark:text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Orders
          </button>
        </div>
      </div>
      {(ordersError || statsError) && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {ordersError || statsError}
        </p>
      )}

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <Sparkline color="#2563EB" id="total" isZero={stats.totalOrders === 0} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Total Orders</div>
            <div className="text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white mt-0.5">
              {stats.totalOrders.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span>↑ {stats.totalGrowth > 0 ? `+${stats.totalGrowth}%` : '0%'}</span>
              <span className="text-[#94A3B8] font-normal">vs last month</span>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <Sparkline color="#D97706" id="pending" isZero={stats.pendingOrders === 0} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Pending</div>
            <div className="text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white mt-0.5">
              {stats.pendingOrders.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <span>{stats.pendingOrders > 0 ? 'Requires Action' : 'All clear'}</span>
            </div>
          </div>
        </div>

        {/* Shipped / Scheduled */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
            </div>
            <Sparkline color="#10B981" id="shipped" isZero={stats.scheduledOrders === 0} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Shipped / Scheduled</div>
            <div className="text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white mt-0.5">
              {stats.scheduledOrders.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span>In-transit / Meetup spot</span>
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <Sparkline color="#8B5CF6" id="delivered" isZero={stats.deliveredOrders === 0} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Delivered</div>
            <div className="text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white mt-0.5">
              {stats.deliveredOrders.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              <span>Completed trades</span>
            </div>
          </div>
        </div>

        {/* Cancelled */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
            <Sparkline color="#EF4444" id="cancelled" isZero={stats.cancelledOrders === 0} />
          </div>
          <div className="mt-3">
            <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">Cancelled</div>
            <div className="text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white mt-0.5">
              {stats.cancelledOrders.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              <span>Disputed / Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#1A2234] shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-[#E2E8F0] dark:border-[#2D3748] px-6 pt-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatusTab(tab.id)
                setCurrentPage(1)
              }}
              className={`whitespace-nowrap pb-3 pt-2 text-xs font-semibold transition border-b-2 mr-6 ${
                selectedStatusTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B1220] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] dark:border-[#2D3748]">
          <div className="relative flex-1 max-w-sm">
            <svg
              viewBox="0 0 24 24"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by order ID, user, product..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-slate-50/50 dark:bg-[#111827] pl-10 pr-4 py-2 text-xs text-[#0B1220] dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-[#111827] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Campus dropdown */}
            <select
              value={selectedCampus}
              onChange={(e) => {
                setSelectedCampus(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#111827] px-3 py-2 text-xs text-[#0B1220] dark:text-white outline-none focus:border-primary"
            >
              <option value="Campus (All)">Campus (All)</option>
              {campuses.map((c) => (
                <option key={c._id || c.short_name} value={c.short_name || c.name}>
                  {c.short_name || c.name}
                </option>
              ))}
            </select>

            {/* Status dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#111827] px-3 py-2 text-xs text-[#0B1220] dark:text-white outline-none focus:border-primary"
            >
              <option value="Status (All)">Status (All)</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Payment dropdown */}
            <select
              value={selectedPaymentFilter}
              onChange={(e) => {
                setSelectedPaymentFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] bg-white dark:bg-[#111827] px-3 py-2 text-xs text-[#0B1220] dark:text-white outline-none focus:border-primary"
            >
              <option value="Payment (All)">Payment (All)</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3748] px-3 py-2 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#1E293B] transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#2D3748] bg-[#F8FAFC]/70 dark:bg-[#1E293B]/40 text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                <th className="py-3.5 px-3">Order ID</th>
                <th className="py-3.5 px-3">User</th>
                <th className="py-3.5 px-3">Products</th>
                <th className="py-3.5 px-3">Campus</th>
                <th className="py-3.5 px-3">Amount</th>
                <th className="py-3.5 px-3">Payment</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Order Date</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2D3748] text-xs">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-xs text-[#64748B] dark:text-[#94A3B8]">Loading orders...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#64748B]">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                      </svg>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-[#0B1220] dark:text-white">No orders found</h3>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
                      No order records match your current filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const buyerAvatar = order.buyer?.avatar
                  const buyerName = order.buyer?.name || 'Student'
                  const buyerId = order.buyer?.id ? `#${order.buyer.id.slice(-6)}` : '#USR001'
                  const campusBadge =
                    campusBadgeStyles[order.campus] ||
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  const prodImg =
                    order.product?.images?.[0] ||
                    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&auto=format&fit=crop&q=80'

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F8FAFC]/80 dark:hover:bg-[#1E293B]/40 transition"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-3 font-semibold text-[#0B1220] dark:text-white">
                        <button
                          type="button"
                          onClick={() => setDrawerOrderId(order.id)}
                          className="text-primary hover:underline font-bold"
                        >
                          {order.orderId}
                        </button>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={buyerAvatar}
                            name={buyerName}
                            className="h-8 w-8 rounded-full shrink-0 text-[11px] font-bold"
                          />
                          <div>
                            <div className="font-semibold text-[#0B1220] dark:text-white">
                              {buyerName}
                            </div>
                            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {buyerId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={prodImg}
                            alt={order.product?.title}
                            className="h-8 w-8 rounded-lg object-cover border border-[#E2E8F0] dark:border-[#2D3748] bg-white shrink-0"
                          />
                          <span className="font-medium text-[#0B1220] dark:text-white truncate max-w-[140px]">
                            {order.product?.title || 'Campus Item'}
                          </span>
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${campusBadge}`}
                        >
                          {order.campus || 'VIT Vellore'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 font-semibold text-[#0B1220] dark:text-white">
                        {formatPrice(order.amount)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            paymentStyles[order.payment?.status] || paymentStyles.Paid
                          }`}
                        >
                          {order.payment?.status || 'Paid'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            statusStyles[order.status] || statusStyles.pending
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-3 text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                        {formatDate(order.orderDate)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <button
                          type="button"
                          onClick={() => setDrawerOrderId(order.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition"
                          title="View Order Details"
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

        {/* Pagination */}
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between border-t border-[#E2E8F0] dark:border-[#2D3748] text-xs text-[#64748B] dark:text-[#94A3B8]">
          <div>
            Showing{' '}
            <span className="font-semibold text-[#0B1220] dark:text-white">
              {orders.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-[#0B1220] dark:text-white">
              {Math.min(currentPage * 10, pagination.total || orders.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-[#0B1220] dark:text-white">
              {pagination.total || orders.length}
            </span>{' '}
            orders
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#1E293B] disabled:opacity-40 transition"
            >
              ‹
            </button>
            {visiblePages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg font-semibold transition ${
                  currentPage === p
                    ? 'bg-primary text-white'
                    : 'border border-[#E2E8F0] dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#1E293B]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= (pagination.totalPages || 1)}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] dark:border-[#2D3748] hover:bg-slate-50 dark:hover:bg-[#1E293B] disabled:opacity-40 transition"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Flyout Drawer for Order Details */}
      <OrderDetailsDrawer
        orderId={drawerOrderId}
        onClose={() => setDrawerOrderId(null)}
        onStatusChange={handleStatusChangeFromDrawer}
      />
    </div>
  )
}

export default memo(Orders)
