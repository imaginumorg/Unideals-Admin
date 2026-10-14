import { memo, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../../../shared/components/Loader'
import { useFetch } from '../../../shared/hooks/useFetch'
import { dashboardApi } from '../api/dashboardApi'
import { AUDIT_ACTION_LABELS } from '../../../shared/constants/constants'
import { useAuth } from '../../auth/context/AuthContext'

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return '—'
  const diff = Date.now() - new Date(dateValue).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/**
 * Dynamically compute current date range options without hardcoded dates
 */
const getDynamicDateRanges = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const startOfMonth = new Date(currentYear, now.getMonth(), 1)
  const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0)

  const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
  const yearFormatter = new Intl.DateTimeFormat('en', { year: 'numeric' })

  const currentMonthLabel = `${monthFormatter.format(startOfMonth)} - ${monthFormatter.format(endOfMonth)}, ${yearFormatter.format(now)}`

  return [
    { id: 'month', label: currentMonthLabel },
    { id: '30d', label: 'Last 30 Days' },
    { id: '7d', label: 'Last 7 Days' },
    { id: 'year', label: `Year to Date (${currentYear})` },
    { id: 'all', label: 'All Time' },
  ]
}

const actionToneMap = {
  'user.suspend': 'danger',
  'product.block': 'danger',
  'product.hard_delete': 'danger',
  'product.soft_delete': 'danger',
  'campus.pause': 'warning',
  'campus.create': 'success',
  'campus.activate': 'success',
  'user.activate': 'success',
  'product.activate': 'success',
  'report.dismiss': 'neutral',
}

const toneBg = {
  danger: 'bg-[#FEF2F2] dark:bg-[#450A0A]/40 text-[#DC2626] dark:text-[#F87171]',
  warning: 'bg-[#FFF7ED] dark:bg-[#7C2D12]/40 text-[#C2410C] dark:text-[#FB923C]',
  success: 'bg-[#ECFDF3] dark:bg-[#064E3B]/40 text-[#15803D] dark:text-[#34D399]',
  neutral: 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]',
  primary: 'bg-[#EEF2FF] dark:bg-[#1F293D] text-[#3838EC] dark:text-[#58A6FF]',
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { admin } = useAuth()
  const [dateMenuOpen, setDateMenuOpen] = useState(false)
  
  const dateRanges = useMemo(() => getDynamicDateRanges(), [])
  const [selectedDateRange, setSelectedDateRange] = useState(dateRanges[0])

  const loadDashboard = useCallback(
    () => dashboardApi.getDashboard(selectedDateRange.id),
    [selectedDateRange.id],
  )
  const { data: dashboardData, loading, error } = useFetch(loadDashboard)

  if (loading && !dashboardData) return <Loader rows={4} columns={3} />

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center py-20 text-[#64748B] dark:text-[#94A3B8]">
        <p>Failed to load dashboard. Please refresh.</p>
      </div>
    )
  }

  const { stats = {}, recentActivity = [] } = dashboardData

  // Greeting
  const firstName = admin?.name?.trim().split(' ')[0] || 'Admin'
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const usersCount = stats.totalUsers ?? 0
  const productsCount = stats.listedProducts ?? 0
  const ordersCount = stats.totalOrders ?? 0
  const revenueCount = stats.totalRevenue ?? 0

  // 4 Top Graphical Stat Cards (Pure real data, 0 fallback)
  const metricCards = [
    {
      id: 'users',
      label: 'Total Users',
      value: usersCount.toLocaleString(),
      change: stats.trends?.users || null,
      changeLabel: 'vs last month',
      iconBg: 'bg-[#EEF2FF] dark:bg-[#1F293D]',
      iconColor: 'text-[#3838EC] dark:text-[#58A6FF]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'products',
      label: 'Total Products',
      value: productsCount.toLocaleString(),
      change: stats.trends?.products || null,
      changeLabel: 'vs last month',
      iconBg: 'bg-[#ECFDF3] dark:bg-[#064E3B]/30',
      iconColor: 'text-[#16A34A] dark:text-[#34D399]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'Total Orders',
      value: ordersCount.toLocaleString(),
      change: stats.trends?.orders || null,
      changeLabel: 'vs last month',
      iconBg: 'bg-[#F3E8FF] dark:bg-[#581C87]/30',
      iconColor: 'text-[#9333EA] dark:text-[#C084FC]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
    },
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: `₹${revenueCount.toLocaleString('en-IN')}`,
      change: stats.trends?.revenue || null,
      changeLabel: 'vs last month',
      iconBg: 'bg-[#FFF7ED] dark:bg-[#7C2D12]/30',
      iconColor: 'text-[#EA580C] dark:text-[#FB923C]',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3h12" />
          <path d="M6 8h12" />
          <path d="m6 13 8.5 8" />
          <path d="M6 13h3a4 4 0 0 0 0-8" />
        </svg>
      ),
    },
  ]

  // Users by Campus (No dummy campuses, empty if none)
  const campusList = stats.usersByCampus || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-[-0.03em] text-[#0B1220] dark:text-white flex items-center gap-2">
            <span>{getGreeting()}, {firstName}!</span>
            <span className="inline-block text-[24px]">👋</span>
          </h1>
          <p className="mt-1 text-[14px] text-[#64748B] dark:text-[#94A3B8]">
            Here's what's happening with UniDeals today.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDateMenuOpen((prev) => !prev)}
            aria-label="Filter date range"
            className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] px-3.5 text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] shadow-sm transition hover:bg-[#F8FAFC] dark:hover:bg-[#2A2D2E]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#64748B] dark:text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{selectedDateRange.label}</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#64748B] dark:text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dateMenuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-[#E2E8F0] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-1.5 shadow-2xl backdrop-blur-md">
              {dateRanges.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => {
                    setSelectedDateRange(range)
                    setDateMenuOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                    selectedDateRange.id === range.id
                      ? 'bg-[#EEF2FF] text-[#1E40AF] dark:bg-[#1F293D] dark:text-[#58A6FF]'
                      : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#2A2D2E]'
                  }`}
                >
                  <span>{range.label}</span>
                  {selectedDateRange.id === range.id && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#3838EC] dark:text-[#58A6FF]" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Graphical Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.id}
            className="group relative flex items-center justify-between overflow-hidden rounded-[20px] border border-[#E3E8F2] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E] p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconColor} shadow-sm`}>
                {card.icon}
              </div>
              <p className="mt-3 text-[12px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                {card.label}
              </p>
              <p className="mt-1 text-[26px] sm:text-[30px] font-bold leading-none tracking-tight text-[#0B1220] dark:text-white">
                {card.value}
              </p>
              <div className="mt-2.5">
                {card.change ? (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                      card.change.startsWith('-')
                        ? 'text-[#DC2626] dark:text-[#F87171]'
                        : card.change === '0%'
                        ? 'text-[#64748B] dark:text-[#94A3B8]'
                        : 'text-[#16A34A] dark:text-[#34D399]'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      {card.change.startsWith('-') ? (
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      ) : (
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      )}
                    </svg>
                    <span>{card.change}</span>
                    <span className="font-normal text-[#94A3B8] dark:text-[#64748B]">
                      {card.changeLabel}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-normal text-[#94A3B8] dark:text-[#64748B]">
                    No prior period data
                  </span>
                )}
              </div>
            </div>

          </article>
        ))}
      </div>

      {/* Main Grid: Users by Campus + Moderation & Health Center */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Users by Campus - 6 cols */}
        <div className="lg:col-span-6">
          <section className="h-full rounded-[20px] border border-[#E3E8F2] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EEF1F5] dark:border-[#2D333B] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1F293D] text-[#3838EC] dark:text-[#58A6FF]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </span>
                <h2 className="text-[16px] font-bold text-[#0B1220] dark:text-white">Users by Campus</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/campuses')}
                className="text-[12px] font-semibold text-[#3838EC] dark:text-[#58A6FF] transition hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="mt-5">
              {campusList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F5F9] dark:bg-[#2A2D2E] text-[#94A3B8] dark:text-[#64748B]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#0B1220] dark:text-white">No data available</p>
                  <p className="mt-1 max-w-[260px] text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Campus distribution will appear once registered users select their campus.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campusList.map((campus) => {
                    const color = campus.color || '#3B82F6'
                    const pct = campus.percentage ?? 0

                    return (
                      <div key={campus.name} className="flex items-center gap-3 text-sm">
                        <span
                          title={campus.name}
                          className="w-32 sm:w-36 shrink-0 truncate font-medium text-[#0B1220] dark:text-[#E2E8F0]"
                        >
                          {campus.name}
                        </span>
                        <span className="w-10 shrink-0 text-right text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                          {pct}%
                        </span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F1F5F9] dark:bg-[#2A2D2E]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="w-14 shrink-0 text-right text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                          {(campus.count ?? 0).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Operational Health & Platform Controls - 6 cols */}
        <div className="lg:col-span-6">
          <section className="h-full rounded-[20px] border border-[#E3E8F2] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EEF1F5] dark:border-[#2D333B] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ECFDF3] dark:bg-[#064E3B]/30 text-[#16A34A] dark:text-[#34D399]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </span>
                <h2 className="text-[16px] font-bold text-[#0B1220] dark:text-white">Platform Health</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] dark:bg-[#064E3B]/40 px-2.5 py-0.5 text-[11px] font-semibold text-[#15803D] dark:text-[#34D399]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                Live
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#EEF1F5] dark:border-[#2D333B] bg-[#F8FAFC] dark:bg-[#161B22] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                  Active Campuses
                </p>
                <p className="mt-2 text-[24px] font-bold text-[#0B1220] dark:text-white">
                  {stats.activeCampuses ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Verified student zones
                </p>
              </div>

              <div className="rounded-2xl border border-[#EEF1F5] dark:border-[#2D333B] bg-[#F8FAFC] dark:bg-[#161B22] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                  Active Users
                </p>
                <p className="mt-2 text-[24px] font-bold text-[#16A34A] dark:text-[#34D399]">
                  {stats.activeUsers ?? stats.totalUsers ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Good standing accounts
                </p>
              </div>

              <div className="rounded-2xl border border-[#EEF1F5] dark:border-[#2D333B] bg-[#F8FAFC] dark:bg-[#161B22] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                  Pending Reports
                </p>
                <p className={`mt-2 text-[24px] font-bold ${stats.pendingReports > 0 ? 'text-[#DC2626] dark:text-[#F87171]' : 'text-[#0B1220] dark:text-white'}`}>
                  {stats.pendingReports ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {stats.pendingReports > 0 ? 'Needs resolution' : 'Clean queue'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#EEF1F5] dark:border-[#2D333B] bg-[#F8FAFC] dark:bg-[#161B22] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] dark:text-[#64748B]">
                  Suspended Accounts
                </p>
                <p className={`mt-2 text-[24px] font-bold ${stats.suspendedUsers > 0 ? 'text-[#EA580C] dark:text-[#FB923C]' : 'text-[#0B1220] dark:text-white'}`}>
                  {stats.suspendedUsers ?? 0}
                </p>
                <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Enforced bans
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => navigate('/moderation')}
          className={`group flex items-center gap-4 rounded-[20px] border p-4 text-left transition hover:shadow-md ${
            stats.pendingReports > 0
              ? 'border-[#FECACA] dark:border-[#991B1B]/40 bg-[#FFF7F7] dark:bg-[#450A0A]/20'
              : 'border-[#E2E8F0] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E]'
          }`}
        >
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stats.pendingReports > 0 ? 'bg-[#EF4444] text-white shadow-md shadow-red-500/20' : 'bg-[#F1F5F9] dark:bg-[#2A2D2E] text-[#64748B] dark:text-[#CBD5E1]'}`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" /><path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#0B1220] dark:text-white">Moderation Queue</p>
            <p className="mt-0.5 text-[13px] text-[#475569] dark:text-[#94A3B8]">
              {stats.pendingReports > 0 ? `${stats.pendingReports} pending reports` : 'No pending reports'}
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 shrink-0 text-[#94A3B8] transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => navigate('/campuses')}
          className="group flex items-center gap-4 rounded-[20px] border border-[#E2E8F0] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E] p-4 text-left transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#1F293D] text-[#3838EC] dark:text-[#58A6FF] shadow-sm">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#0B1220] dark:text-white">Campus Management</p>
            <p className="mt-0.5 text-[13px] text-[#475569] dark:text-[#94A3B8]">{stats.activeCampuses ?? 0} active campuses</p>
          </div>
          <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 shrink-0 text-[#94A3B8] transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => navigate('/audit-log')}
          className="group flex items-center gap-4 rounded-[20px] border border-[#E2E8F0] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E] p-4 text-left transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0FDF4] dark:bg-[#064E3B]/30 text-[#16A34A] dark:text-[#34D399] shadow-sm">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-[#0B1220] dark:text-white">Audit Log</p>
            <p className="mt-0.5 text-[13px] text-[#475569] dark:text-[#94A3B8]">Full admin action history</p>
          </div>
          <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 shrink-0 text-[#94A3B8] transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Recent Admin Activity Feed */}
      <section className="rounded-[20px] border border-[#E3E8F2] dark:border-[#2D333B] bg-white dark:bg-[#1E1E1E] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] dark:border-[#2D333B] px-6 py-5">
          <h2 className="text-[17px] font-bold text-[#0B1220] dark:text-white">Recent Admin Activity</h2>
          <button
            type="button"
            onClick={() => navigate('/audit-log')}
            className="text-[13px] font-semibold text-[#3838EC] dark:text-[#58A6FF] transition hover:underline"
          >
            View full log →
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="px-6 py-10 text-center text-[14px] text-[#94A3B8]">
            No activity yet. Actions taken by admins will appear here.
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#2D333B]">
            {recentActivity.map((entry) => {
              const tone = actionToneMap[entry.action] || 'primary'
              const bg = toneBg[tone]

              return (
                <div key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-[#FAFBFF] dark:hover:bg-[#252A33] transition-colors">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      {tone === 'danger' && <><circle cx="12" cy="12" r="9" /><path d="M8 8l8 8" /></>}
                      {tone === 'success' && <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>}
                      {tone === 'warning' && <><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></>}
                      {(tone === 'neutral' || tone === 'primary') && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>}
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-semibold text-[#0B1220] dark:text-[#E2E8F0]">
                        {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                      </p>
                      <span className="shrink-0 text-[12px] text-[#94A3B8] dark:text-[#64748B]">
                        {formatRelativeTime(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                      by <span className="font-semibold text-[#334155] dark:text-[#CBD5E1]">{entry.actor_name}</span>
                      <span className="ml-1 rounded-full bg-[#F1F5F9] dark:bg-[#2A2D2E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                        {entry.actor_role}
                      </span>
                      {entry.target_snapshot?.name && (
                        <> · {entry.target_snapshot.name}</>
                      )}
                      {entry.target_snapshot?.title && (
                        <> · {entry.target_snapshot.title}</>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default memo(Dashboard)
