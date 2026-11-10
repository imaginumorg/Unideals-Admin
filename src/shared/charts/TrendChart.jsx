import { memo, useId, useMemo, useState } from 'react'
import { Area, Brush, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, SeriesLegend, TooltipBox, compact, reducedMotion } from './primitives'
import { percentChange } from '../lib/dateRange'

/**
 * Line / area chart over time.
 *
 * rows:   [{ label, title, subtitle?, prevTitle?, [seriesKey]: number, [`${key}__prev`]: number|null }]
 * series: [{ key, label, color, total? }]
 *
 * - Legend entries toggle series (at least one stays visible).
 * - With showPrevious, each series gets a dashed line for the comparison
 *   period in its own colour, and the tooltip shows the change.
 * - Long ranges get a brush underneath for zooming and panning.
 * - onPointClick(row) makes points drill down (cursor shows it).
 */
const TrendChart = ({
  rows,
  series,
  type = 'area',
  format = (v) => v,
  axisFormat = compact,
  showPrevious = false,
  height = 240,
  onPointClick,
  clickHint,
  brushAt = 45,
}) => {
  const uid = useId().replace(/:/g, '')
  const [hidden, setHidden] = useState(() => new Set())
  const animate = !reducedMotion()

  const visible = series.filter((s) => !hidden.has(s.key))
  const toggle = (key) =>
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else if (series.length - next.size > 1) next.add(key)
      return next
    })

  const showBrush = rows.length > brushAt
  // Remount on new data so the brush window resets to the full range.
  const dataKey = useMemo(() => `${rows.length}-${rows[0]?.label}-${rows.at(-1)?.label}`, [rows])

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return (
      <TooltipBox
        title={row.title}
        subtitle={showPrevious && row.prevTitle ? `vs ${row.prevTitle}` : row.subtitle}
        rows={visible.flatMap((s) => {
          const value = row[s.key]
          const prev = row[`${s.key}__prev`]
          // null = no data for that point (e.g. a minute with no requests).
          const item = {
            label: s.label,
            color: s.color,
            value: value === null || value === undefined ? '—' : format(value),
            change: showPrevious && prev !== null && prev !== undefined ? percentChange(value ?? 0, prev) ?? '' : undefined,
          }
          return showPrevious && prev !== null && prev !== undefined
            ? [item, { label: `${s.label} (prev)`, color: s.color, dashed: true, value: format(prev) }]
            : [item]
        })}
        footer={onPointClick ? clickHint || 'Click to drill down' : undefined}
      />
    )
  }

  const Mark = type === 'line' ? Line : Area

  return (
    <div>
      {series.length > 1 || showPrevious ? (
        <SeriesLegend series={series} hidden={hidden} onToggle={toggle} showPrevious={showPrevious} />
      ) : null}
      <div style={{ height: height + (showBrush ? 30 : 0) }} className={onPointClick ? '[&_.recharts-surface]:cursor-pointer' : ''}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            key={dataKey}
            data={rows}
            margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
            onClick={(state) => {
              const index = Number(state?.activeTooltipIndex ?? state?.activeIndex)
              if (onPointClick && Number.isInteger(index) && rows[index]) onPointClick(rows[index], index)
            }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`fill-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--c-line)" />
            <XAxis dataKey="label" {...AXIS} minTickGap={28} interval="preserveStartEnd" tickMargin={8} />
            <YAxis {...AXIS} width={44} tickFormatter={axisFormat} allowDecimals={false} />
            <Tooltip
              content={renderTooltip}
              cursor={{ stroke: 'var(--c-line-strong)', strokeWidth: 1 }}
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 30, outline: 'none' }}
            />
            {showPrevious &&
              visible.map((s) => (
                <Line
                  key={`${s.key}-prev`}
                  type="monotone"
                  dataKey={`${s.key}__prev`}
                  stroke={s.color}
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={animate}
                  animationDuration={400}
                  connectNulls
                />
              ))}
            {visible.map((s) => (
              <Mark
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={type === 'line' ? undefined : `url(#fill-${uid}-${s.key})`}
                dot={rows.length === 1 ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--c-surface)', fill: s.color }}
                isAnimationActive={animate}
                animationDuration={450}
              />
            ))}
            {showBrush && (
              <Brush
                dataKey="label"
                height={22}
                travellerWidth={8}
                stroke="var(--c-line-strong)"
                fill="var(--c-surface-2)"
                tickFormatter={() => ''}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default memo(TrendChart)
