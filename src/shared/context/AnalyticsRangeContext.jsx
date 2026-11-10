/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { DEFAULT_RANGE, resolveRange } from '../lib/dateRange'

/**
 * The portal-wide analytics date range (Dashboard, Listings, Orders,
 * Reports, Jobs). Remembered per browser so it survives navigation; storage
 * is a convenience only and the default applies when it's unavailable.
 */
const STORAGE_KEY = 'campus_mart_admin_range'

const read = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return parsed && typeof parsed.preset === 'string' ? parsed : DEFAULT_RANGE
  } catch {
    return DEFAULT_RANGE
  }
}

export const AnalyticsRangeContext = createContext(null)

export const AnalyticsRangeProvider = ({ children }) => {
  const [value, setValue] = useState(read)

  const setRange = useCallback((next) => {
    setValue(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // storage unavailable: keep it for this session only
    }
  }, [])

  // Resolved against today on each change, so "Last 7 days" stays current.
  const range = useMemo(() => resolveRange(value), [value])
  const context = useMemo(() => ({ range, setRange }), [range, setRange])
  return <AnalyticsRangeContext.Provider value={context}>{children}</AnalyticsRangeContext.Provider>
}

export const useAnalyticsRange = () => {
  const context = useContext(AnalyticsRangeContext)
  if (!context) throw new Error('useAnalyticsRange must be used inside AnalyticsRangeProvider')
  return context
}
