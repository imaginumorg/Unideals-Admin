import { memo, useCallback, useState } from 'react'
import { CalendarCheck, CircleCheck, Clock, Download, Handshake, ImageOff, RotateCcw, ShoppingBag, XCircle } from 'lucide-react'
import { ordersApi } from '../api/ordersApi'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useCampusOptions, useListFilters, useSearchFilter } from '../../../shared/hooks/useListFilters'
import OrderDetailsDrawer from '../components/OrderDetailsDrawer'
import { SavedViews } from '../../../shared/components/listTools'
import Avatar from '../../../shared/components/Avatar'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  TableSkeleton,
  Tabs,
  Toggle,
} from '../../../shared/components/ui'
import { downloadCsv, formatCurrency, formatDate, formatNumber } from '../../../shared/lib/format'
import { ORDER_STAGES, stageOf } from '../orderStatus'
import { useAnalyticsRange } from '../../../shared/context/AnalyticsRangeContext'
import { analyticsApi } from '../../../shared/lib/analyticsApi'
import { exportRowsCsv, exportTrendCsv, hasAny, intervalTabs, trendRows, useAnalytics, useChartsVisible, useInterval } from '../../../shared/charts/analytics'
import { ChartCard, ChartsToggle, compact, toneColor } from '../../../shared/charts/primitives'
import DateRangeFilter from '../../../shared/charts/DateRangeFilter'
import Donut from '../../../shared/charts/Donut'
import TrendChart from '../../../shared/charts/TrendChart'

const VOLUME_SERIES = [
  { key: 'orders', label: 'Started', color: 'var(--c-cat-1)' },
  { key: 'deals', label: 'Completed', color: 'var(--c-cat-3)' },
  { key: 'cancelled', label: 'Cancelled', color: 'var(--c-cat-2)' },
]

const PAGE_SIZE = 12
const FILTER_DEFAULTS = { search: '', status: 'all', campus: 'all', payment: 'all' }

const Orders = () => {
  const campuses = useCampusOptions()
  const { filters, setFilter, resetFilters, isFiltered } = useListFilters(FILTER_DEFAULTS)
  const [searchText, setSearchText] = useSearchFilter(filters, setFilter)
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(
    () =>
      ordersApi.getOrders({
        search: filters.search,
        status: filters.status,
        campus: filters.campus,
        payment: filters.payment,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    [filters.search, filters.status, filters.campus, filters.payment, filters.page],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(load)
  const { data: stats, refetch: refetchStats } = useFetch(ordersApi.getOrderStats)
  const orders = data || []

  const counts = stats
    ? {
        all: stats.totalOrders,
        pending: stats.pendingOrders,
        processing: stats.processingOrders,
        scheduled: stats.scheduledOrders,
        delivered: stats.deliveredOrders,
        cancelled: stats.cancelledOrders,
      }
    : null

  // Charts
  const { range } = useAnalyticsRange()
  const [chartsVisible, toggleCharts] = useChartsVisible('orders')
  const [trendTab, setTrendTab] = useState('volume')
  const [compare, setCompare] = useState(false)
  const [interval, setTrendInterval, intervals] = useInterval(range.days)
  const trends = useAnalytics(
    analyticsApi.trends,
    { from: range.from, to: range.to, compareFrom: range.compareFrom, compareTo: range.compareTo, metrics: 'orders,deals,cancelled,gmv', interval },
    { enabled: chartsVisible },
  )
  const trendMetrics = trendTab === 'volume' ? VOLUME_SERIES.map((s) => s.key) : ['gmv']
  const trendSeries =
    trendTab === 'volume'
      ? VOLUME_SERIES.map((s) => ({ ...s, total: trends.data ? formatNumber(trends.data.totals[s.key]) : undefined }))
      : [{ key: 'gmv', label: 'Completed-deal value', color: 'var(--c-chart-1)', total: trends.data ? formatCurrency(trends.data.totals.gmv) : undefined }]
  const stageDonut = Object.entries(ORDER_STAGES).map(([key, stage]) => ({ key, label: stage.label, value: counts?.[key] || 0, color: toneColor(stage.tone) }))
  const stageSelected = ORDER_STAGES[filters.status] ? filters.status : null

  const exportCsv = () =>
    downloadCsv(
      `orders-page-${filters.page}.csv`,
      ['Order', 'Item', 'Buyer', 'Buyer email', 'Seller', 'Campus', 'Amount', 'Payment', 'Stage', 'Started'],
      orders.map((o) => [o.orderId, o.product?.title, o.buyer?.name, o.buyer?.email, o.seller?.name, o.campus, o.amount, o.payment?.status, stageOf(o.status).label, formatDate(o.createdAt)]),
    )

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Deals between students, from first offer to pickup."
        icon={ShoppingBag}
        actions={
          <>
            {chartsVisible && <DateRangeFilter />}
            <ChartsToggle visible={chartsVisible} onToggle={toggleCharts} />
            <button type="button" onClick={exportCsv} disabled={!orders.length} className="btn btn-secondary">
              <Download className="h-4 w-4" /> Export page
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <StatCard label="All deals" icon={ShoppingBag} value={formatNumber(stats?.totalOrders)} trend={stats ? `${stats.totalGrowth >= 0 ? '+' : ''}${stats.totalGrowth}%` : null} hint="vs last month" loading={!stats} />
        <StatCard label="Negotiating" icon={Handshake} tone="warning" value={formatNumber(stats?.pendingOrders)} loading={!stats} active={filters.status === 'pending'} onClick={() => setFilter('status', filters.status === 'pending' ? 'all' : 'pending')} />
        <StatCard label="Pickup scheduled" icon={CalendarCheck} tone="violet" value={formatNumber(stats?.scheduledOrders)} loading={!stats} active={filters.status === 'scheduled'} onClick={() => setFilter('status', filters.status === 'scheduled' ? 'all' : 'scheduled')} />
        <StatCard label="Completed" icon={CircleCheck} tone="success" value={formatNumber(stats?.deliveredOrders)} loading={!stats} active={filters.status === 'delivered'} onClick={() => setFilter('status', filters.status === 'delivered' ? 'all' : 'delivered')} />
        <StatCard label="Cancelled" icon={XCircle} tone="neutral" value={formatNumber(stats?.cancelledOrders)} loading={!stats} active={filters.status === 'cancelled'} onClick={() => setFilter('status', filters.status === 'cancelled' ? 'all' : 'cancelled')} />
      </div>

      {chartsVisible && (
        <div className="mb-6 grid gap-6 xl:grid-cols-5">
          <ChartCard
            className="xl:col-span-3"
            title={trendTab === 'volume' ? 'Order volume' : 'Completed-deal value'}
            description={`${range.label} · ${trendTab === 'volume' ? 'deals started, completed and cancelled' : 'GMV of deals completed'}`}
            loading={trends.loading && !trends.data}
            refreshing={trends.refreshing}
            error={!trends.data ? trends.error : ''}
            onRetry={trends.refetch}
            empty={trends.data && !hasAny(trends.data, trendMetrics)}
            emptyMessage="No deals started, completed or cancelled in this range."
            onExport={() => exportTrendCsv(`orders-${trendTab}-${range.from}-to-${range.to}.csv`, trends.data, trendSeries)}
            actions={
              <>
                <label className="hidden items-center gap-2 text-xs text-muted sm:flex">
                  Compare <Toggle checked={compare} onChange={setCompare} label="Compare with the previous period" />
                </label>
                {intervals.length > 1 && <Tabs value={interval} onChange={setTrendInterval} tabs={intervalTabs(intervals)} />}
              </>
            }
            height={248}
          >
            <Tabs
              className="mb-4"
              value={trendTab}
              onChange={setTrendTab}
              tabs={[
                { value: 'volume', label: 'Volume' },
                { value: 'value', label: 'Deal value' },
              ]}
            />
            <TrendChart
              type={trendTab === 'volume' ? 'line' : 'area'}
              rows={trendRows(trends.data, trendMetrics)}
              series={trendSeries}
              format={trendTab === 'volume' ? formatNumber : formatCurrency}
              axisFormat={trendTab === 'volume' ? compact : (v) => `₹${compact(v)}`}
              showPrevious={compare}
            />
          </ChartCard>

          <ChartCard
            className="xl:col-span-2"
            title="Orders by stage"
            description="All deals right now · click to filter"
            loading={!stats}
            empty={stats && stageDonut.every((d) => !d.value)}
            emptyMessage="Deals appear here once students start trading."
            onExport={() => exportRowsCsv('orders-by-stage.csv', ['Stage', 'Deals'], stageDonut.map((d) => [d.label, d.value]))}
            height={168}
          >
            <Donut data={stageDonut} centerLabel="Deals" selected={stageSelected} onSelect={(key) => setFilter('status', key || 'all')} />
          </ChartCard>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-line p-4">
          <Tabs
            value={filters.status}
            onChange={(value) => setFilter('status', value)}
            tabs={[
              { value: 'all', label: 'All', count: counts?.all },
              ...Object.entries(ORDER_STAGES).map(([value, stage]) => ({ value, label: stage.label, count: counts?.[value] })),
            ]}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput value={searchText} onChange={setSearchText} placeholder="Order ID, item, buyer or seller" className="sm:max-w-sm" />
            <Select
              label="Campus"
              value={filters.campus}
              onChange={(value) => setFilter('campus', value)}
              options={[{ value: 'all', label: 'All campuses' }, ...campuses.map((c) => ({ value: c.id, label: c.name }))]}
              className="sm:w-52"
            />
            <Select
              label="Payment"
              value={filters.payment}
              onChange={(value) => setFilter('payment', value)}
              options={[
                { value: 'all', label: 'Any payment' },
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Unpaid' },
              ]}
              className="sm:w-40"
            />
            {isFiltered && (
              <button type="button" onClick={resetFilters} className="btn btn-ghost">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            )}
            <div className="sm:ml-auto">
              <SavedViews page="orders" />
            </div>
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={8} columns={6} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders found" message={isFiltered ? 'Try a different search or clear the filters.' : 'Deals appear here once students start trading.'} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            <table className="table min-w-[980px]">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Item</th>
                  <th>Buyer → Seller</th>
                  <th className="text-right">Amount</th>
                  <th>Payment</th>
                  <th>Stage</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const stage = stageOf(order.status)
                  const image = order.product?.images?.[0]
                  return (
                    <tr key={order.id} onClick={() => setSelectedId(order.id)} className="cursor-pointer">
                      <td>
                        <p className="font-mono text-[13px] font-semibold text-fg">{order.orderId}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <Clock className="h-3 w-3" /> {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2 text-subtle">
                            {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-medium text-fg">{order.product?.title}</p>
                            <p className="max-w-[220px] truncate text-xs text-muted">{order.campus || 'No campus'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar src={order.buyer?.avatar} name={order.buyer?.name} className="h-7 w-7 text-[10px]" />
                          <span className="max-w-[110px] truncate">{order.buyer?.name}</span>
                          <span className="text-subtle">→</span>
                          <span className="max-w-[110px] truncate text-muted">{order.seller?.name}</span>
                        </div>
                      </td>
                      <td className="text-right font-semibold text-fg tabular-nums">{formatCurrency(order.amount)}</td>
                      <td>
                        <Badge tone={order.payment?.status === 'Paid' ? 'success' : 'neutral'}>{order.payment?.status || '—'}</Badge>
                      </td>
                      <td>
                        <Badge tone={stage.tone} dot>{stage.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pagination {...pagination} onPageChange={(page) => setFilter('page', page)} />}
      </Card>

      <OrderDetailsDrawer
        orderId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={() => {
          refetch()
          refetchStats()
        }}
      />
    </div>
  )
}

export default memo(Orders)
