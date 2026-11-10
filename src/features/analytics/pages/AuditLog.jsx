import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { ChevronDown, Download, RotateCcw, ScrollText, UserRound, X } from 'lucide-react'
import { auditLogApi } from '../api/auditLogApi'
import { SavedViews } from '../../../shared/components/listTools'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useListFilters } from '../../../shared/hooks/useListFilters'
import { useAuth } from '../../auth/context/AuthContext'
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_TONES, AUDIT_TARGET_TYPES } from '../../../shared/constants/constants'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Select,
  TableSkeleton,
  Tabs,
  cx,
} from '../../../shared/components/ui'
import { downloadCsv, formatDateTime, formatNumber, formatRelative, roleLabel, titleCase } from '../../../shared/lib/format'
import { analyticsApi } from '../../../shared/lib/analyticsApi'
import { PRESETS, isDayKey, resolveRange, toKey } from '../../../shared/lib/dateRange'
import { exportRowsCsv, exportTrendCsv, intervalTabs, trendRows, useAnalytics, useChartsVisible, useInterval } from '../../../shared/charts/analytics'
import { ChartCard, ChartsToggle } from '../../../shared/charts/primitives'
import DateRangeFilter from '../../../shared/charts/DateRangeFilter'
import ColumnChart from '../../../shared/charts/ColumnChart'
import BarList from '../../../shared/charts/BarList'

const FILTER_DEFAULTS = { action: '', target_type: 'all', actor_role: 'all', actor_id: '', from: '', to: '' }
const PAGE_SIZE = 25

const targetLabel = (entry) =>
  entry.target_snapshot?.name || entry.target_snapshot?.title || entry.target_snapshot?.email || entry.target_id

// Date inputs give YYYY-MM-DD; make "to" inclusive of the whole day.
const toIsoStart = (date) => (date ? new Date(`${date}T00:00:00`).toISOString() : '')
const toIsoEnd = (date) => (date ? new Date(`${date}T23:59:59.999`).toISOString() : '')

// The table's From/To filters drive the charts too. With no dates set the
// table shows all time and the charts fall back to the last 30 days.
const chartRangeFor = (from, to) => {
  const hasFrom = isDayKey(from)
  const hasTo = isDayKey(to)
  if (!hasFrom && !hasTo) return { ...resolveRange({ preset: '30d' }), fallback: true }
  const end = hasTo ? to : toKey(new Date())
  const start = hasFrom ? from : toKey(new Date(new Date(`${end}T00:00:00`).getTime() - 29 * 86_400_000))
  const custom = resolveRange({ preset: 'custom', from: start, to: end })
  // Show a preset's name when the dates are exactly that preset.
  const preset = PRESETS.map((p) => resolveRange({ preset: p.key })).find((r) => r.from === custom.from && r.to === custom.to)
  return preset ? { ...custom, preset: preset.preset, label: preset.label } : custom
}

const AuditLog = () => {
  const { admin } = useAuth()
  const { filters, setFilter, setFilters, resetFilters, isFiltered } = useListFilters(FILTER_DEFAULTS)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(
    () =>
      auditLogApi.getLogs({
        action: filters.action,
        target_type: filters.target_type === 'all' ? '' : filters.target_type,
        actor_role: filters.actor_role === 'all' ? '' : filters.actor_role,
        actor_id: filters.actor_id,
        from: toIsoStart(filters.from),
        to: toIsoEnd(filters.to),
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    [filters.action, filters.target_type, filters.actor_role, filters.actor_id, filters.from, filters.to, filters.page],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(load)
  const entries = data || []
  const onlyMine = filters.actor_id && filters.actor_id === admin?.id

  // Charts
  const [chartsVisible, toggleCharts] = useChartsVisible('audit-log')
  const chartRange = useMemo(() => chartRangeFor(filters.from, filters.to), [filters.from, filters.to])
  const setChartRange = (next) => {
    const resolved = resolveRange(next)
    setFilters({ from: resolved.from, to: resolved.to })
  }
  const auditFilters = {
    action: filters.action,
    target_type: filters.target_type === 'all' ? '' : filters.target_type,
    actor_role: filters.actor_role === 'all' ? '' : filters.actor_role,
    actor_id: filters.actor_id,
  }
  const [interval, setTimelineInterval, intervals] = useInterval(chartRange.days)
  const timeline = useAnalytics(
    analyticsApi.trends,
    { from: chartRange.from, to: chartRange.to, metrics: 'staffActions', interval, ...auditFilters },
    { enabled: chartsVisible },
  )
  const breakdown = useAnalytics(
    analyticsApi.breakdown,
    { from: chartRange.from, to: chartRange.to, dims: 'auditAction,auditActor', ...auditFilters },
    { enabled: chartsVisible },
  )
  const timelineRows = trendRows(timeline.data, ['staffActions'])
  const actionItems = (breakdown.data?.data?.auditAction || []).map((row) => ({ key: row.key, label: AUDIT_ACTION_LABELS[row.key] || row.key, value: row.count }))
  const actorItems = (breakdown.data?.data?.auditActor || []).map((row) => ({ key: row.key, label: row.name, sub: roleLabel(row.role), value: row.count }))

  const exportCsv = () =>
    downloadCsv(
      `audit-log-page-${filters.page}.csv`,
      ['Time', 'Actor', 'Role', 'Action', 'Target type', 'Target', 'Target ID', 'Note'],
      entries.map((e) => [formatDateTime(e.createdAt), e.actor_name, e.actor_role, AUDIT_ACTION_LABELS[e.action] || e.action, e.target_type, targetLabel(e), e.target_id, e.note || '']),
    )

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Immutable record of every staff action. Entries can't be edited or deleted."
        icon={ScrollText}
        actions={
          <>
            {chartsVisible && <DateRangeFilter value={chartRange} onChange={setChartRange} />}
            <ChartsToggle visible={chartsVisible} onToggle={toggleCharts} />
            <button type="button" onClick={exportCsv} disabled={!entries.length} className="btn btn-secondary">
              <Download className="h-4 w-4" /> Export page
            </button>
          </>
        }
      />

      {chartsVisible && (
        <div className="mb-6">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            <ChartCard
              className="lg:col-span-2"
              title="Activity timeline"
              description={`Staff actions · ${chartRange.span} · click a column to see that period`}
              loading={timeline.loading && !timeline.data}
              refreshing={timeline.refreshing}
              error={!timeline.data ? timeline.error : ''}
              onRetry={timeline.refetch}
              empty={timeline.data && !timeline.data.totals.staffActions}
              emptyTitle="No staff actions"
              emptyMessage="Nothing matches these filters in this range."
              onExport={() => exportTrendCsv(`audit-activity-${chartRange.from}-to-${chartRange.to}.csv`, timeline.data, [{ key: 'staffActions', label: 'Staff actions' }])}
              actions={intervals.length > 1 && <Tabs value={interval} onChange={setTimelineInterval} tabs={intervalTabs(intervals)} />}
              height={220}
            >
              <ColumnChart
                rows={timelineRows}
                series={[{ key: 'staffActions', label: 'Staff actions', color: 'var(--c-chart-1)' }]}
                format={formatNumber}
                clickHint="Click to filter the table to this period"
                onColumnClick={(row) => setFilters({ from: row.bucket.from, to: row.bucket.to })}
              />
            </ChartCard>

            <ChartCard
              title="By action"
              description="Click to filter"
              loading={breakdown.loading && !breakdown.data}
              refreshing={breakdown.refreshing}
              error={!breakdown.data ? breakdown.error : ''}
              onRetry={breakdown.refetch}
              empty={breakdown.data && actionItems.length === 0}
              emptyTitle="No actions"
              emptyMessage="Nothing matches these filters in this range."
              onExport={() => exportRowsCsv(`audit-by-action-${chartRange.from}-to-${chartRange.to}.csv`, ['Action', 'Entries'], actionItems.map((a) => [a.label, a.value]))}
              height={220}
            >
              <BarList items={actionItems} limit={6} selected={filters.action || null} onSelect={(key) => setFilter('action', key || '')} />
            </ChartCard>

            <ChartCard
              title="By staff member"
              description="Click to see one person's actions"
              loading={breakdown.loading && !breakdown.data}
              refreshing={breakdown.refreshing}
              error={!breakdown.data ? breakdown.error : ''}
              onRetry={breakdown.refetch}
              empty={breakdown.data && actorItems.length === 0}
              emptyTitle="No staff activity"
              emptyMessage="Nothing matches these filters in this range."
              onExport={() => exportRowsCsv(`audit-by-staff-${chartRange.from}-to-${chartRange.to}.csv`, ['Staff', 'Role', 'Entries'], actorItems.map((a) => [a.label, a.sub, a.value]))}
              height={220}
            >
              <BarList items={actorItems} limit={6} color="var(--c-cat-6)" selected={filters.actor_id || null} onSelect={(key) => setFilter('actor_id', key || '')} />
            </ChartCard>
          </div>
          {chartRange.fallback && (
            <p className="mt-3 text-xs text-subtle">
              Charts show the last 30 days; the table below shows all time. Pick a range above, or set From/To, to filter both.
            </p>
          )}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="label">Action</span>
              <Select
                label="Action"
                value={filters.action}
                onChange={(value) => setFilter('action', value)}
                options={[{ value: '', label: 'Any action' }, ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))]}
              />
            </label>
            <label className="block">
              <span className="label">Target</span>
              <Select
                label="Target type"
                value={filters.target_type}
                onChange={(value) => setFilter('target_type', value)}
                options={[{ value: 'all', label: 'Anything' }, ...AUDIT_TARGET_TYPES.map((type) => ({ value: type, label: titleCase(type) }))]}
              />
            </label>
            <label className="block">
              <span className="label">Staff role</span>
              <Select
                label="Staff role"
                value={filters.actor_role}
                onChange={(value) => setFilter('actor_role', value)}
                options={[
                  { value: 'all', label: 'Any role' },
                  { value: 'admin', label: 'Super Admin' },
                  { value: 'support', label: 'Support' },
                ]}
              />
            </label>
            <label className="block">
              <span className="label">From</span>
              <input type="date" className="input" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilter('from', e.target.value)} />
            </label>
            <label className="block">
              <span className="label">To</span>
              <input type="date" className="input" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} />
            </label>
          </div>
          <div className="flex gap-2">
            <SavedViews page="audit-log" />
            <button
              type="button"
              onClick={() => setFilter('actor_id', onlyMine ? '' : admin?.id)}
              className={cx('btn', onlyMine ? 'btn-primary' : 'btn-secondary')}
            >
              <UserRound className="h-4 w-4" /> My actions
            </button>
            {isFiltered && (
              <button type="button" onClick={resetFilters} className="btn btn-ghost">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            )}
          </div>
        </div>

        {filters.actor_id && !onlyMine && (
          <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-4 py-2 text-xs text-fg-2">
            Showing actions by one staff member
            <button type="button" onClick={() => setFilter('actor_id', '')} className="ml-auto text-muted hover:text-fg" aria-label="Clear staff filter">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {loading && !data ? (
          <TableSkeleton rows={10} columns={5} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : entries.length === 0 ? (
          <EmptyState icon={ScrollText} title="No entries" message={isFiltered ? 'Nothing matches these filters.' : 'Staff actions will be recorded here.'} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Staff</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isOpen = expanded === entry.id
                  const hasDetail = entry.note || entry.metadata
                  return (
                    <Fragment key={entry.id}>
                      <tr onClick={() => hasDetail && setExpanded(isOpen ? null : entry.id)} className={hasDetail ? 'cursor-pointer' : ''}>
                        <td className="whitespace-nowrap">
                          <p className="text-fg">{formatRelative(entry.createdAt)}</p>
                          <p className="text-xs text-subtle">{formatDateTime(entry.createdAt)}</p>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setFilter('actor_id', entry.actor_id)
                            }}
                            className="text-left hover:underline"
                            title="Show only this person's actions"
                          >
                            <span className="block font-medium text-fg">{entry.actor_name}</span>
                          </button>
                          <Badge tone={entry.actor_role === 'admin' ? 'brand' : 'info'} className="mt-0.5 text-[10px]">{entry.actor_role}</Badge>
                        </td>
                        <td>
                          <Badge tone={AUDIT_ACTION_TONES[entry.action] || 'brand'}>{AUDIT_ACTION_LABELS[entry.action] || entry.action}</Badge>
                        </td>
                        <td>
                          <p className="max-w-[260px] truncate text-fg">{targetLabel(entry)}</p>
                          <p className="text-xs text-muted capitalize">{entry.target_type}</p>
                        </td>
                        <td>{hasDetail && <ChevronDown className={cx('h-4 w-4 text-subtle transition', isOpen && 'rotate-180')} />}</td>
                      </tr>
                      {isOpen && (
                        <tr className="hover:bg-transparent">
                          <td colSpan={5} className="bg-surface-2/40">
                            {entry.note && <p className="mb-2 text-sm text-fg-2"><span className="font-semibold text-fg">Note:</span> {entry.note}</p>}
                            {entry.metadata && (
                              <pre className="overflow-x-auto rounded-lg border border-line bg-canvas p-3 font-mono text-xs text-fg-2">
                                {JSON.stringify(entry.metadata, null, 2)}
                              </pre>
                            )}
                            <p className="mt-2 font-mono text-[11px] text-subtle">target {entry.target_id} · entry {entry.id}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pagination {...pagination} onPageChange={(page) => setFilter('page', page)} />}
      </Card>
    </div>
  )
}

export default memo(AuditLog)
