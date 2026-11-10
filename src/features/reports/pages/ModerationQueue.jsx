import { memo, useCallback, useState } from 'react'
import { Ban, FileSearch, CheckCircle2, EyeOff, Flag, ImageOff, LifeBuoy, Mail, Package, ShieldAlert, ShieldCheck, Trash2, User, UserCheck, XCircle } from 'lucide-react'
import { moderationApi } from '../api/moderationApi'
import { productsApi } from '../../products/api/productsApi'
import { usersApi } from '../../users/api/usersApi'
import { useAuth } from '../../auth/context/AuthContext'
import { useToast } from '../../../shared/components/ToastContext'
import { useAttention } from '../../../layouts/AttentionContext'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useListFilters } from '../../../shared/hooks/useListFilters'
import { REPORT_REASON_LABELS } from '../../../shared/constants/constants'
import Avatar from '../../../shared/components/Avatar'
import ReportEvidenceDrawer from '../components/ReportEvidenceDrawer'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  InlineAlert,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
  Tabs,
  cx,
} from '../../../shared/components/ui'
import { formatCurrency, formatRelative, titleCase } from '../../../shared/lib/format'

const PRIORITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral' }
const TYPE_META = {
  Product: { label: 'Listing', icon: Package },
  User: { label: 'User', icon: User },
  Support: { label: 'Help & support', icon: LifeBuoy },
}

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

const Target = ({ item }) => {
  const target = item.target
  if (!target) return <p className="text-sm text-muted italic">This item no longer exists.</p>

  if (target.type === 'product') {
    return (
      <div className="flex gap-3.5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-subtle">
          {target.image ? <img src={target.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-fg">{target.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatCurrency(target.price)} · {titleCase(target.category)}
            {target.seller?.name && <> · by {target.seller.name}</>}
          </p>
          <div className="mt-1.5"><StatusBadge status={target.status} /></div>
        </div>
      </div>
    )
  }

  if (target.type === 'user') {
    return (
      <div className="flex items-center gap-3.5">
        <Avatar src={target.avatar} name={target.name} className="h-12 w-12 text-sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-fg">{target.name}</p>
          <p className="truncate text-xs text-muted">{target.email}</p>
          <div className="mt-1.5"><StatusBadge status={target.status} /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <p className="font-semibold text-fg">{target.title || 'Support request'}</p>
      <p className="mt-0.5 text-xs text-muted">From {target.name} {target.email && <>({target.email})</>}</p>
      {target.description && <p className="mt-2 line-clamp-3 rounded-lg bg-surface-2 p-3 text-sm text-fg-2">{target.description}</p>}
      {target.reference && <p className="mt-1.5 font-mono text-xs text-brand-fg">Ref: {target.reference}</p>}
    </div>
  )
}

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
  const { canWrite } = useAuth()
  const { showToast } = useToast()
  const { refresh: refreshAttention } = useAttention()
  const { filters, setFilter } = useListFilters({ type: 'all' })
  const [pending, setPending] = useState(null) // { item, action }
  const [note, setNote] = useState('')
  const [working, setWorking] = useState(false)

  const load = useCallback(
    () => moderationApi.getQueue({ target_model: filters.type === 'all' ? '' : filters.type, page: filters.page }),
    [filters.type, filters.page],
  )
  const { data, pagination, loading, refreshing, error, refetch } = useFetch(load)
  const items = data || []

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
    refreshAttention()
  }

  const open = (item, action) => setPending({ item, action })
  const [evidenceItem, setEvidenceItem] = useState(null)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Grouped by item, most-reported first. Resolving or enforcing closes every open report on that item."
        icon={ShieldAlert}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filters.type}
          onChange={(value) => setFilter('type', value)}
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'Product', label: 'Listings' },
            { value: 'User', label: 'Users' },
            { value: 'Support', label: 'Help & support' },
          ]}
        />
        {pagination?.total !== undefined && <p className="text-sm text-muted">{pagination.total} items waiting</p>}
      </div>

      {!canWrite && (
        <InlineAlert tone="info" className="mb-4">
          As support staff you can resolve or dismiss reports. Blocking listings and suspending users needs a Super Admin.
        </InlineAlert>
      )}

      {loading && !data ? (
        <QueueSkeleton />
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={refetch} /></Card>
      ) : items.length === 0 ? (
        <Card><EmptyState icon={ShieldCheck} title="Queue is clear" message="No open reports right now. New reports from students will show up here." /></Card>
      ) : (
        <div className={cx('space-y-4 transition-opacity', refreshing && 'opacity-60')}>
          {items.map((item) => {
            const meta = TYPE_META[item.targetModel] || TYPE_META.Product
            const TypeIcon = meta.icon
            const target = item.target
            return (
              <Card key={`${item.targetModel}-${item.targetId}`} className={cx('overflow-hidden', item.priority === 'high' && 'border-danger/40')}>
                <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
                  <Badge tone={PRIORITY_TONE[item.priority] || 'neutral'} dot>{item.priority || 'low'} priority</Badge>
                  <Badge><TypeIcon className="h-3 w-3" /> {meta.label}</Badge>
                  <span className="flex items-center gap-1 text-xs font-semibold text-danger">
                    <Flag className="h-3.5 w-3.5" /> {item.reportCount} report{item.reportCount === 1 ? '' : 's'}
                  </span>
                  <span className="ml-auto text-xs text-subtle">
                    First {formatRelative(item.firstReport)} · latest {formatRelative(item.latestReport)}
                  </span>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-3">
                    <Target item={item} />
                    {item.targetModel !== 'Support' && item.reasons?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.reasons.map((reason) => (
                          <Badge key={reason} tone="danger">{REPORT_REASON_LABELS[reason] || titleCase(reason)}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap content-start gap-2 lg:w-64 lg:justify-end">
                    {canWrite && target && item.targetModel === 'Product' && !target.is_deleted && (
                      <>
                        <button type="button" disabled={target.status === 'blocked'} onClick={() => open(item, 'block')} className="btn btn-danger btn-sm">
                          <Ban className="h-3.5 w-3.5" /> Block
                        </button>
                        <button type="button" disabled={target.status === 'unlisted'} onClick={() => open(item, 'unlist')} className="btn btn-secondary btn-sm">
                          <EyeOff className="h-3.5 w-3.5" /> Unlist
                        </button>
                        <button type="button" onClick={() => open(item, 'delete')} className="btn btn-ghost btn-sm text-danger">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </>
                    )}
                    {canWrite && target && item.targetModel === 'User' && (
                      target.status === 'suspended' ? (
                        <button type="button" onClick={() => open(item, 'activate')} className="btn btn-success btn-sm">
                          <UserCheck className="h-3.5 w-3.5" /> Reactivate
                        </button>
                      ) : (
                        <button type="button" onClick={() => open(item, 'suspend')} className="btn btn-danger btn-sm">
                          <Ban className="h-3.5 w-3.5" /> Suspend
                        </button>
                      )
                    )}
                    {item.targetModel === 'Support' && target?.email && (
                      <a
                        href={`mailto:${target.email}?subject=${encodeURIComponent(`Unideals Support: ${target.title || 'Your request'}`)}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Mail className="h-3.5 w-3.5" /> Reply
                      </a>
                    )}
                    <button type="button" onClick={() => setEvidenceItem(item)} className="btn btn-secondary btn-sm">
                      <FileSearch className="h-3.5 w-3.5" /> Evidence
                      {item.hasChat && <span className="rounded bg-brand-soft px-1 text-[10px] text-brand-fg">chat</span>}
                    </button>
                    <div className="hidden basis-full lg:block" />
                    <button type="button" onClick={() => open(item, 'resolve')} className="btn btn-primary btn-sm">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                    </button>
                    <button type="button" onClick={() => open(item, 'dismiss')} className="btn btn-secondary btn-sm">
                      <XCircle className="h-3.5 w-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
          {pagination && (
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
