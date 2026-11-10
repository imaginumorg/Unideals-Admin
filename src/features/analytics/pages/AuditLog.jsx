import { Fragment, memo, useCallback, useState } from 'react'
import { ChevronDown, Download, RotateCcw, ScrollText, UserRound, X } from 'lucide-react'
import { auditLogApi } from '../api/auditLogApi'
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
  cx,
} from '../../../shared/components/ui'
import { downloadCsv, formatDateTime, formatRelative, titleCase } from '../../../shared/lib/format'

const FILTER_DEFAULTS = { action: '', target_type: 'all', actor_role: 'all', actor_id: '', from: '', to: '' }
const PAGE_SIZE = 25

const targetLabel = (entry) =>
  entry.target_snapshot?.name || entry.target_snapshot?.title || entry.target_snapshot?.email || entry.target_id

// Date inputs give YYYY-MM-DD; make "to" inclusive of the whole day.
const toIsoStart = (date) => (date ? new Date(`${date}T00:00:00`).toISOString() : '')
const toIsoEnd = (date) => (date ? new Date(`${date}T23:59:59.999`).toISOString() : '')

const AuditLog = () => {
  const { admin } = useAuth()
  const { filters, setFilter, resetFilters, isFiltered } = useListFilters(FILTER_DEFAULTS)
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
          <button type="button" onClick={exportCsv} disabled={!entries.length} className="btn btn-secondary">
            <Download className="h-4 w-4" /> Export page
          </button>
        }
      />

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
