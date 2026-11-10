import { memo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Ban,
  Cpu,
  EyeOff,
  Building2,
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
import { Card, CardHeader, EmptyState, ErrorState, Skeleton, StatCard, cx, toneClass } from '../../../shared/components/ui'
import { formatCurrency, formatNumber } from '../../../shared/lib/format'

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const Dashboard = () => {
  const { admin } = useAuth()
  const { data, loading, error, refetch } = useFetch(dashboardApi.getDashboard)
  const stats = data?.stats || {}
  const mtd = stats.monthToDate || {}
  const recent = data?.recentActivity || []
  const campuses = stats.usersByCampus || []
  const firstName = admin?.name?.trim().split(' ')[0] || 'there'
  const isLoading = loading && !data

  if (error && !data) {
    return (
      <Card>
        <ErrorState message={error} onRetry={refetch} />
      </Card>
    )
  }

  const queue = [
    {
      label: 'Pending reports',
      count: stats.pendingReports,
      to: '/moderation',
      icon: ShieldAlert,
      tone: 'danger',
      hint: 'Listings and users flagged by students',
    },
    {
      label: 'Gender change requests',
      count: stats.pendingGenderRequests,
      to: '/gender-requests',
      icon: UserCog,
      tone: 'pink',
      hint: 'Girls Corner access needs approval',
    },
    {
      label: 'Auto-hidden listings',
      count: stats.autoHiddenListings,
      to: '/products?status=review',
      icon: EyeOff,
      tone: 'warning',
      hint: 'Hidden by 5+ reports, awaiting review',
    },
    {
      label: 'Failing background jobs',
      count: stats.failingJobs,
      to: '/system/jobs',
      icon: Cpu,
      tone: 'danger',
      hint: 'Latest scheduled run failed',
    },
    {
      label: 'Suspended accounts',
      count: stats.suspendedUsers,
      to: '/users?status=suspended',
      icon: Ban,
      tone: 'warning',
      hint: 'Review for reinstatement',
    },
    {
      label: 'Blocked listings',
      count: stats.blockedProducts,
      to: '/products?status=blocked',
      icon: Package,
      tone: 'neutral',
      hint: 'Hidden from the marketplace',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg md:text-[28px]">
            {greeting()}, {firstName}
          </h1>
        </div>
        <button type="button" onClick={refetch} className="btn btn-secondary btn-sm self-start sm:self-auto">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* Trends compare month-to-date with the same days last month. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total users" icon={Users} value={formatNumber(stats.totalUsers)} trend={stats.trends?.users} hint={`${formatNumber(mtd.newUsers)} new this month`} loading={isLoading} />
        <StatCard label="Live listings" icon={Package} tone="success" value={formatNumber(stats.listedProducts)} trend={stats.trends?.products} hint={`${formatNumber(mtd.newListings)} posted this month`} loading={isLoading} />
        <StatCard label="Completed deals" icon={ShoppingBag} tone="violet" value={formatNumber(stats.completedDeals)} trend={stats.trends?.orders} hint={`${formatNumber(mtd.completedDeals)} this month`} loading={isLoading} />
        <StatCard label="Deal volume (GMV)" icon={Handshake} tone="info" value={formatCurrency(stats.dealVolume)} trend={stats.trends?.dealVolume} hint={`${formatCurrency(mtd.dealVolume)} this month`} loading={isLoading} />
        <StatCard label="Platform revenue" icon={IndianRupee} tone="warning" value={formatCurrency(stats.platformRevenue)} trend={stats.trends?.revenue} hint={`${formatCurrency(mtd.platformRevenue)} this month · plans & boosts`} loading={isLoading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Needs attention" description="Work queues waiting on staff" icon={ShieldAlert} />
          <div className="grid gap-px overflow-hidden rounded-b-2xl bg-line sm:grid-cols-2">
            {queue.map(({ label, count, to, icon: Icon, tone, hint }) => (
              <Link key={label} to={to} className="group flex items-center gap-4 bg-surface p-5 transition hover:bg-surface-2/60">
                <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', toneClass(count ? tone : 'neutral'))}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  {isLoading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold text-fg tabular-nums">{formatNumber(count)}</p>}
                  <p className="truncate text-[13px] font-medium text-fg-2">{label}</p>
                  <p className="truncate text-xs text-subtle">{hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-fg" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Users by campus"
            description={`${formatNumber(stats.activeCampuses)} active campuses`}
            icon={Building2}
            actions={
              <Link to="/campuses" className="text-xs font-semibold text-brand-fg hover:underline">
                Manage
              </Link>
            }
          />
          <div className="space-y-4 p-5">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-6 w-full" />)}
            {!isLoading && campuses.length === 0 && (
              <EmptyState icon={Building2} title="No campus data yet" message="Distribution appears once students pick a campus." className="py-6" />
            )}
            {campuses.map((campus) => (
              <div key={campus.name}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate font-medium text-fg-2" title={campus.name}>{campus.name}</span>
                  <span className="shrink-0 text-muted tabular-nums">
                    {formatNumber(campus.count)} <span className="text-subtle">· {campus.percentage ?? 0}%</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${campus.percentage ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
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

        <Card className="xl:col-span-2">
          <CardHeader title="Account health" icon={Users} />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-line">
            {[
              { label: 'Active', value: stats.activeUsers, tone: 'text-success' },
              { label: 'Inactive', value: stats.inactiveUsers, tone: 'text-fg' },
              { label: 'Suspended', value: stats.suspendedUsers, tone: stats.suspendedUsers ? 'text-danger' : 'text-fg' },
              { label: 'Active campuses', value: stats.activeCampuses, tone: 'text-fg' },
            ].map((item) => (
              <div key={item.label} className="bg-surface p-5">
                <dt className="text-xs font-medium text-muted">{item.label}</dt>
                <dd className={cx('mt-1 text-2xl font-bold tabular-nums', item.tone)}>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : formatNumber(item.value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  )
}

export default memo(Dashboard)
