import { memo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { TooltipBox, reducedMotion } from './primitives'
import { cx } from '../components/ui'
import { formatNumber } from '../lib/format'

/**
 * Donut with the total in the centre and a legend that carries every value
 * and share (so colour is never the only way to read it).
 *
 * data: [{ key, label, value, color }]
 * With onSelect, segments and legend rows are buttons that filter; the
 * selected one stays highlighted and clicking it again clears the filter.
 */
const Donut = ({ data, selected = null, onSelect, centerLabel = 'Total', format = formatNumber, size = 168, selectHint = 'Click to filter' }) => {
  const [hover, setHover] = useState(null)
  const animate = !reducedMotion()
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0)
  const slices = data.filter((d) => d.value > 0)
  const focusKey = hover ?? selected
  const focus = focusKey ? data.find((d) => d.key === focusKey) : null
  const share = (value) => (total ? Math.round((value / total) * 100) : 0)
  const choose = (key) => onSelect?.(selected === key ? null : key)

  const opacity = (key) => {
    if (selected) return key === selected ? 1 : 0.28
    if (hover) return key === hover ? 1 : 0.55
    return 1
  }

  return (
    // Side by side only when the card itself is wide enough (container query),
    // so narrow cards stack instead of truncating the legend.
    <div className="@container">
    <div className="flex flex-col items-center gap-5 @[26rem]:flex-row @[26rem]:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer={false}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              cornerRadius={3}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={animate}
              animationDuration={500}
              onMouseEnter={(entry) => setHover(entry?.key ?? entry?.payload?.key ?? null)}
              onMouseLeave={() => setHover(null)}
              onClick={(entry) => onSelect && choose(entry?.key ?? entry?.payload?.key)}
              className={onSelect ? 'cursor-pointer' : ''}
            >
              {slices.map((d) => (
                <Cell key={d.key} fill={d.color} fillOpacity={opacity(d.key)} />
              ))}
            </Pie>
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 30, outline: 'none' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <TooltipBox
                    title={d.label}
                    rows={[{ label: 'Count', color: d.color, value: format(d.value) }, { label: 'Share', value: `${share(d.value)}%` }]}
                    footer={onSelect ? (selected === d.key ? 'Click to clear the filter' : selectHint) : undefined}
                  />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-fg tabular-nums">{format(focus ? focus.value : total)}</span>
          <span className="max-w-[70%] truncate text-[11px] text-muted">{focus ? focus.label : centerLabel}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-0.5">
        {data.map((d) => {
          const content = (
            <>
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
              <span className="min-w-0 flex-1 truncate text-fg-2">{d.label}</span>
              <span className="font-medium text-fg tabular-nums">{format(d.value)}</span>
              <span className="w-9 text-right text-[11px] text-subtle tabular-nums">{share(d.value)}%</span>
            </>
          )
          const rowClass = 'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px]'
          return (
            <li key={d.key} onMouseEnter={() => setHover(d.key)} onMouseLeave={() => setHover(null)}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => choose(d.key)}
                  aria-pressed={selected === d.key}
                  disabled={!d.value && selected !== d.key}
                  className={cx(
                    rowClass,
                    'transition-colors duration-150 hover:bg-surface-2 disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent',
                    selected === d.key && 'bg-surface-2 ring-1 ring-line-strong',
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
    </div>
  )
}

export default memo(Donut)
