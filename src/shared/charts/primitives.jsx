/* eslint-disable react-refresh/only-export-components */
import { BarChart3, Download } from 'lucide-react'
import { Card, CardHeader, EmptyState, ErrorState, STATUS_TONES, Skeleton, cx } from '../components/ui'

/* ─── Colour roles ─────────────────────────────────────────────────────────
 * Categorical slots come from index.css (--c-cat-*), validated for colour-
 * blind separation and contrast in both themes. Status distributions reuse
 * the same tones as the status badges, so "blocked" is the same red in the
 * table and the chart. */
export const CATEGORICAL = Array.from({ length: 6 }, (_, i) => `var(--c-cat-${i + 1})`)
export const categorical = (index) => CATEGORICAL[index % CATEGORICAL.length]

const TONE_COLOR = {
  success: 'var(--c-success)',
  warning: 'var(--c-warning)',
  danger: 'var(--c-danger)',
  info: 'var(--c-info)',
  violet: 'var(--c-violet)',
  pink: 'var(--c-pink)',
  brand: 'var(--c-chart-1)',
  neutral: 'var(--c-muted)',
}
export const toneColor = (tone) => TONE_COLOR[tone] || TONE_COLOR.neutral
export const statusColor = (status) => toneColor(STATUS_TONES[status])

export const AXIS = {
  tick: { fill: 'var(--c-subtle)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
}

const compactFormatter = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })
export const compact = (value) => (Number.isFinite(Number(value)) ? compactFormatter.format(Number(value)) : '')

export const reducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/* ─── Card shell with loading / error / empty states ──────────────────── */

export const ChartCard = ({
  title,
  description,
  actions,
  loading,
  error,
  onRetry,
  empty,
  emptyTitle = 'No data for this range',
  emptyMessage,
  onExport,
  refreshing,
  height = 240,
  className,
  bodyClassName,
  footer,
  children,
}) => (
  <Card className={cx('flex min-w-0 flex-col overflow-hidden', className)}>
    <CardHeader
      title={title}
      description={description}
      actions={
        (actions || onExport) && (
          <>
            {actions}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                disabled={loading || empty || Boolean(error)}
                className="btn btn-ghost btn-sm h-7 w-7 px-0"
                aria-label={`Export ${title} as CSV`}
                title="Export CSV"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )
      }
    />
    <div className={cx('chart relative min-w-0 flex-1 p-4 transition-opacity duration-200 sm:p-5', refreshing && !loading && 'opacity-60', bodyClassName)}>
      {loading ? (
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} className="py-8" />
      ) : empty ? (
        <EmptyState icon={BarChart3} title={emptyTitle} message={emptyMessage} className="py-8" />
      ) : (
        children
      )}
    </div>
    {footer}
  </Card>
)

/* ─── Tooltip box ──────────────────────────────────────────────────────── */

export const TooltipBox = ({ title, subtitle, rows, footer }) => (
  <div className="pop min-w-[170px] px-3 py-2.5 text-xs" role="status">
    {title && <p className="font-semibold text-fg">{title}</p>}
    {subtitle && <p className="text-[11px] text-subtle">{subtitle}</p>}
    {rows?.length > 0 && (
      <div className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 text-fg-2">
            {row.color && (
              <span
                className={cx('h-2 w-2 shrink-0 rounded-sm', row.dashed && 'h-0.5 rounded-none')}
                style={{ background: row.color, opacity: row.dashed ? 0.6 : 1 }}
              />
            )}
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            <span className="font-medium text-fg tabular-nums">{row.value}</span>
            {row.change && <span className="text-[11px] text-subtle tabular-nums">{row.change}</span>}
          </div>
        ))}
      </div>
    )}
    {footer && <p className="mt-2 border-t border-line pt-1.5 text-[11px] text-subtle">{footer}</p>}
  </div>
)

/* ─── Clickable legend (toggles series) ────────────────────────────────── */

export const SeriesLegend = ({ series, hidden, onToggle, showPrevious }) => (
  <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-1">
    {series.map((s) => {
      const off = hidden.has(s.key)
      return (
        <button
          key={s.key}
          type="button"
          onClick={() => onToggle(s.key)}
          aria-pressed={!off}
          title={off ? `Show ${s.label}` : `Hide ${s.label}`}
          className={cx(
            'inline-flex h-7 items-center gap-2 rounded-md px-2 text-xs transition-colors duration-150 hover:bg-surface-2',
            off ? 'text-subtle' : 'text-fg-2',
          )}
        >
          <span className="h-2.5 w-2.5 rounded-sm transition-opacity" style={{ background: s.color, opacity: off ? 0.25 : 1 }} />
          <span className={cx(off && 'line-through decoration-subtle')}>{s.label}</span>
          {s.total !== undefined && <span className="font-medium text-fg tabular-nums">{s.total}</span>}
        </button>
      )
    })}
    {showPrevious && (
      <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-subtle">
        <span className="h-0 w-4 border-t-[1.5px] border-dashed border-current" /> previous period
      </span>
    )}
  </div>
)

/* ─── Show / hide a page's charts ──────────────────────────────────────── */

export const ChartsToggle = ({ visible, onToggle }) => (
  <button type="button" onClick={onToggle} aria-pressed={visible} className={cx('btn', visible ? 'btn-secondary' : 'btn-ghost')}>
    <BarChart3 className="h-4 w-4" /> {visible ? 'Hide charts' : 'Show charts'}
  </button>
)
