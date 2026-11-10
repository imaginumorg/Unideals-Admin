/* eslint-disable react-refresh/only-export-components */
import { memo, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RefreshCw, Search, X } from 'lucide-react'
import BrandLoader from './BrandLoader'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ─── Layout ──────────────────────────────────────────────────────────── */

export const PageHeader = memo(({ title, description, icon: Icon, actions, children }) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="flex min-w-0 items-start gap-3.5">
      {Icon && (
        <span className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-brand-fg sm:flex">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold tracking-tight text-fg md:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {children}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
))

export const Card = ({ className, children, ...rest }) => (
  <section className={cx('card', className)} {...rest}>
    {children}
  </section>
)

export const CardHeader = ({ title, description, icon: Icon, actions, className }) => (
  <div className={cx('flex items-center justify-between gap-3 border-b border-line px-5 py-4', className)}>
    <div className="flex min-w-0 items-center gap-3">
      {Icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-fg">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
        {description && <p className="truncate text-xs text-muted">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
)

/* ─── Status & badges ─────────────────────────────────────────────────── */

const TONES = {
  neutral: 'bg-surface-3 text-fg-2',
  brand: 'bg-brand-soft text-brand-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  violet: 'bg-violet-soft text-violet',
  pink: 'bg-pink-soft text-pink',
}

export const toneClass = (tone = 'neutral') => TONES[tone] || TONES.neutral

export const Badge = memo(({ tone = 'neutral', dot = false, className, children }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap capitalize',
      toneClass(tone),
      className,
    )}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
))

// Single source of truth for status → tone across every entity.
export const STATUS_TONES = {
  active: 'success',
  listed: 'success',
  completed: 'success',
  action_taken: 'success',
  approved: 'success',
  sent: 'success',
  delivered: 'success',
  paid: 'success',
  payment_confirmed: 'success',
  deal_confirmed: 'info',
  inactive: 'neutral',
  draft: 'neutral',
  dismissed: 'neutral',
  cancelled: 'neutral',
  canceled: 'neutral',
  expired: 'neutral',
  sold: 'violet',
  pending: 'warning',
  scheduled: 'info',
  unlisted: 'warning',
  awaiting_payment: 'warning',
  in_progress: 'info',
  suspended: 'danger',
  blocked: 'danger',
  failed: 'danger',
  rejected: 'danger',
  disputed: 'danger',
  refunded: 'pink',
  paused: 'warning',
}

export const StatusBadge = memo(({ status, label }) => {
  const key = String(status || '').toLowerCase().replace(/[\s-]+/g, '_')
  return (
    <Badge tone={STATUS_TONES[key] || 'neutral'} dot>
      {label || key.replace(/_/g, ' ') || 'unknown'}
    </Badge>
  )
})

/* ─── Metrics ─────────────────────────────────────────────────────────── */

export const StatCard = memo(({ label, value, icon: Icon, tone = 'brand', hint, trend, onClick, loading }) => {
  const Wrapper = onClick ? 'button' : 'div'
  const trendDown = typeof trend === 'string' && trend.startsWith('-')
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'card flex w-full flex-col p-4 text-left transition',
        onClick && 'hover:border-line-strong hover:bg-surface-2/40',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {Icon && (
          <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', toneClass(tone))}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-surface-3" />
      ) : (
        <p className="mt-2 truncate text-[26px] leading-tight font-bold tracking-tight text-fg tabular-nums" title={String(value)}>{value}</p>
      )}
      {(trend || hint) && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          {trend && (
            <span className={cx('font-semibold', trendDown ? 'text-danger' : 'text-success')}>{trend}</span>
          )}
          {hint && <span className="min-w-0 truncate">{hint}</span>}
        </p>
      )}
    </Wrapper>
  )
})

/* ─── Feedback states ─────────────────────────────────────────────────── */

// Small inline loader for buttons: the Unideals "U" in the text colour.
export const Spinner = ({ className }) => <BrandLoader size="xs" tone="current" className={className} />

export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-lg bg-surface-3', className)} />

export const TableSkeleton = memo(({ rows = 6, columns = 5 }) => (
  <div className="divide-y divide-line">
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="flex items-center gap-4 px-4 py-4">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        {Array.from({ length: columns - 1 }).map((__, col) => (
          <Skeleton key={col} className={cx('h-3.5', col === 0 ? 'w-1/4' : 'flex-1')} />
        ))}
      </div>
    ))}
  </div>
))

export const EmptyState = memo(({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, className }) => (
  <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-muted">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-4 text-sm font-semibold text-fg">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
))

export const ErrorState = memo(({ message, onRetry, className }) => (
  <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
      <AlertTriangle className="h-5 w-5" />
    </span>
    <p className="mt-4 text-sm font-semibold text-fg">Couldn't load this data</p>
    <p className="mt-1 max-w-sm text-sm text-muted">{message || 'The server did not respond. Check the API and try again.'}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm mt-4">
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    )}
  </div>
))

export const InlineAlert = ({ tone = 'danger', children, className }) => (
  <div className={cx('flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm', toneClass(tone), className)}>
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="min-w-0">{children}</div>
  </div>
)

/* ─── Inputs & toolbar ────────────────────────────────────────────────── */

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className, inputRef }) => (
  <div className={cx('relative w-full', className)}>
    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-subtle" />
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="input pr-9 pl-10"
    />
    {value && (
      <button
        type="button"
        aria-label="Clear search"
        onClick={() => onChange('')}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-subtle hover:text-fg"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
)

export const Select = ({ value, onChange, options, className, label, ...rest }) => (
  <select
    aria-label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={cx('select', className)}
    {...rest}
  >
    {options.map((option) => {
      const item = typeof option === 'string' ? { value: option, label: option } : option
      return (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      )
    })}
  </select>
)

export const Field = ({ label, hint, error, children, className }) => {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

export const Tabs = ({ tabs, value, onChange, className }) => (
  <div className={cx('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1 no-scrollbar', className)}>
    {tabs.map((tab) => {
      const active = tab.value === value
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cx(
            'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold whitespace-nowrap transition',
            active ? 'bg-surface-3 text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {tab.label}
          {tab.count !== undefined && tab.count !== null && (
            <span className={cx('rounded-md px-1.5 text-[11px] tabular-nums', active ? 'bg-brand text-white' : 'bg-surface-2 text-muted')}>
              {tab.count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

export const Toggle = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50',
      checked ? 'bg-brand' : 'bg-surface-3',
    )}
  >
    <span className={cx('h-4 w-4 rounded-full bg-white shadow transition', checked ? 'translate-x-4.5' : 'translate-x-0.5')} />
  </button>
)

/* ─── Pagination ──────────────────────────────────────────────────────── */

export const Pagination = memo(({ page = 1, totalPages = 1, total, limit, onPageChange }) => {
  if (!total && totalPages <= 1) return null
  const from = total ? (page - 1) * (limit || 0) + 1 : null
  const to = total && limit ? Math.min(page * limit, total) : null
  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>
        {from && to ? (
          <>
            Showing <b className="font-semibold text-fg-2">{from}–{to}</b> of{' '}
            <b className="font-semibold text-fg-2">{total.toLocaleString()}</b>
          </>
        ) : (
          <>Page {page} of {totalPages}</>
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn btn-secondary btn-sm btn-icon h-8 w-8"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-16 text-center font-semibold text-fg-2 tabular-nums">
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn btn-secondary btn-sm btn-icon h-8 w-8"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})

/* ─── Overlays ────────────────────────────────────────────────────────── */

const useEscape = (open, onClose) => {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])
}

export const Dialog = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  const titleId = useId()
  useEscape(open, onClose)
  if (!open) return null
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-overlay backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('pop animate-pop-in relative flex max-h-[92dvh] w-full flex-col rounded-b-none sm:rounded-2xl', width)}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon -mt-1 -mr-2 h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
  onClose,
  onConfirm,
  children,
}) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    title={title}
    description={description}
    size="sm"
    footer={
      <>
        <button type="button" onClick={onClose} disabled={loading} className="btn btn-secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cx('btn', tone === 'danger' ? 'bg-danger text-white hover:brightness-110' : 'btn-primary')}
        >
          {loading && <Spinner />}
          {confirmLabel}
        </button>
      </>
    }
  >
    {children}
  </Dialog>
)

export const Drawer = ({ open, onClose, title, subtitle, children, footer, width = 'max-w-xl' }) => {
  const titleId = useId()
  const panelRef = useRef(null)
  useEscape(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-overlay backdrop-blur-[2px]" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('animate-slide-in relative flex h-full w-full flex-col border-l border-line bg-surface', width)}
        style={{ boxShadow: 'var(--shadow-pop)' }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-semibold text-fg">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon -mr-2 h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}

/* ─── Data display ────────────────────────────────────────────────────── */

export const DetailList = ({ items, columns = 2 }) => (
  <dl className={cx('grid gap-x-6 gap-y-4', columns === 2 ? 'sm:grid-cols-2' : '')}>
    {items
      .filter(Boolean)
      .map((item) => (
        <div key={item.label} className={cx('min-w-0', item.full && 'sm:col-span-2')}>
          <dt className="text-xs font-medium text-muted">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium break-words text-fg">{item.value ?? '—'}</dd>
        </div>
      ))}
  </dl>
)

export const Section = ({ title, actions, children, className }) => (
  <div className={cx('space-y-3', className)}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="eyebrow">{title}</h3>
      {actions}
    </div>
    {children}
  </div>
)
