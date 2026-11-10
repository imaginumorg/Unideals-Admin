import { useCallback, useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { bucketLabel, defaultInterval, formatSpan, intervalsFor } from '../lib/dateRange'
import { downloadCsv } from '../lib/format'

/**
 * Fetches `fn(params)` and refetches only when the params' values change
 * (not on every render). Previous data stays on screen while refreshing,
 * so charts animate from old values to new ones instead of blanking.
 */
export const useAnalytics = (fn, params, { enabled = true } = {}) => {
  const key = JSON.stringify(params)
  const request = useCallback(
    () => (enabled ? fn(JSON.parse(key)) : Promise.resolve({ success: true, data: null })),
    [fn, key, enabled],
  )
  return useFetch(request)
}

/** Interval picker state constrained to what the span supports. */
export const useInterval = (days) => {
  const [choice, setChoice] = useState(null)
  const options = intervalsFor(days)
  const fallback = defaultInterval(days)
  const interval = options.includes(choice) ? choice : options.includes(fallback) ? fallback : options[0]
  return [interval, setChoice, options]
}

export const INTERVAL_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly' }
export const intervalTabs = (options) => options.map((value) => ({ value, label: INTERVAL_LABELS[value] }))

/** /analytics/trends response → TrendChart rows. */
export const trendRows = (data, metrics) => {
  if (!data?.buckets) return []
  return data.buckets.map((bucket, index) => {
    const row = {
      bucket,
      label: bucketLabel(bucket, data.interval),
      title: bucketLabel(bucket, data.interval, { long: true }) + (bucket.partial ? ' (partial)' : ''),
      prevTitle: bucket.previous ? formatSpan(bucket.previous.from, bucket.previous.to) : null,
    }
    metrics.forEach((metric) => {
      row[metric] = data.series?.[metric]?.[index] ?? 0
      row[`${metric}__prev`] = data.previous?.[metric]?.[index] ?? null
    })
    return row
  })
}

export const hasAny = (data, metrics) => metrics.some((m) => (data?.totals?.[m] || 0) > 0 || (data?.previousTotals?.[m] || 0) > 0)

/** CSV of a trend: one row per period with current and previous values. */
export const exportTrendCsv = (filename, data, series) => {
  if (!data?.buckets) return
  const header = ['Period start', 'Period end', ...series.map((s) => s.label), ...series.map((s) => `${s.label} (previous period)`), 'Previous period']
  const rows = data.buckets.map((bucket, i) => [
    bucket.from,
    bucket.to,
    ...series.map((s) => data.series[s.key]?.[i] ?? 0),
    ...series.map((s) => data.previous?.[s.key]?.[i] ?? ''),
    bucket.previous ? `${bucket.previous.from} to ${bucket.previous.to}` : '',
  ])
  downloadCsv(filename, header, rows)
}

export const exportRowsCsv = (filename, header, rows) => downloadCsv(filename, header, rows)

/** Per-page "show charts" preference (a convenience; defaults to shown). */
export const useChartsVisible = (page) => {
  const storageKey = `campus_mart_admin_charts_${page}`
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== '0'
    } catch {
      return true
    }
  })
  const toggle = () =>
    setVisible((current) => {
      try {
        localStorage.setItem(storageKey, current ? '0' : '1')
      } catch {
        // storage unavailable
      }
      return !current
    })
  return [visible, toggle]
}
