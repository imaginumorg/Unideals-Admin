import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Ban,
  Cpu,
  EyeOff,
  FileText,
  Handshake,
  IndianRupee,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  UserCog,
  Users,
} from 'lucide-react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { dashboardApi } from '../api/dashboardApi'
import ActivityRow from '../../../shared/components/ActivityRow'
import { useAuth } from '../../auth/context/AuthContext'
import { Card, CardHeader, EmptyState, ErrorState, Skeleton, StatCard, Tabs, Toggle, cx, toneClass } from '../../../shared/components/ui'
import { formatCurrency, formatNumber, titleCase } from '../../../shared/lib/format'
import { useAnalyticsRange } from '../../../shared/context/AnalyticsRangeContext'
import { analyticsApi } from '../../../shared/lib/analyticsApi'
import { percentChange } from '../../../shared/lib/dateRange'
import { exportRowsCsv, exportTrendCsv, hasAny, intervalTabs, trendRows, useAnalytics, useInterval } from '../../../shared/charts/analytics'
import { ChartCard, compact, statusColor } from '../../../shared/charts/primitives'
import DateRangeFilter from '../../../shared/charts/DateRangeFilter'
import TrendChart from '../../../shared/charts/TrendChart'
import Donut from '../../../shared/charts/Donut'
import BarList from '../../../shared/charts/BarList'
import Sparkline from '../../../shared/charts/Sparkline'

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const KPI_METRICS = ['users', 'listings', 'deals', 'gmv', 'revenue']

// Money chart: one measure at a time (never two scales on one axis).
const MONEY_TABS = {
  gmv: { label: 'Deal volume', series: 'Deal volume (GMV)', format: formatCurrency, axis: (v) => `₹${compact(v)}` },
  revenue: { label: 'Revenue', series: 'Platform revenue', format: formatCurrency, axis: (v) => `₹${compact(v)}` },
  deals: { label: 'Deals', series: 'Completed deals', format: formatNumber, axis: compact },
}

const GROWTH_SERIES = [
  { key: 'users', label: 'New users', color: 'var(--c-cat-1)' },
  { key: 'listings', label: 'Listings posted', color: 'var(--c-cat-2)' },
]

const LISTING_STATUSES = ['listed', 'draft', 'unlisted', 'blocked', 'sold']

const CAMPUS_METRICS = {
  users: { label: 'Users', path: '/users' },
  newUsers: { label: 'New users', path: '/users' },
  liveListings: { label: 'Live listings', path: '/products', status: 'listed' },
  newListings: { label: 'New listings', path: '/products' },
}

const IntervalTabs = ({ options, value, onChange }) =>
  options.length > 1 ? <Tabs value={value} onChange={onChange} tabs={intervalTabs(options)} /> : null

const CompareToggle = ({ checked, onChange }) => (
  <label className="hidden items-center gap-2 text-xs text-muted sm:flex">
    Compare <Toggle checked={checked} onChange={onChange} label="Compare with the previous period" />
  </label>
)

const Dashboard = () => {
  const { admin } = useAuth()
  const navigate = useNavigate()
  const { range } = useAnalyticsRange()
  const { data, loading, error, refetch } = useFetch(dashboardApi.getDashboard)
  const stats = data?.stats || {}
  const recent = data?.recentActivity || []
  const firstName = admin?.name?.trim().split(' ')[0] || 'there'
  const isLoading = loading && !data

  const win = { from: range.from, to: range.to, compareFrom: range.compareFrom, compareTo: range.compareTo }

  // KPI cards + sparklines.
  const kpi = useAnalytics(analyticsApi.trends, { ...win, metrics: KPI_METRICS.join(',') })
  const kpiData = kpi.data

  // Money trend.
  const [moneyTab, setMoneyTab] = useState('gmv')
  const [moneyInterval, setMoneyInterval, moneyIntervals] = useInterval(range.days)
  const [moneyCompare, setMoneyCompare] = useState(true)
  const money = useAnalytics(analyticsApi.trends, { ...win, metrics: 'gmv,revenue,deals', interval: moneyInterval })

  // Growth trend.
  const [growthInterval, setGrowthInterval, growthIntervals] = useInterval(range.days)
  const [growthCompare, setGrowthCompare] = useState(false)
  const growth = useAnalytics(analyticsApi.trends, { ...win, metrics: 'users,listings', interval: growthInterval })

  // Distributions.
  const breakdown = useAnalytics(analyticsApi.breakdown, { from: range.from, to: range.to, dims: 'listingStatus,campusComparison' })
  const listingStatus = breakdown.data?.data?.listingStatus || []
  const campuses = breakdown.data?.data?.campusComparison || []
  const [campusMetric, setCampusMetric] = useState('users')

  const refreshAll = () => {
    refetch()
    kpi.refetch()
    money.refetch()
    growth.refetch()
    breakdown.refetch()
  }

  if (error && !data) {
    return (
      <Card>
        <ErrorState message={error} onRetry={refetch} />
      </Card>
    )
  }

  const kpiLoading = kpi.loading && !kpiData
  const kpiRows = trendRows(kpiData, [])
  const spark = (metric, format) =>
    kpiData ? <Sparkline format={format} points={kpiRows.map((row, i) => ({ label: row.title, value: kpiData.series[metric][i] }))} /> : null
  const kpiTrend = (metric) => (kpiData ? percentChange(kpiData.totals[metric], kpiData.previousTotals[metric]) : null)
  const kpiValue = (metric) => kpiData?.totals?.[metric]

  const moneyMeta = MONEY_TABS[moneyTab]
  const moneySeries = [{ key: moneyTab, label: moneyMeta.series, color: 'var(--c-chart-1)', total: money.data ? moneyMeta.format(money.data.totals[moneyTab] ?? 0) : undefined }]
  const growthSeries = GROWTH_SERIES.map((s) => ({ ...s, total: growth.data ? formatNumber(growth.data.totals[s.key]) : undefined }))

  const listingCounts = Object.fromEntries(listingStatus.map((row) => [row.key, row.count]))
  const listingDonut = LISTING_STATUSES.map((key) => ({ key, label: titleCase(key), value: listingCounts[key] || 0, color: statusColor(key) }))

  const healthDonut = [
    { key: 'active', label: 'Active', value: stats.activeUsers || 0, color: statusColor('active') },
    { key: 'inactive', label: 'Inactive', value: stats.inactiveUsers || 0, color: statusColor('inactive') },
    { key: 'suspended', label: 'Suspended', value: stats.suspendedUsers || 0, color: statusColor('suspended') },
  ]

  const campusItems = campuses.map((c) => ({ key: c.key, label: c.name, value: c[campusMetric] || 0 }))
  const openCampus = (campusId) => {
    if (!campusId) return
    const meta = CAMPUS_METRICS[campusMetric]
    navigate(`${meta.path}?campus=${campusId}${meta.status ? `&status=${meta.status}` : ''}`)
  }

  const queue = [
    { label: 'Pending reports', count: stats.pendingReports, to: '/moderation', icon: ShieldAlert, tone: 'danger', hint: 'Listings and users flagged by students' },
    { label: 'Gender change requests', count: stats.pendingGenderRequests, to: '/gender-requests', icon: UserCog, tone: 'pink', hint: 'Girls Corner access needs approval' },
    { label: 'Auto-hidden listings', count: stats.autoHiddenListings, to: '/products?status=review', icon: EyeOff, tone: 'warning', hint: 'Hidden by 5+ reports, awaiting review' },
    { label: 'Failing background jobs', count: stats.failingJobs, to: '/system/jobs', icon: Cpu, tone: 'danger', hint: 'Latest scheduled run failed' },
    { label: 'Suspended accounts', count: stats.suspendedUsers, to: '/users?status=suspended', icon: Ban, tone: 'warning', hint: 'Review for reinstatement' },
    { label: 'Blocked listings', count: stats.blockedProducts, to: '/products?status=blocked', icon: Package, tone: 'neutral', hint: 'Hidden from the marketplace' },
  ]

  const compareHint = `vs ${range.compareLabel}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-xl leading-7 font-semibold tracking-[-0.02em] text-fg md:text-[22px]">
            {greeting()}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter align="responsive" />
          <button type="button" onClick={refreshAll} className="btn btn-secondary h-9 w-9 shrink-0 px-0" aria-label="Refresh dashboard" title="Refresh">
            <RefreshCw className={cx('h-4 w-4', (loading || kpi.refreshing) && 'animate-spin')} />
          </button>
        </div>
      </div>

      {kpi.error && !kpiData && (
        <Card><ErrorState message={kpi.error} onRetry={kpi.refetch} className="py-8" /></Card>
      )}

      {/* Values cover the selected range; trends compare with the previous period. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatCard
          label="New users"
          icon={Users}
          to="/users"
          value={formatNumber(kpiValue('users'))}
          trend={kpiTrend('users')}
          hint={isLoading ? compareHint : `${formatNumber(stats.totalUsers)} total`}
          spark={spark('users', formatNumber)}
          loading={kpiLoading}
        />
        <StatCard
          label="Listings posted"
          icon={Package}
          tone="success"
          to="/products"
          value={formatNumber(kpiValue('listings'))}
          trend={kpiTrend('listings')}
          hint={isLoading ? compareHint : `${formatNumber(stats.listedProducts)} live now`}
          spark={spark('listings', formatNumber)}
          loading={kpiLoading}
        />
        <StatCard
          label="Completed deals"
          icon={ShoppingBag}
          tone="violet"
          to="/orders?status=delivered"
          value={formatNumber(kpiValue('deals'))}
          trend={kpiTrend('deals')}
          hint={isLoading ? compareHint : `${formatNumber(stats.completedDeals)} all time`}
          spark={spark('deals', formatNumber)}
          loading={kpiLoading}
        />
        <StatCard
          label="Deal volume (GMV)"
          icon={Handshake}
          tone="info"
          to="/orders?status=delivered"
          value={formatCurrency(kpiValue('gmv'))}
          trend={kpiTrend('gmv')}
          hint={isLoading ? compareHint : `${formatCurrency(stats.dealVolume)} all time`}
          spark={spark('gmv', formatCurrency)}
          loading={kpiLoading}
        />
        <StatCard
          label="Platform revenue"
          icon={IndianRupee}
          tone="warning"
          value={formatCurrency(kpiValue('revenue'))}
          trend={kpiTrend('revenue')}
          hint={isLoading ? compareHint : `${formatCurrency(stats.platformRevenue)} all time · plans & boosts`}
          spark={spark('revenue', formatCurrency)}
          loading={kpiLoading}
        />
      </div>
      <p className="-mt-3 text-xs text-subtle">
        {range.span} · trends {compareHint}
      </p>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-3"
          title="Money"
          description={`${moneyMeta.series} · ${range.label.toLowerCase()}`}
          loading={money.loading && !money.data}
          refreshing={money.refreshing}
          error={!money.data ? money.error : ''}
          onRetry={money.refetch}
          empty={money.data && !hasAny(money.data, [moneyTab])}
          emptyMessage="No completed deals or payments in this range."
          onExport={() => exportTrendCsv(`${moneyTab}-${range.from}-to-${range.to}.csv`, money.data, [{ key: moneyTab, label: moneyMeta.series }])}
          actions={
            <>
              <CompareToggle checked={moneyCompare} onChange={setMoneyCompare} />
              <IntervalTabs options={moneyIntervals} value={moneyInterval} onChange={setMoneyInterval} />
            </>
          }
          height={268}
        >
          <Tabs className="mb-4" value={moneyTab} onChange={setMoneyTab} tabs={Object.entries(MONEY_TABS).map(([value, meta]) => ({ value, label: meta.label }))} />
          <TrendChart
            rows={trendRows(money.data, [moneyTab])}
            series={moneySeries}
            format={moneyMeta.format}
            axisFormat={moneyMeta.axis}
            showPrevious={moneyCompare}
          />
        </ChartCard>

        <Card className="xl:col-span-2">
          <CardHeader title="Needs attention" description="Work queues waiting on staff" icon={ShieldAlert} />
          <div className="grid gap-px overflow-hidden rounded-b-[11px] bg-line sm:grid-cols-2 xl:grid-cols-1">
            {queue.map(({ label, count, to, icon: Icon, tone, hint }) => (
              <Link key={label} to={to} className="group flex items-center gap-3.5 bg-surface px-5 py-3.5 transition-colors duration-150 hover:bg-surface-2/60">
                <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneClass(count ? tone : 'neutral'))}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
                      <Skeleton className="h-5 w-8" />
                    ) : (
                      <span className={cx('text-lg leading-6 font-semibold tabular-nums', count ? 'text-fg' : 'text-subtle')}>{formatNumber(count)}</span>
                    )}
                    <span className="truncate text-[13px] font-medium text-fg-2">{label}</span>
                  </div>
                  <p className="truncate text-xs text-subtle">{hint}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-subtle opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-fg group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-3"
          title="Growth"
          description="Sign-ups and new listings"
          loading={growth.loading && !growth.data}
          refreshing={growth.refreshing}
          error={!growth.data ? growth.error : ''}
          onRetry={growth.refetch}
          empty={growth.data && !hasAny(growth.data, ['users', 'listings'])}
          emptyMessage="No sign-ups or listings in this range."
          onExport={() => exportTrendCsv(`growth-${range.from}-to-${range.to}.csv`, growth.data, GROWTH_SERIES)}
          actions={
            <>
              <CompareToggle checked={growthCompare} onChange={setGrowthCompare} />
              <IntervalTabs options={growthIntervals} value={growthInterval} onChange={setGrowthInterval} />
            </>
          }
        >
          <TrendChart type="line" rows={trendRows(growth.data, ['users', 'listings'])} series={growthSeries} format={formatNumber} showPrevious={growthCompare} />
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          title="Listing status"
          description="All listings right now · click to open"
          loading={breakdown.loading && !breakdown.data}
          refreshing={breakdown.refreshing}
          error={!breakdown.data ? breakdown.error : ''}
          onRetry={breakdown.refetch}
          empty={breakdown.data && listingDonut.every((d) => !d.value)}
          emptyMessage="Listings appear once students post items."
          onExport={() => exportRowsCsv('listing-status.csv', ['Status', 'Listings'], listingDonut.map((d) => [d.label, d.value]))}
          height={168}
        >
          <Donut data={listingDonut} centerLabel="Listings" onSelect={(key) => key && navigate(`/products?status=${key}`)} selectHint="Click to open these listings" />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-3"
          title="Campus comparison"
          description={campusMetric.startsWith('new') ? `${CAMPUS_METRICS[campusMetric].label} · ${range.label.toLowerCase()}` : `${CAMPUS_METRICS[campusMetric].label} · right now`}
          loading={breakdown.loading && !breakdown.data}
          refreshing={breakdown.refreshing}
          error={!breakdown.data ? breakdown.error : ''}
          onRetry={breakdown.refetch}
          empty={breakdown.data && campuses.length === 0}
          emptyTitle="No active campuses"
          emptyMessage="Add or un-pause a campus to compare them."
          onExport={() =>
            exportRowsCsv(
              `campuses-${range.from}-to-${range.to}.csv`,
              ['Campus', 'Users', `New users (${range.from} to ${range.to})`, 'Live listings', `New listings (${range.from} to ${range.to})`],
              campuses.map((c) => [c.name, c.users, c.newUsers, c.liveListings, c.newListings]),
            )
          }
          actions={
            <Link to="/campuses" className="hidden text-xs font-semibold text-brand-fg hover:underline sm:inline">
              Manage
            </Link>
          }
        >
          <Tabs
            className="mb-4"
            value={campusMetric}
            onChange={setCampusMetric}
            tabs={Object.entries(CAMPUS_METRICS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
          <BarList items={campusItems} onSelect={openCampus} selectHint={`Open ${CAMPUS_METRICS[campusMetric].path === '/users' ? 'users' : 'listings'} for this campus`} valueLabel={CAMPUS_METRICS[campusMetric].label} />
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          title="Account health"
          description="Students by status · click to open"
          loading={isLoading}
          empty={data && healthDonut.every((d) => !d.value)}
          emptyMessage="Accounts appear once students sign up."
          onExport={() => exportRowsCsv('account-health.csv', ['Status', 'Users'], healthDonut.map((d) => [d.label, d.value]))}
          height={168}
        >
          <Donut data={healthDonut} centerLabel="Students" onSelect={(key) => key && navigate(`/users?status=${key}`)} selectHint="Click to open these users" />
        </ChartCard>
      </div>

      <Card>
        <CardHeader
          title="Recent staff activity"
          icon={FileText}
          actions={
            <Link to="/audit-log" className="text-xs font-semibold text-brand-fg hover:underline">
              Full audit log
            </Link>
          }
        />
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState icon={FileText} title="No activity yet" message="Actions taken by staff will appear here." />
        ) : (
          <ul className="divide-y divide-line">{recent.map((entry) => <ActivityRow key={entry.id} entry={entry} />)}</ul>
        )}
      </Card>
    </div>
  )
}

export default memo(Dashboard)
