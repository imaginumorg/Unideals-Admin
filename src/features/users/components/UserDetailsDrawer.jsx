import { memo, useCallback } from 'react'
import { Ban, Building2, CalendarDays, Clock, Flag, Mail, Package, Phone, ShieldCheck, Trophy, UserCheck } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { usersApi } from '../api/usersApi'
import Avatar from '../../../shared/components/Avatar'
import { Badge, Drawer, ErrorState, Section, Skeleton, StatusBadge } from '../../../shared/components/ui'
import { formatCurrency, formatDate, formatDateTime, titleCase } from '../../../shared/lib/format'

const Body = ({ userId, version, onRequestAction }) => {
  const { canWrite } = useAuth()
  // `version` changes after an action so the drawer shows fresh data.
  const load = useCallback(() => usersApi.getUserDetails(userId), [userId, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: user, loading, error, refetch } = useFetch(load)

  if (loading && !user) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (error && !user) return <ErrorState message={error} onRetry={refetch} />

  const contact = [
    { icon: Mail, value: user.email },
    { icon: Phone, value: user.mobile || 'No mobile' },
    { icon: Building2, value: user.campus?.name || 'No campus' },
    { icon: CalendarDays, value: `Joined ${formatDate(user.joinedAt)}` },
    { icon: Clock, value: user.lastLoginAt ? `Last seen ${formatDateTime(user.lastLoginAt)}` : 'Never signed in' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatar} name={user.name} className="h-16 w-16 text-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-fg">{user.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <StatusBadge status={user.status} />
            {user.role === 'support' && <Badge tone="info"><ShieldCheck className="h-3 w-3" /> Support</Badge>}
            {user.subscription && <Badge tone="brand">{titleCase(user.subscription)}</Badge>}
            {user.gender && <Badge>{titleCase(user.gender)}</Badge>}
          </div>
          <p className="mt-2 font-mono text-[11px] text-subtle">{user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: 'Listings', value: user.listingsCount ?? 0 },
          { icon: Flag, label: 'Reports', value: user.reportCount ?? 0, danger: user.reportCount > 0 },
          { icon: Trophy, label: `Level ${user.gamification?.level ?? 1}`, value: `${user.gamification?.total_xp ?? 0} XP` },
        ].map(({ icon: Icon, label, value, danger }) => (
          <div key={label} className="rounded-xl border border-line bg-surface-2/50 p-3">
            <Icon className={`h-4 w-4 ${danger ? 'text-danger' : 'text-muted'}`} />
            <p className={`mt-2 text-lg font-semibold tabular-nums ${danger ? 'text-danger' : 'text-fg'}`}>{value}</p>
            <p className="text-[11px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <Section title="Contact">
        <ul className="space-y-2.5">
          {contact.map(({ icon: Icon, value }) => (
            <li key={value} className="flex items-center gap-3 text-sm text-fg-2">
              <Icon className="h-4 w-4 shrink-0 text-subtle" />
              <span className="truncate">{value}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Recent listings">
        {user.recentProducts?.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {user.recentProducts.map((product) => (
              <li key={product.id} className="flex items-center gap-3 p-3">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                  {product.image && <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{product.title}</p>
                  <p className="text-xs text-muted">{formatCurrency(product.price)} · {formatDate(product.createdAt)}</p>
                </div>
                <StatusBadge status={product.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">No listings yet</p>
        )}
      </Section>

      {canWrite && (
        <Section title="Account actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => onRequestAction(user, 'role')} className="btn btn-secondary">
              <ShieldCheck className="h-4 w-4" /> {user.role === 'support' ? 'Remove support access' : 'Make support staff'}
            </button>
            <button
              type="button"
              onClick={() => onRequestAction(user, 'status')}
              className={user.status === 'suspended' ? 'btn btn-success' : 'btn btn-danger'}
            >
              {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              {user.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
            </button>
          </div>
        </Section>
      )}
    </div>
  )
}

const UserDetailsDrawer = ({ userId, version = 0, onClose, onRequestAction }) => (
  <Drawer open={Boolean(userId)} onClose={onClose} title="User details" subtitle="Profile, activity and account controls">
    {userId && <Body key={userId} userId={userId} version={version} onRequestAction={onRequestAction} />}
  </Drawer>
)

export default memo(UserDetailsDrawer)
