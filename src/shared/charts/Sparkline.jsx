import { memo, useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'

/**
 * Compact trend for KPI cards. Hover shows the period and its value.
 * points: [{ label, value }]
 */
const Sparkline = ({ points, color = 'var(--c-chart-1)', format = (v) => v, height = 34 }) => {
  const uid = useId().replace(/:/g, '')
  if (!points?.length) return <div style={{ height }} />
  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 3, right: 4, bottom: 2, left: 4 }} accessibilityLayer={false}>
          <defs>
            <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: 'var(--c-line-strong)', strokeWidth: 1 }}
            allowEscapeViewBox={{ x: false, y: true }}
            position={{ y: -30 }}
            wrapperStyle={{ zIndex: 30, outline: 'none' }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="pop px-2 py-1 text-[11px] whitespace-nowrap text-fg-2">
                  {payload[0].payload.label} · <span className="font-semibold text-fg tabular-nums">{format(payload[0].payload.value)}</span>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${uid})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: color }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default memo(Sparkline)
