import { memo, useCallback, useState } from 'react'
import { Clock, Headphones, ShieldAlert, ShieldCheck, Tag, Users, X } from 'lucide-react'
import { moderationApi } from '../api/moderationApi'
import { productsApi } from '../../products/api/productsApi'
import { usersApi } from '../../users/api/usersApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useAttention } from '../../../layouts/AttentionContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useListFilters } from '../../../shared/hooks/useListFilters'
import { REPORT_REASON_LABELS } from '../../../shared/constants/constants'
import ReportEvidenceDrawer from '../components/ReportEvidenceDrawer'
import QueueItemCard from '../components/QueueItemCard'
import { TYPE_META } from '../reportMeta'
import {
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  PageHeader,
  Pagination,
  Skeleton,
  Tabs,
  cx,
} from '../../../shared/components/ui'
import { formatNumber, titleCase } from '../../../shared/lib/format'
import { useAnalyticsRange } from '../../../shared/context/AnalyticsRangeContext'
import { analyticsApi } from '../../../shared/lib/analyticsApi'
import { exportRowsCsv, exportTrendCsv, hasAny, intervalTabs, trendRows, useAnalytics, useChartsVisible, useInterval } from '../../../shared/charts/analytics'
import { ChartCard, ChartsToggle, categorical, statusColor } from '../../../shared/charts/primitives'
import DateRangeFilter from '../../../shared/charts/DateRangeFilter'
import Donut from '../../../shared/charts/Donut'
import BarList from '../../../shared/charts/BarList'
import TrendChart from '../../../shared/charts/TrendChart'

const PRIORITY_ORDER = ['high', 'medium', 'low']
const QUEUE_TYPES = ['Product', 'User', 'Support']
const OUTCOME_LABELS = { pending: 'Still open', action_taken: 'Action taken', dismissed: 'Dismissed' }
const REPORT_SERIES = [
  { key: 'reports', label: 'Filed', color: 'var(--c-cat-1)' },
  { key: 'reportsClosed', label: 'Closed', color: 'var(--c-cat-3)' },
]

// Every way an item can leave the queue, with copy for the confirm dialog.
const ACTIONS = {
  resolve: { title: 'Mark as resolved?', text: 'All open reports are closed as “action taken”, and every reporter is told action was taken.', label: 'Resolve', tone: 'primary', note: 'Note for the audit log' },
  dismiss: { title: 'Dismiss these reports?', text: "Reports are closed with no action and reporters are told no violation was found. An auto-hidden listing goes live again and its seller is told.", label: 'Dismiss', tone: 'primary' },
  block: { title: 'Block this listing?', text: "Removed from the marketplace for good. The seller is notified (with your reason) and reporters are told action was taken.", label: 'Block listing', tone: 'danger', note: 'Reason (shown to the seller)' },
  unlist: { title: 'Unlist this listing?', text: 'Hidden until the seller fixes and relists it. The seller is notified with your reason; reporters are told action was taken.', label: 'Unlist', tone: 'primary', note: 'Reason (shown to the seller)' },
  delete: { title: 'Delete this listing permanently?', text: 'Cannot be undone. The seller and reporters are notified.', label: 'Delete', tone: 'danger', note: 'Reason (shown to the seller)' },
  suspend: { title: 'Suspend this user?', text: 'They are signed out everywhere and cannot sign in until reactivated. Reporters are told action was taken.', label: 'Suspend', tone: 'danger', note: 'Reason (audit log)' },
  activate: { title: 'Reactivate this user?', text: 'They can sign in and trade again.', label: 'Reactivate', tone: 'primary' },
}

const TYPE_TABS = [
  { value: 'all', label: 'All', icon: null },
  { value: 'Product', label: 'Listings', icon: Tag },
  { value: 'User', label: 'Users', icon: Users },
  { value: 'Support', label: 'Help & support', icon: Headphones },
]

const QueueSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="space-y-3 p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full" />
      </Card>
    ))}
  </div>
)

const ModerationQueue = () => {
  const { can } = useAuth()
  // What this person can do from the queue (the API enforces the same).
  const perms = { reports: can('reports', 'manage'), listings: can('listings', 'manage'), users: can('users', 'manage') }
  const { showToast } = useToast()
  const { refresh: refreshAttention } = useAttention()
  const { filters, setFilter, setFilters } = useListFilters({ type: 'all', priority: '', reason: '' })
  const [pending, setPending] = useState(null) // { item, action }
  const [note, setNote] = useState('')
  const [working, setWorking] = useState(false)

  const load = useCallback(
    () =>
      moderationApi.getQueue({
        target_model: filters.type === 'all' ? '' : filters.type,
        priority: filters.priority,
        reason: filters.reason,
        page: filters.page,
      }),
    [filters.type, filters.priority, filters.reason, filters.page],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(load)
  const items = data || []

  // Charts: the queue mix (what's open now) and reports over the chosen range.
  const { range } = useAnalyticsRange()
  const [chartsVisible, toggleCharts] = useChartsVisible('reports')
  const breakdown = useAnalytics(
    analyticsApi.breakdown,
    { from: range.from, to: range.to, dims: 'queueType,queuePriority,queueReason,reportStatus' },
  )
  const [trendInterval, setTrendInterval, trendIntervals] = useInterval(range.days)
  const trends = useAnalytics(
    analyticsApi.trends,
    { from: range.from, to: range.to, compareFrom: range.compareFrom, compareTo: range.compareTo, metrics: 'reports,reportsClosed', interval: trendInterval },
    { enabled: chartsVisible },
  )
  const dims = breakdown.data?.data || {}
  const countsOf = (rows) => Object.fromEntries((rows || []).map((row) => [row.key, row.count]))
  const typeCounts = countsOf(dims.queueType)
  const typeDonut = QUEUE_TYPES.map((key, i) => ({ key, label: TYPE_META[key].label, value: typeCounts[key] || 0, color: categorical(i) }))
  const priorityCounts = countsOf(dims.queuePriority)
  const priorityItems = PRIORITY_ORDER.map((key) => ({ key, label: `${titleCase(key)} priority`, value: priorityCounts[key] || 0, sub: key === 'high' ? '5+ reports' : key === 'medium' ? '2–4' : '1' }))
  const reasonItems = (dims.queueReason || []).map((row) => ({ key: row.key, label: REPORT_REASON_LABELS[row.key] || titleCase(row.key), value: row.count }))
  const outcomeCounts = countsOf(dims.reportStatus)
  const outcomeDonut = Object.entries(OUTCOME_LABELS).map(([key, label]) => ({ key, label, value: outcomeCounts[key] || 0, color: statusColor(key) }))
  const queueEmpty = breakdown.data && typeDonut.every((d) => !d.value)
  const refreshCharts = () => {
    if (!chartsVisible) return
    breakdown.refetch()
    trends.refetch()
  }
  const drillFilters = [
    filters.priority && { key: 'priority', label: `${titleCase(filters.priority)} priority` },
    filters.reason && { key: 'reason', label: REPORT_REASON_LABELS[filters.reason] || titleCase(filters.reason) },
  ].filter(Boolean)

  const run = async () => {
    const { item, action } = pending
    setWorking(true)
    let response
    if (action === 'resolve') {
      response = await moderationApi.resolveReports({ targetId: item.targetId, targetModel: item.targetModel, adminNote: note.trim() || 'Resolved by moderator' })
    } else if (action === 'dismiss') {
      response = await moderationApi.dismissReports({ targetId: item.targetId, targetModel: item.targetModel })
    } else {
      const reason = note.trim()
      if (action === 'block') response = await productsApi.updateProductStatus(item.targetId, 'blocked', reason)
      else if (action === 'unlist') response = await productsApi.updateProductStatus(item.targetId, 'unlisted', reason)
      else if (action === 'delete') response = await productsApi.hardDeleteProduct(item.targetId, reason)
      else if (action === 'suspend') response = await usersApi.updateUserStatus(item.targetId, 'suspended', reason)
      else if (action === 'activate') response = await usersApi.updateUserStatus(item.targetId, 'active')
      // Enforcement closes the reports too, so the item leaves the queue.
      if (response?.success) {
        await moderationApi.resolveReports({
          targetId: item.targetId,
          targetModel: item.targetModel,
          adminNote: reason ? `Enforced (${action}): ${reason}` : `Enforced: ${action}`,
        })
      }
    }
    setWorking(false)
    if (!response?.success) {
      showToast({ type: 'error', message: response?.message || 'Action failed' })
      return
    }
    const notified = response.data?.notifiedReporters
    showToast({
      type: 'success',
      message: notified ? `${ACTIONS[action].label} — done. ${notified} reporter${notified === 1 ? '' : 's'} notified.` : `${ACTIONS[action].label} — done`,
    })
    setPending(null)
    setNote('')
    refetch()
    refreshCharts()
    refreshAttention()
  }

  const open = (item, action) => setPending({ item, action })
  // Explain missing buttons rather than leaving people guessing.
  const accessNote = !perms.reports
    ? 'Your role can view reports but not resolve or dismiss them.'
    : !perms.listings || !perms.users
      ? `You can resolve and dismiss reports. ${[!perms.listings && 'Blocking listings', !perms.users && 'suspending users'].filter(Boolean).join(' and ')} needs more access.`
      : ''
  const [evidenceItem, setEvidenceItem] = useState(null)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Reported listings, users and help requests, most-reported first. Resolving or enforcing closes every open report on the item."
        icon={ShieldAlert}
        iconTile
        actions={
          <>
            {chartsVisible && <DateRangeFilter />}
            <ChartsToggle visible={chartsVisible} onToggle={toggleCharts} />
          </>
        }
      />

      {chartsVisible && (
        <div className="mb-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <ChartCard
              title="Open items by type"
              description="Waiting in the queue now · click to filter"
              loading={breakdown.loading && !breakdown.data}
              refreshing={breakdown.refreshing}
              error={!breakdown.data ? breakdown.error : ''}
              onRetry={breakdown.refetch}
              empty={queueEmpty}
              emptyTitle="Queue is clear"
              emptyMessage="No open reports right now."
              onExport={() => exportRowsCsv('open-reports-by-type.csv', ['Type', 'Open items'], typeDonut.map((d) => [d.label, d.value]))}
              height={168}
            >
              <Donut
                data={typeDonut}
                centerLabel="Open items"
                selected={filters.type === 'all' ? null : filters.type}
                onSelect={(key) => setFilter('type', key || 'all')}
              />
            </ChartCard>

            <ChartCard
              title="Open items by priority"
              description="Listings and users · click to filter"
              loading={breakdown.loading && !breakdown.data}
              refreshing={breakdown.refreshing}
              error={!breakdown.data ? breakdown.error : ''}
              onRetry={breakdown.refetch}
              empty={breakdown.data && priorityItems.every((d) => !d.value)}
              emptyTitle="Nothing to prioritise"
              emptyMessage="No open reports on listings or users."
              onExport={() => exportRowsCsv('open-reports-by-priority.csv', ['Priority', 'Open items'], priorityItems.map((d) => [d.label, d.value]))}
              height={140}
            >
              <BarList
                items={priorityItems}
                sortable={false}
                color="var(--c-danger)"
                selected={filters.priority || null}
                onSelect={(key) => setFilters(key ? { priority: key, type: filters.type === 'Support' ? 'all' : filters.type } : { priority: '' })}
              />
            </ChartCard>

            <ChartCard
              className="lg:col-span-2 xl:col-span-1"
              title="Open items by reason"
              description="An item counts once per reason · click to filter"
              loading={breakdown.loading && !breakdown.data}
              refreshing={breakdown.refreshing}
              error={!breakdown.data ? breakdown.error : ''}
              onRetry={breakdown.refetch}
              empty={breakdown.data && reasonItems.length === 0}
              emptyTitle="No open reasons"
              emptyMessage="No open reports on listings or users."
              onExport={() => exportRowsCsv('open-reports-by-reason.csv', ['Reason', 'Open items'], reasonItems.map((d) => [d.label, d.value]))}
              height={160}
            >
              <BarList
                items={reasonItems}
                limit={5}
                selected={filters.reason || null}
                onSelect={(key) => setFilters(key ? { reason: key, type: filters.type === 'Support' ? 'all' : filters.type } : { reason: '' })}
              />
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <ChartCard
              className="xl:col-span-3"
              title="Reports over time"
              description={`Listing and user reports filed and closed · ${range.label.toLowerCase()} vs ${range.compareLabel}`}
              loading={trends.loading && !trends.data}
              refreshing={trends.refreshing}
              error={!trends.data ? trends.error : ''}
              onRetry={trends.refetch}
              empty={trends.data && !hasAny(trends.data, ['reports', 'reportsClosed'])}
              emptyMessage="No reports were filed or closed in this range."
              onExport={() => exportTrendCsv(`reports-${range.from}-to-${range.to}.csv`, trends.data, REPORT_SERIES)}
              actions={trendIntervals.length > 1 && <Tabs value={trendInterval} onChange={setTrendInterval} tabs={intervalTabs(trendIntervals)} />}
            >
              <TrendChart
                type="line"
                rows={trendRows(trends.data, ['reports', 'reportsClosed'])}
                series={REPORT_SERIES.map((s) => ({ ...s, total: trends.data ? formatNumber(trends.data.totals[s.key]) : undefined }))}
                format={formatNumber}
              />
            </ChartCard>

            <ChartCard
              className="xl:col-span-2"
              title="Outcome"
              description={`Reports filed ${range.label.toLowerCase()}, by what happened`}
              loading={breakdown.loading && !breakdown.data}
              refreshing={breakdown.refreshing}
              error={!breakdown.data ? breakdown.error : ''}
              onRetry={breakdown.refetch}
              empty={breakdown.data && outcomeDonut.every((d) => !d.value)}
              emptyMessage="No listing or user reports were filed in this range."
              onExport={() => exportRowsCsv(`report-outcomes-${range.from}-to-${range.to}.csv`, ['Outcome', 'Reports'], outcomeDonut.map((d) => [d.label, d.value]))}
              height={168}
            >
              <Donut data={outcomeDonut} centerLabel="Filed" />
            </ChartCard>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-2">
          {TYPE_TABS.map((tab) => {
            const active = filters.type === tab.value
            const count = tab.value === 'all' ? (breakdown.data ? typeDonut.reduce((n, d) => n + d.value, 0) : null) : breakdown.data ? typeCounts[tab.value] || 0 : null
            const Icon = tab.icon
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter('type', tab.value)}
                className={cx(
                  'inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13px] font-medium transition-[background-color,border-color,color] duration-150',
                  active
                    ? 'border-brand/60 bg-brand-soft text-fg shadow-[inset_0_0_0_1px_var(--c-brand-soft)]'
                    : 'border-line bg-surface text-fg-2 hover:border-line-strong hover:bg-surface-2 hover:text-fg',
                )}
              >
                {Icon && <Icon className={cx('h-4 w-4', active ? 'text-brand-fg' : 'text-muted')} />}
                {tab.label}
                {count !== null && (
                  <span className={cx('min-w-5 rounded-md px-1.5 text-center text-[11px] tabular-nums', active ? 'bg-brand/25 text-fg' : 'bg-surface-3 text-muted')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {pagination?.total !== undefined && (
          <p className="flex items-center gap-2 text-[13px] font-medium text-fg-2">
            <Clock className="h-4 w-4 text-brand-fg" />
            {pagination.total} item{pagination.total === 1 ? '' : 's'} waiting
          </p>
        )}
      </div>

      {drillFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Filtered by</span>
          {drillFilters.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key, '')}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5 text-xs font-medium text-fg-2 transition-colors hover:border-line-strong hover:text-fg"
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label} <X className="h-3 w-3" />
            </button>
          ))}
          <button type="button" onClick={() => setFilters({ priority: '', reason: '' })} className="text-xs font-medium text-brand-fg hover:underline">
            Clear
          </button>
        </div>
      )}

      {accessNote && (
        <InlineAlert tone="info" className="mb-4">
          {accessNote}
        </InlineAlert>
      )}

      {loading && !data ? (
        <QueueSkeleton />
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={refetch} /></Card>
      ) : items.length === 0 ? (
        <Card>
          {drillFilters.length > 0 ? (
            <EmptyState icon={ShieldCheck} title="Nothing matches these filters" message="Clear the priority or reason filter to see the rest of the queue." />
          ) : (
            <EmptyState icon={ShieldCheck} title="Queue is clear" message="No open reports right now. New reports from students will show up here." />
          )}
        </Card>
      ) : (
        <div className={cx('space-y-4 transition-opacity', refreshing && 'opacity-60')}>
          {items.map((item) => (
            <QueueItemCard key={`${item.targetModel}-${item.targetId}`} item={item} perms={perms} onAction={open} onEvidence={setEvidenceItem} />
          ))}
          {pagination && pagination.totalPages > 1 && (
            <Card className="overflow-hidden">
              <Pagination {...pagination} onPageChange={(page) => setFilter('page', page)} />
            </Card>
          )}
        </div>
      )}

      <ReportEvidenceDrawer item={evidenceItem} onClose={() => setEvidenceItem(null)} />

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={run}
        loading={working}
        tone={pending ? ACTIONS[pending.action].tone : 'primary'}
        title={pending ? ACTIONS[pending.action].title : ''}
        description={pending ? ACTIONS[pending.action].text : ''}
        confirmLabel={pending ? ACTIONS[pending.action].label : ''}
      >
        {pending && ACTIONS[pending.action].note && (
          <Field label={ACTIONS[pending.action].note} hint="Optional">
            <textarea className="input" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you do?" />
          </Field>
        )}
        {pending && !['resolve', 'dismiss'].includes(pending.action) && (
          <p className="text-xs text-muted">The open reports on this item will be marked resolved as well.</p>
        )}
      </ConfirmDialog>
    </div>
  )
}

export default memo(ModerationQueue)
