import { memo, useState } from 'react'
import { Bar, CartesianGrid, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, SeriesLegend, TooltipBox, compact, reducedMotion } from './primitives'

/**
 * Vertical columns per period, optionally stacked.
 *
 * rows:   [{ label, title, subtitle?, [seriesKey]: number }]
 * series: [{ key, label, color }] — stacked bottom-up in this order.
 * onColumnClick(row, index) drills down; the clicked column stays highlighted
 * while `selectedIndex` points at it.
 */
const ColumnChart = ({
  rows,
  series,
  stacked = true,
  format = (v) => v,
  height = 220,
  onColumnClick,
  selectedIndex = null,
  clickHint,
  footer,
}) => {
  const [hidden, setHidden] = useState(() => new Set())
  const [hover, setHover] = useState(null)
  const animate = !reducedMotion()
  const visible = series.filter((s) => !hidden.has(s.key))
  const toggle = (key) =>
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else if (series.length - next.size > 1) next.add(key)
      return next
    })

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return (
      <TooltipBox
        title={row.title}
        subtitle={row.subtitle}
        rows={visible.map((s) => ({ label: s.label, color: s.color, value: format(row[s.key] ?? 0) }))}
        footer={onColumnClick ? clickHint || 'Click for details' : footer?.(row)}
      />
    )
  }

  const dim = (index) => {
    if (selectedIndex !== null) return index === selectedIndex ? 1 : 0.35
    if (hover !== null) return index === hover ? 1 : 0.55
    return 1
  }

  return (
    <div>
      {series.length > 1 && <SeriesLegend series={series} hidden={hidden} onToggle={toggle} />}
      <div style={{ height }} className={onColumnClick ? '[&_.recharts-surface]:cursor-pointer' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
            barCategoryGap="22%"
            onMouseMove={(state) => {
              const index = Number(state?.activeTooltipIndex ?? state?.activeIndex)
              setHover(Number.isInteger(index) ? index : null)
            }}
            onMouseLeave={() => setHover(null)}
            onClick={(state) => {
              const index = Number(state?.activeTooltipIndex ?? state?.activeIndex)
              if (onColumnClick && Number.isInteger(index) && rows[index]) onColumnClick(rows[index], index)
            }}
          >
            <CartesianGrid vertical={false} stroke="var(--c-line)" />
            <XAxis dataKey="label" {...AXIS} minTickGap={20} interval="preserveStartEnd" tickMargin={8} />
            <YAxis {...AXIS} width={40} tickFormatter={compact} allowDecimals={false} />
            <Tooltip content={renderTooltip} cursor={{ fill: 'var(--c-surface-2)' }} isAnimationActive={false} wrapperStyle={{ zIndex: 30, outline: 'none' }} />
            {visible.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                stackId={stacked ? 'stack' : undefined}
                fill={s.color}
                maxBarSize={36}
                // 2px surface gap between stacked segments; rounded data end.
                stroke={stacked ? 'var(--c-surface)' : undefined}
                strokeWidth={stacked ? 1 : 0}
                radius={!stacked || i === visible.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={animate}
                animationDuration={400}
              >
                {rows.map((row, index) => (
                  <Cell key={row.label + index} fillOpacity={dim(index)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default memo(ColumnChart)
