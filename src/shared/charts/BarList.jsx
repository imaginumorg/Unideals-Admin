import { memo, useMemo, useState } from 'react'
import { cx } from '../components/ui'
import { formatNumber } from '../lib/format'

/**
 * Ranked horizontal bars (categories, campuses, staff). Rows are real
 * buttons when `onSelect` is set, so they work with the keyboard and the
 * value is always printed — the bar is the visual, not the only label.
 *
 * items: [{ key, label, value, sub? }]
 */
const BarList = ({
  items,
  selected = null,
  onSelect,
  format = formatNumber,
  color = 'var(--c-chart-1)',
  limit = 8,
  sortable = true,
  selectHint = 'Click to filter',
  valueLabel = 'Count',
}) => {
  const [sort, setSort] = useState('value')
  const [expanded, setExpanded] = useState(false)
  const total = items.reduce((sum, item) => sum + (item.value || 0), 0)
  const max = Math.max(1, ...items.map((item) => item.value || 0))

  // sortable={false} keeps the given order (e.g. high → medium → low).
  const sorted = useMemo(
    () =>
      sortable
        ? [...items].sort((a, b) =>
            sort === 'name' ? String(a.label).localeCompare(String(b.label)) : (b.value || 0) - (a.value || 0) || String(a.label).localeCompare(String(b.label)),
          )
        : items,
    [items, sort, sortable],
  )
  // Keep the selected row visible even when it falls outside the top N.
  const shown = expanded ? sorted : sorted.filter((item, index) => index < limit || item.key === selected)

  return (
    <div>
      {sortable && items.length > 2 && (
        <div className="mb-2 flex items-center justify-end gap-0.5 text-[11px]" role="group" aria-label="Sort">
          {[
            ['value', valueLabel],
            ['name', 'A–Z'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={cx('rounded px-1.5 py-0.5 transition-colors', sort === key ? 'bg-surface-3 text-fg' : 'text-subtle hover:text-fg')}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <ul className="space-y-1">
        {shown.map((item) => {
          const pct = Math.max(item.value ? 2 : 0, ((item.value || 0) / max) * 100)
          const isSelected = selected === item.key
          const faded = selected && !isSelected
          const share = total ? Math.round(((item.value || 0) / total) * 100) : 0
          const body = (
            <>
              <span className="relative flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-[5px]">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 rounded-[5px] transition-[width,opacity] duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `color-mix(in oklab, ${color} ${isSelected ? 42 : 24}%, transparent)`,
                    opacity: faded ? 0.45 : 1,
                  }}
                />
                <span className={cx('relative min-w-0 truncate px-2.5 text-[13px]', faded ? 'text-muted' : 'text-fg')}>{item.label}</span>
                {/* Secondary text gives way first so the label stays readable. */}
                {item.sub && <span className="relative ml-auto min-w-0 shrink-[4] truncate pr-2 text-[11px] text-subtle">{item.sub}</span>}
              </span>
              <span className={cx('w-14 shrink-0 text-right text-[13px] font-medium tabular-nums', faded ? 'text-muted' : 'text-fg')}>{format(item.value)}</span>
            </>
          )
          const title = `${item.label}: ${format(item.value)} (${share}%)${onSelect ? ` · ${isSelected ? 'click to clear' : selectHint.toLowerCase()}` : ''}`
          return (
            <li key={item.key}>
              {onSelect ? (
                <button
                  type="button"
                  title={title}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(isSelected ? null : item.key)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-md p-0.5 text-left transition-colors duration-150 hover:bg-surface-2',
                    isSelected && 'bg-surface-2 ring-1 ring-line-strong',
                  )}
                >
                  {body}
                </button>
              ) : (
                <div title={title} className="flex w-full items-center gap-3 p-0.5">
                  {body}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {sorted.length > limit && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-2 text-xs font-medium text-brand-fg hover:underline">
          {expanded ? 'Show fewer' : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  )
}

export default memo(BarList)
