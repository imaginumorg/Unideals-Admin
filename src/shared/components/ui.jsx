/* eslint-disable react-refresh/only-export-components */
import { memo, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Inbox, RefreshCw, Search, X } from 'lucide-react'
import BrandLoader from './BrandLoader'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ─── Layout ──────────────────────────────────────────────────────────── */

/**
 * Page title block. The `icon` prop is accepted for compatibility but not
 * rendered: the breadcrumb already says where you are, and an icon tile per
 * page read as template chrome.
 */
export const PageHeader = memo(({ title, description, actions, children, icon: Icon, iconTile = false }) => (
  <div className={cx('mb-7 flex flex-col gap-4 md:flex-row md:justify-between', iconTile ? 'md:items-center' : 'md:items-end')}>
    <div className="flex min-w-0 items-center gap-4">
      {/* Opt-in icon tile (e.g. Reports); other pages keep the plain title. */}
      {iconTile && Icon && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand-soft text-brand-fg">
          <Icon className="h-[22px] w-[22px]" />
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-xl leading-7 font-semibold tracking-[-0.02em] text-fg md:text-[22px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted">{description}</p>}
        {children}
      </div>
    </div>
    {/* Buttons keep their row; the title/description wraps instead. */}
    {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">{actions}</div>}
  </div>
))

export const Card = ({ className, children, ...rest }) => (
  <section className={cx('card', className)} {...rest}>
    {children}
  </section>
)

export const CardHeader = ({ title, description, icon: Icon, actions, className }) => (
  <div className={cx('flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-5 py-3', className)}>
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-subtle" />}
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-fg">{title}</h2>
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
      'inline-flex h-[22px] items-center gap-1.5 rounded-md px-2 text-[11.5px] leading-none font-medium whitespace-nowrap capitalize',
      toneClass(tone),
      className,
    )}
  >
    {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
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

/**
 * KPI tile: label, one big number, a small trend/hint line. The icon is a
 * quiet glyph in the tone color (no tinted tile) so the number leads.
 */
export const StatCard = memo(({ label, value, icon: Icon, tone = 'brand', hint, trend, onClick, to, spark, active, loading }) => {
  const interactive = Boolean(onClick || to)
  const Wrapper = to ? Link : onClick ? 'button' : 'div'
  const trendDown = typeof trend === 'string' && trend.startsWith('-')
  // "0%" / "+0%" is no change: show it neutral, without an arrow.
  const trendFlat = typeof trend === 'string' && /^[+-]?0(\.0+)?%?$/.test(trend)
  const TrendIcon = trendDown ? ArrowDownRight : ArrowUpRight
  const iconColor = {
    brand: 'text-brand-fg',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
    violet: 'text-violet',
    pink: 'text-pink',
    neutral: 'text-subtle',
  }[tone] || 'text-subtle'
  return (
    <Wrapper
      type={onClick && !to ? 'button' : undefined}
      to={to}
      onClick={onClick}
      aria-pressed={onClick && !to && active !== undefined ? active : undefined}
      className={cx(
        'card group flex w-full min-w-0 flex-col px-4 py-3.5 text-left sm:px-5 sm:py-4',
        interactive &&
          'transition-[border-color,background-color,transform] duration-150 hover:border-line-strong hover:bg-surface-2/50 active:scale-[0.995]',
        active && 'border-line-strong bg-surface-2/60 ring-1 ring-brand/40',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[13px] font-medium text-muted">{label}</p>
        {Icon && <Icon className={cx('h-4 w-4 shrink-0 opacity-80', iconColor)} />}
        {to && !Icon && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-7 w-24 rounded-md" />
      ) : (
        <p className="mt-2 truncate text-[26px] leading-8 font-semibold tracking-[-0.025em] text-fg tabular-nums" title={String(value)}>
          {value}
        </p>
      )}
      {(trend || hint) && (
        <p className="mt-2 flex min-w-0 items-center gap-2 text-xs text-muted">
          {trend && (
            <span
              className={cx(
                'inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-px font-medium tabular-nums',
                trendFlat ? 'bg-surface-3 text-muted' : trendDown ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success',
              )}
            >
              {!trendFlat && <TrendIcon className="h-3 w-3" />}
              {trend.replace(/^[+-]/, '')}
            </span>
          )}
          {hint && <span className="min-w-0 truncate">{hint}</span>}
        </p>
      )}
      {spark && <div className="mt-2.5">{loading ? <div className="skeleton h-[34px] w-full rounded-md" /> : spark}</div>}
    </Wrapper>
  )
})

/* ─── Feedback states ─────────────────────────────────────────────────── */

// Small inline loader for buttons: the Unideals "U" in the text colour.
export const Spinner = ({ className }) => <BrandLoader size="xs" tone="current" className={className} />

export const Skeleton = ({ className, style }) => <div className={cx('skeleton rounded-md', className)} style={style} />

export const TableSkeleton = memo(({ rows = 6, columns = 5 }) => (
  <div aria-busy="true" aria-label="Loading">
    <div className="h-9 border-b border-line" />
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="flex items-center gap-5 border-b border-line px-5 py-3.5 last:border-b-0">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        {Array.from({ length: columns - 1 }).map((__, col) => (
          <Skeleton key={col} className={cx('h-3', col === 0 ? 'w-1/4' : 'flex-1', col % 2 && 'opacity-70')} />
        ))}
      </div>
    ))}
  </div>
))

export const EmptyState = memo(({ icon: Icon = Inbox, title = 'Nothing here yet', message, action, className }) => (
  <div className={cx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted" style={{ boxShadow: 'var(--shadow-button)' }}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
    <p className="mt-4 text-sm font-medium text-fg">{title}</p>
    {message && <p className="mt-1 max-w-sm text-[13px] leading-5 text-muted">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
))

export const ErrorState = memo(({ message, onRetry, className }) => (
  <div className={cx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
      <AlertTriangle className="h-[18px] w-[18px]" />
    </span>
    <p className="mt-4 text-sm font-medium text-fg">Couldn't load this data</p>
    <p className="mt-1 max-w-sm text-[13px] leading-5 text-muted">{message || 'The server did not respond. Check the API and try again.'}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm mt-5">
        <RefreshCw className="h-3.5 w-3.5" /> Try again
      </button>
    )}
  </div>
))

export const InlineAlert = ({ tone = 'danger', children, className }) => (
  <div className={cx('flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] leading-5', toneClass(tone), className)}>
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="min-w-0">{children}</div>
  </div>
)

/* ─── Inputs & toolbar ────────────────────────────────────────────────── */

export const SearchInput = ({ value, onChange, placeholder = 'Search…', className, inputRef }) => (
  <div className={cx('relative w-full', className)}>
    <Search className="pointer-events-none absolute top-1/2 left-3 h-[15px] w-[15px] -translate-y-1/2 text-subtle" />
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="input pr-8 pl-9"
    />
    {value && (
      <button
        type="button"
        aria-label="Clear search"
        onClick={() => onChange('')}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-subtle transition-colors hover:bg-surface-3 hover:text-fg"
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
        <span className="mt-1.5 block text-xs text-subtle">{hint}</span>
      ) : null}
    </label>
  )
}

/** Segmented control. */
export const Tabs = ({ tabs, value, onChange, className }) => (
  <div
    role="tablist"
    className={cx('inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-line bg-surface-2/70 p-0.5 no-scrollbar', className)}
  >
    {tabs.map((tab) => {
      const active = tab.value === value
      return (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(tab.value)}
          className={cx(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150',
            active ? 'bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.25)] ring-1 ring-line' : 'text-muted hover:text-fg',
          )}
        >
          {tab.label}
          {tab.count !== undefined && tab.count !== null && (
            <span className={cx('min-w-[18px] rounded px-1 text-center text-[11px] tabular-nums', active ? 'bg-brand-soft text-brand-fg' : 'text-subtle')}>
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
      'relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors duration-150 disabled:opacity-50',
      checked ? 'border-brand bg-brand' : 'border-line-strong bg-surface-3',
    )}
  >
    <span
      className={cx(
        'h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
        checked ? 'translate-x-[14px]' : 'translate-x-[1px]',
      )}
    />
  </button>
)

/* ─── Pagination ──────────────────────────────────────────────────────── */

export const Pagination = memo(({ page = 1, totalPages = 1, total, limit, onPageChange }) => {
  if (!total && totalPages <= 1) return null
  const from = total ? (page - 1) * (limit || 0) + 1 : null
  const to = total && limit ? Math.min(page * limit, total) : null
  return (
    <div className="flex flex-col gap-3 border-t border-line px-5 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <span className="tabular-nums">
        {from && to ? (
          <>
            <span className="text-fg-2">{from}–{to}</span> of <span className="text-fg-2">{total.toLocaleString()}</span>
          </>
        ) : (
          <>Page {page} of {totalPages}</>
        )}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn btn-secondary btn-sm h-7 w-7 px-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-14 text-center font-medium text-fg-2 tabular-nums">
          {page} <span className="text-subtle">/</span> {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn btn-secondary btn-sm h-7 w-7 px-0"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
})

/* ─── Overlays ────────────────────────────────────────────────────────── */

const EXIT_MS = 180

/**
 * Keeps an overlay mounted for its exit animation. Returns `mounted` (render
 * or not) and `state` ('open' | 'closed') for the data-state CSS hooks.
 */
export const usePresence = (open, duration = EXIT_MS) => {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open) return undefined
    const timer = window.setTimeout(() => setMounted(false), duration)
    return () => window.clearTimeout(timer)
  }, [open, duration])
  return { mounted: open || mounted, state: open ? 'open' : 'closed' }
}

/**
 * While an overlay animates out, its owner has usually already cleared the
 * data it renders (e.g. `selectedId = null`). Keep showing the last content
 * from while it was open so the panel doesn't go blank as it leaves.
 */
const useLastWhileOpen = (open, value) => {
  const ref = useRef(value)
  // eslint-disable-next-line react-hooks/refs
  if (open) ref.current = value
  // eslint-disable-next-line react-hooks/refs
  return open ? value : ref.current
}

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
  const { mounted, state } = usePresence(open)
  const content = useLastWhileOpen(open, { title, description, children, footer })
  if (!mounted) return null
  const width = { sm: 'sm:max-w-[420px]', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size]
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={open ? onClose : undefined}
        data-presence="overlay"
        data-state={state}
        className="absolute inset-0 bg-overlay backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-presence="dialog"
        data-state={state}
        className={cx('pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-b-none sm:rounded-[14px]', width)}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] leading-6 font-semibold text-fg">{content.title}</h2>
            {content.description && <p className="mt-1 text-[13px] leading-5 text-muted">{content.description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost -mt-1 -mr-2 h-7 w-7 px-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{content.children}</div>
        {content.footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/40 px-5 py-3">{content.footer}</div>
        )}
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
          className={cx(
            'btn',
            tone === 'danger' ? 'bg-danger text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-110' : 'btn-primary',
          )}
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
  useEscape(open, onClose)
  const { mounted, state } = usePresence(open, 200)
  const content = useLastWhileOpen(open, { title, subtitle, children, footer })
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={open ? onClose : undefined}
        data-presence="overlay"
        data-state={state}
        className="absolute inset-0 bg-overlay backdrop-blur-[3px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-presence="drawer"
        data-state={state}
        className={cx('relative flex h-full w-full flex-col border-l border-line bg-surface', width)}
        style={{ boxShadow: 'var(--shadow-pop)' }}
      >
        <header className="flex min-h-[60px] items-center justify-between gap-4 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-[15px] font-semibold text-fg">{content.title}</h2>
            {content.subtitle && <p className="mt-0.5 truncate text-xs text-muted">{content.subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost -mr-2 h-7 w-7 px-0">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{content.children}</div>
        {content.footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/40 px-5 py-3">{content.footer}</footer>
        )}
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
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="mt-1 text-[13px] font-medium break-words text-fg">{item.value ?? '—'}</dd>
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
