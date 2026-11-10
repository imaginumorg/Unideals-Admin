import { memo } from 'react'
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  EyeOff,
  FileSearch,
  Flag,
  ImageOff,
  LifeBuoy,
  Mail,
  MessageSquare,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react'
import Avatar from '../../../shared/components/Avatar'
import { StatusBadge, cx, toneClass } from '../../../shared/components/ui'
import { REPORT_REASON_LABELS } from '../../../shared/constants/constants'
import { formatCurrency, formatRelative, titleCase } from '../../../shared/lib/format'
import { TYPE_META } from '../reportMeta'


// Queue priority (report-count based) plus support-ticket priorities.
const PRIORITY = {
  urgent: { label: 'Urgent', tone: 'danger' },
  high: { label: 'High priority', tone: 'danger' },
  medium: { label: 'Medium priority', tone: 'warning' },
  normal: { label: 'Normal priority', tone: 'neutral' },
  low: { label: 'Low priority', tone: 'neutral' },
}

const Pill = ({ icon: Icon, tone = 'neutral', children }) => (
  <span className={cx('inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap', toneClass(tone))}>
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {children}
  </span>
)

const longDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

const Media = ({ item }) => {
  const target = item.target
  if (target?.type === 'product') {
    return (
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-subtle">
        {target.image ? <img src={target.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageOff className="h-5 w-5" />}
      </span>
    )
  }
  if (target?.type === 'user') return <Avatar src={target.avatar} name={target.name} className="h-16 w-16 shrink-0 text-base" />
  const Icon = TYPE_META[item.targetModel]?.icon || LifeBuoy
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-2 text-muted">
      <Icon className="h-6 w-6" />
    </span>
  )
}

const Details = ({ item }) => {
  const target = item.target
  if (!target) {
    return (
      <>
        <p className="text-[15px] font-semibold text-fg">Item no longer exists</p>
        <p className="mt-1 text-[13px] text-muted">It was deleted after being reported. Resolve or dismiss to clear it from the queue.</p>
      </>
    )
  }
  if (target.type === 'product') {
    return (
      <>
        <p className="truncate text-[15px] font-semibold text-fg">{target.title}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {formatCurrency(target.price)} · {titleCase(target.category)}
          {target.seller?.name && <> · by {target.seller.name}</>}
        </p>
      </>
    )
  }
  if (target.type === 'user') {
    return (
      <>
        <p className="truncate text-[15px] font-semibold text-fg">{target.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted">{target.email}</p>
      </>
    )
  }
  return (
    <>
      <p className="truncate text-[15px] font-semibold text-fg">{target.title || 'Support request'}</p>
      <p className="mt-0.5 truncate text-[13px] text-muted">
        From {target.name}
        {target.email && <> · {target.email}</>}
        {target.reference && <> · Ref {target.reference}</>}
      </p>
      {target.description && <p className="mt-2.5 line-clamp-2 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-[13px] text-fg-2">{target.description}</p>}
    </>
  )
}

const ActionButton = ({ icon: Icon, label, onClick, variant = 'secondary', disabled, href, wide }) => {
  const className = cx(
    'btn w-full justify-center',
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'btn-secondary',
    variant === 'danger' && 'btn-danger',
    variant === 'success' && 'btn-success',
    wide && 'col-span-2',
  )
  const content = (
    <>
      <Icon className="h-4 w-4" /> {label}
    </>
  )
  return href ? (
    <a href={href} className={className}>{content}</a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  )
}

/**
 * One reported item: header strip (type, count, priority, timing), media,
 * details with status pills, and an evenly sized action grid. Actions only
 * appear when the viewer's role allows them (`perms`).
 */
const QueueItemCard = ({ item, perms, onAction, onEvidence }) => {
  const meta = TYPE_META[item.targetModel] || TYPE_META.Product
  const target = item.target
  const priority = PRIORITY[item.priority] || PRIORITY.low
  const isSupport = item.targetModel === 'Support'

  const actions = []
  if (target && item.targetModel === 'Product' && !target.is_deleted && perms.listings) {
    actions.push(
      { key: 'block', icon: Ban, label: 'Block', variant: 'danger', disabled: target.status === 'blocked' },
      { key: 'unlist', icon: EyeOff, label: 'Unlist', disabled: target.status === 'unlisted' },
      { key: 'delete', icon: Trash2, label: 'Delete', variant: 'danger' },
    )
  }
  if (target && item.targetModel === 'User' && perms.users) {
    actions.push(
      target.status === 'suspended'
        ? { key: 'activate', icon: UserCheck, label: 'Reactivate', variant: 'success' }
        : { key: 'suspend', icon: Ban, label: 'Suspend', variant: 'danger' },
    )
  }
  if (isSupport && target?.email) {
    actions.push({
      key: 'reply',
      icon: Mail,
      label: 'Reply',
      href: `mailto:${target.email}?subject=${encodeURIComponent(`Unideals Support: ${target.title || 'Your request'}`)}`,
    })
  }
  actions.push({ key: 'evidence', icon: FileSearch, label: item.hasChat ? 'Evidence · chat' : 'Evidence' })
  const closing = perms.reports
    ? [
        { key: 'dismiss', icon: XCircle, label: 'Dismiss' },
        { key: 'resolve', icon: CheckCircle2, label: 'Resolve', variant: 'primary' },
      ]
    : []

  return (
    <article className={cx('card overflow-hidden transition-colors duration-150 hover:border-line-strong', priority.tone === 'danger' && 'border-danger/30')}>
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-2.5 sm:px-5">
        <Pill icon={meta.icon}>{meta.label}</Pill>
        {!isSupport && (
          <Pill icon={Flag} tone="danger">
            {item.reportCount} report{item.reportCount === 1 ? '' : 's'}
          </Pill>
        )}
        <Pill tone={priority.tone}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> {priority.label}
        </Pill>
        {item.hasChat && <Pill icon={MessageSquare} tone="brand">Chat evidence</Pill>}
        <span className="flex w-full items-center gap-1.5 text-xs text-muted sm:ml-auto sm:w-auto">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span title={`Latest report ${new Date(item.latestReport).toLocaleString('en-IN')}`}>Latest {formatRelative(item.latestReport)}</span>
          <span className="text-subtle">•</span>
          <span title="First reported">Since {longDate(item.firstReport)}</span>
        </span>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
          <Media item={item} />
          <span className="hidden w-px self-stretch bg-line sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <Details item={item} />
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {target?.status && target.type !== 'support' && <StatusBadge status={target.status} />}
              <span className="inline-flex h-[22px] items-center rounded-md bg-danger-soft px-2 text-[11.5px] font-medium text-danger">Waiting to resolve</span>
              {!isSupport &&
                item.reasons?.map((reason) => (
                  <span key={reason} className="inline-flex h-[22px] items-center rounded-md border border-line px-2 text-[11.5px] font-medium text-fg-2">
                    {REPORT_REASON_LABELS[reason] || titleCase(reason)}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-line lg:w-[320px] lg:border-l lg:pl-6">
          {actions.map(({ key, ...action }, index) => (
            <ActionButton
              key={key}
              {...action}
              wide={actions.length % 2 === 1 && index === actions.length - 1}
              onClick={() => (key === 'evidence' ? onEvidence(item) : onAction(item, key))}
            />
          ))}
          {closing.map(({ key, ...action }) => (
            <ActionButton key={key} {...action} onClick={() => onAction(item, key)} />
          ))}
        </div>
      </div>
    </article>
  )
}

export default memo(QueueItemCard)
