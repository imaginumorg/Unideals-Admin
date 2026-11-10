/**
 * Analytics date ranges as local calendar days ("YYYY-MM-DD"). The API
 * buckets in the viewer's time zone, so these keys mean the same days the
 * viewer sees on their calendar.
 */

const pad = (n) => String(n).padStart(2, '0')
export const toKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const fromKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const isDayKey = (key) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ''))) return false
  const date = fromKey(key)
  return toKey(date) === key
}

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
const daysIn = (y, m) => new Date(y, m + 1, 0).getDate()
// Same day-of-month in another month, clamped (31 Mar → 28/29 Feb).
const sameDay = (y, m, day) => {
  const target = new Date(y, m, 1)
  return new Date(target.getFullYear(), target.getMonth(), Math.min(day, daysIn(target.getFullYear(), target.getMonth())))
}
const spanDays = (from, to) => Math.round((to - from) / 86_400_000) + 1

export const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: '3m', label: 'Last 3 months' },
  { key: 'year', label: 'This year' },
]

export const DEFAULT_RANGE = { preset: '30d' }

const shortDate = (date, withYear) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })

export const formatSpan = (fromKeyValue, toKeyValue) => {
  const from = fromKey(fromKeyValue)
  const to = fromKey(toKeyValue)
  const thisYear = new Date().getFullYear()
  const withYear = from.getFullYear() !== to.getFullYear() || to.getFullYear() !== thisYear
  if (fromKeyValue === toKeyValue) return shortDate(from, withYear)
  return `${shortDate(from, withYear && from.getFullYear() !== to.getFullYear())} – ${shortDate(to, withYear)}`
}

/**
 * { preset, from?, to? } → concrete range with its comparison window.
 * Comparisons: calendar presets compare like-for-like (this month so far vs
 * the same days last month); rolling ones compare the preceding equal span.
 */
export const resolveRange = (value = DEFAULT_RANGE, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  let preset = value?.preset || DEFAULT_RANGE.preset
  let from
  let to = today
  let compareFrom
  let compareTo
  let compareLabel

  const rolling = (days) => {
    from = addDays(today, -(days - 1))
    compareTo = addDays(from, -1)
    compareFrom = addDays(compareTo, -(days - 1))
    compareLabel = `previous ${days} days`
  }

  switch (preset) {
    case 'today':
      from = today
      compareFrom = compareTo = addDays(today, -1)
      compareLabel = 'yesterday'
      break
    case '7d':
      rolling(7)
      break
    case 'month':
      from = new Date(y, m, 1)
      compareFrom = new Date(y, m - 1, 1)
      compareTo = sameDay(y, m - 1, d)
      compareLabel = 'same days last month'
      break
    case 'last_month':
      from = new Date(y, m - 1, 1)
      to = new Date(y, m, 0)
      compareFrom = new Date(y, m - 2, 1)
      compareTo = new Date(y, m - 1, 0)
      compareLabel = 'the month before'
      break
    case '3m': {
      from = addDays(sameDay(y, m - 3, d), 1)
      const days = spanDays(from, to)
      compareTo = addDays(from, -1)
      compareFrom = addDays(compareTo, -(days - 1))
      compareLabel = 'previous 3 months'
      break
    }
    case 'year':
      from = new Date(y, 0, 1)
      compareFrom = new Date(y - 1, 0, 1)
      compareTo = sameDay(y - 1, m, d)
      compareLabel = 'same period last year'
      break
    case 'custom':
      if (isDayKey(value.from) && isDayKey(value.to) && value.from <= value.to) {
        from = fromKey(value.from)
        to = fromKey(value.to)
        const days = spanDays(from, to)
        compareTo = addDays(from, -1)
        compareFrom = addDays(compareTo, -(days - 1))
        compareLabel = `previous ${days} day${days === 1 ? '' : 's'}`
        break
      }
      preset = DEFAULT_RANGE.preset
      rolling(30)
      break
    default:
      preset = '30d'
      rolling(30)
  }

  const fromValue = toKey(from)
  const toValue = toKey(to)
  return {
    preset,
    from: fromValue,
    to: toValue,
    compareFrom: toKey(compareFrom),
    compareTo: toKey(compareTo),
    days: spanDays(from, to),
    label: preset === 'custom' ? formatSpan(fromValue, toValue) : PRESETS.find((p) => p.key === preset)?.label,
    span: formatSpan(fromValue, toValue),
    compareLabel,
  }
}

// Intervals that make sense for a span (and the API's 400-point cap).
export const intervalsFor = (days) => {
  if (days <= 1) return ['day']
  if (days <= 14) return ['day']
  if (days <= 120) return ['day', 'week']
  if (days <= 400) return ['day', 'week', 'month']
  return ['week', 'month']
}

export const defaultInterval = (days) => (days <= 45 ? 'day' : days <= 200 ? 'week' : 'month')

export const percentChange = (current, previous) => {
  if (!previous) return null
  const diff = Math.round(((current - previous) / previous) * 100)
  return diff >= 0 ? `+${diff}%` : `${diff}%`
}

// Bucket label for axes/tooltips.
export const bucketLabel = (bucket, interval, { long = false } = {}) => {
  if (!bucket) return ''
  if (interval === 'month') {
    return fromKey(bucket.key).toLocaleDateString('en-IN', { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit' })
  }
  if (interval === 'week') return long ? formatSpan(bucket.from, bucket.to) : shortDate(fromKey(bucket.from))
  return fromKey(bucket.key).toLocaleDateString('en-IN', long ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' })
}
