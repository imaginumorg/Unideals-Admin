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
} from '../../../shared/components/ui'
import { downloadCsv, formatCurrency, formatDate, formatNumber } from '../../../shared/lib/format'
import { ORDER_STAGES, stageOf } from '../orderStatus'

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
          <button type="button" onClick={exportCsv} disabled={!orders.length} className="btn btn-secondary">
            <Download className="h-4 w-4" /> Export page
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="All deals" icon={ShoppingBag} value={formatNumber(stats?.totalOrders)} trend={stats ? `${stats.totalGrowth >= 0 ? '+' : ''}${stats.totalGrowth}%` : null} hint="vs last month" loading={!stats} />
        <StatCard label="Negotiating" icon={Handshake} tone="warning" value={formatNumber(stats?.pendingOrders)} loading={!stats} onClick={() => setFilter('status', 'pending')} />
        <StatCard label="Pickup scheduled" icon={CalendarCheck} tone="violet" value={formatNumber(stats?.scheduledOrders)} loading={!stats} onClick={() => setFilter('status', 'scheduled')} />
        <StatCard label="Completed" icon={CircleCheck} tone="success" value={formatNumber(stats?.deliveredOrders)} loading={!stats} onClick={() => setFilter('status', 'delivered')} />
        <StatCard label="Cancelled" icon={XCircle} tone="neutral" value={formatNumber(stats?.cancelledOrders)} loading={!stats} onClick={() => setFilter('status', 'cancelled')} />
      </div>

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
