import { memo, useCallback, useState } from 'react'
import { Ban, Download, MoreHorizontal, RotateCcw, ShieldCheck, UserCheck, UserPlus, Users as UsersIcon } from 'lucide-react'
import { usersApi } from '../api/usersApi'
import { useToast } from '../../../shared/components/ToastContext'
import { useAuth } from '../../auth/context/AuthContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useCampusOptions, useListFilters, useSearchFilter } from '../../../shared/hooks/useListFilters'
import UserDetailsDrawer from '../components/UserDetailsDrawer'
import DeleteUserDialog from '../components/DeleteUserDialog'
import { BulkBar, BulkConfirmDialog, Checkbox, SavedViews, useSelection } from '../../../shared/components/listTools'
import Avatar from '../../../shared/components/Avatar'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  StatusBadge,
  TableSkeleton,
  Tabs,
} from '../../../shared/components/ui'
import { downloadCsv, formatDate, formatNumber } from '../../../shared/lib/format'

const PAGE_SIZE = 12
const FILTER_DEFAULTS = { search: '', status: 'all', campus: 'all' }

const RowMenu = ({ user, canWrite, canChangeRole, onView, onAction }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block" onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setOpen(false)}>
      <button type="button" aria-label="Row actions" onClick={() => setOpen((value) => !value)} className="btn btn-ghost btn-icon h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="pop animate-pop-in absolute top-full right-0 z-20 mt-1 w-48 p-1 text-left">
          <button type="button" onClick={() => { setOpen(false); onView() }} className="flex w-full rounded-lg px-3 py-2 text-sm text-fg-2 hover:bg-surface-2">
            View details
          </button>
          {canChangeRole && (
            <button
              type="button"
              onClick={() => { setOpen(false); onAction('role') }}
              className="flex w-full rounded-lg px-3 py-2 text-sm text-fg-2 hover:bg-surface-2"
            >
              {user.role === 'support' ? 'Remove support access' : 'Make support staff'}
            </button>
          )}
          {canWrite && (
            <>
              <button
                type="button"
                onClick={() => { setOpen(false); onAction('status') }}
                className={`flex w-full rounded-lg px-3 py-2 text-sm hover:bg-surface-2 ${user.status === 'suspended' ? 'text-success' : 'text-danger'}`}
              >
                {user.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const Users = () => {
  const { showToast } = useToast()
  const { can, isAdmin } = useAuth()
  const canWrite = can('users', 'manage')
  const campuses = useCampusOptions()
  const { filters, setFilter, resetFilters, isFiltered } = useListFilters(FILTER_DEFAULTS)
  const [searchText, setSearchText] = useSearchFilter(filters, setFilter)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [confirm, setConfirm] = useState(null) // { user, kind }
  const [working, setWorking] = useState(false)
  const [drawerVersion, setDrawerVersion] = useState(0)

  const loadUsers = useCallback(
    () =>
      usersApi.getUsers({
        search: filters.search,
        status: filters.status === 'all' ? '' : filters.status,
        campus: filters.campus === 'all' ? '' : filters.campus,
        page: filters.page,
        limit: PAGE_SIZE,
      }),
    [filters.search, filters.status, filters.campus, filters.page],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(loadUsers)
  const { data: stats, refetch: refetchStats } = useFetch(usersApi.getUserStats)
  const users = data || []
  const selection = useSelection(users)
  const [bulkStatus, setBulkStatus] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const runBulk = async (reason) => {
    const response = await usersApi.bulkUpdateStatus(selection.selectedIds, bulkStatus, reason)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return null
    }
    showToast({ type: response.data.failed ? 'info' : 'success', message: response.message })
    selection.clear()
    refetch()
    refetchStats()
    return response.data
  }

  const runConfirmed = async () => {
    if (!confirm) return
    const { user, kind } = confirm
    setWorking(true)
    const response =
      kind === 'status'
        ? await usersApi.updateUserStatus(user.id, user.status === 'suspended' ? 'active' : 'suspended')
        : await usersApi.updateUserRole(user.id, user.role === 'support' ? 'user' : 'support')
    setWorking(false)
    if (!response.success) {
      showToast({ type: 'error', message: response.message })
      return
    }
    showToast({
      type: 'success',
      message:
        kind === 'status'
          ? `${user.name} ${user.status === 'suspended' ? 'reactivated' : 'suspended'}`
          : `${user.name} ${user.role === 'support' ? 'is no longer support staff' : 'is now support staff'}`,
    })
    setConfirm(null)
    setDrawerVersion((value) => value + 1)
    refetch()
    refetchStats()
  }

  const exportCsv = () =>
    downloadCsv(
      `users-page-${filters.page}.csv`,
      ['ID', 'Name', 'Email', 'Campus', 'Status', 'Role', 'Listings', 'Joined'],
      users.map((user) => [user.id, user.name, user.email, user.campus?.name || '', user.status, user.role, user.listings ?? 0, formatDate(user.joined)]),
    )

  const confirmCopy = confirm
    ? confirm.kind === 'status'
      ? confirm.user.status === 'suspended'
        ? { title: `Reactivate ${confirm.user.name}?`, description: 'They will be able to sign in, list and buy again.', label: 'Reactivate', tone: 'primary' }
        : { title: `Suspend ${confirm.user.name}?`, description: 'They are signed out everywhere and cannot sign in until reactivated.', label: 'Suspend', tone: 'danger' }
      : confirm.user.role === 'support'
        ? { title: 'Remove support access?', description: `${confirm.user.name} will lose access to the admin console.`, label: 'Remove access', tone: 'danger' }
        : { title: 'Grant support access?', description: `${confirm.user.name} will be able to sign in here and work the report queue.`, label: 'Grant access', tone: 'primary' }
    : {}

  return (
    <div>
      <PageHeader
        title="Users"
        description="Every student account on the marketplace."
        icon={UsersIcon}
        actions={
          <button type="button" onClick={exportCsv} disabled={!users.length} className="btn btn-secondary">
            <Download className="h-4 w-4" /> Export page
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total users" icon={UsersIcon} value={formatNumber(stats?.totalUsers)} trend={stats ? `${stats.totalGrowth >= 0 ? '+' : ''}${stats.totalGrowth}%` : null} hint="vs last month" loading={!stats} />
        <StatCard label="Active" icon={UserCheck} tone="success" value={formatNumber(stats?.activeUsers)} hint={stats ? `${stats.activePct}% of all users` : ''} loading={!stats} onClick={() => setFilter('status', 'active')} />
        <StatCard label="Suspended" icon={Ban} tone="danger" value={formatNumber(stats?.suspendedUsers)} hint={stats ? `${stats.suspendedPct}% of all users` : ''} loading={!stats} onClick={() => setFilter('status', 'suspended')} />
        <StatCard label="New in 30 days" icon={UserPlus} tone="violet" value={formatNumber(stats?.newUsers30d)} trend={stats ? `${stats.newUsersGrowth >= 0 ? '+' : ''}${stats.newUsersGrowth}%` : null} hint="vs previous 30 days" loading={!stats} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <Tabs
            value={filters.status}
            onChange={(value) => setFilter('status', value)}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:justify-end">
            <SearchInput value={searchText} onChange={setSearchText} placeholder="Name, email or user ID" className="sm:max-w-xs" />
            <Select
              label="Campus"
              value={filters.campus}
              onChange={(value) => setFilter('campus', value)}
              options={[{ value: 'all', label: 'All campuses' }, ...campuses.map((campus) => ({ value: campus.id, label: campus.name }))]}
              className="sm:w-52"
            />
            {isFiltered && (
              <button type="button" onClick={resetFilters} className="btn btn-ghost">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            )}
            <SavedViews page="users" />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton rows={8} columns={6} />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" message={isFiltered ? 'Try a different search or clear the filters.' : 'Users will appear here once students sign up.'} />
        ) : (
          <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  {canWrite && (
                    <th className="w-10">
                      <Checkbox
                        checked={selection.allSelected}
                        indeterminate={selection.someSelected}
                        onChange={selection.toggleAll}
                        label="Select all users on this page"
                      />
                    </th>
                  )}
                  <th>User</th>
                  <th>Campus</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th className="text-right">Listings</th>
                  <th>Joined</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`cursor-pointer ${selection.selected.has(user.id) ? 'bg-brand-soft' : ''}`}
                  >
                    {canWrite && (
                      <td onClick={(event) => event.stopPropagation()}>
                        <Checkbox checked={selection.selected.has(user.id)} onChange={() => selection.toggle(user.id)} label={`Select ${user.name}`} />
                      </td>
                    )}
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar} name={user.name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-fg">{user.name}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate">{user.campus?.name || <span className="text-subtle">Not assigned</span>}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td>
                      {user.role === 'support' ? (
                        <Badge tone="info"><ShieldCheck className="h-3 w-3" /> Support</Badge>
                      ) : (
                        <span className="text-muted">Student</span>
                      )}
                    </td>
                    <td className="text-right font-medium text-fg tabular-nums">{user.listings ?? 0}</td>
                    <td className="whitespace-nowrap">{formatDate(user.joined)}</td>
                    <td className="text-right" onClick={(event) => event.stopPropagation()}>
                      <RowMenu
                        user={user}
                        canWrite={canWrite}
                        canChangeRole={isAdmin}
                        onView={() => setSelectedUserId(user.id)}
                        onAction={(kind) => setConfirm({ user, kind })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pagination {...pagination} onPageChange={(page) => setFilter('page', page)} />}
      </Card>

      <UserDetailsDrawer
        userId={selectedUserId}
        version={drawerVersion}
        onClose={() => setSelectedUserId(null)}
        onRequestAction={(user, kind) => (kind === 'delete' ? setDeleting(user) : setConfirm({ user, kind }))}
      />

      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null)
          setSelectedUserId(null)
          refetch()
          refetchStats()
        }}
      />

      <BulkBar
        count={selection.count}
        noun="user"
        actions={[
          { key: 'suspended', label: 'Suspend', icon: Ban, tone: 'danger' },
          { key: 'active', label: 'Reactivate', icon: UserCheck, tone: 'secondary' },
        ]}
        onAction={setBulkStatus}
        onClear={selection.clear}
      />
      <BulkConfirmDialog
        open={Boolean(bulkStatus)}
        title={bulkStatus === 'suspended' ? 'Suspend selected users?' : 'Reactivate selected users?'}
        description={
          bulkStatus === 'suspended'
            ? `${selection.count} selected. They are signed out everywhere and their live listings are unlisted. Your own account is skipped.`
            : `${selection.count} selected. They can sign in and trade again.`
        }
        confirmLabel={bulkStatus === 'suspended' ? `Suspend ${selection.count}` : `Reactivate ${selection.count}`}
        tone={bulkStatus === 'suspended' ? 'danger' : 'primary'}
        onClose={() => setBulkStatus(null)}
        onConfirm={runBulk}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        loading={working}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.label}
        tone={confirmCopy.tone}
      />
    </div>
  )
}

export default memo(Users)
