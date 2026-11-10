import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { accessApi } from '../features/access/api/accessApi'

/**
 * Counts of things waiting on staff (pending reports, gender requests).
 * Drives sidebar badges and the header inbox. Polls once a minute while
 * the tab is visible; pages call `refresh()` after resolving items.
 */
const AttentionContext = createContext({ counts: {}, refresh: () => {} })

const POLL_MS = 60_000

export const AttentionProvider = ({ children }) => {
  const [counts, setCounts] = useState({ pendingReports: 0, pendingGenderRequests: 0, autoHiddenListings: 0, failingJobs: 0 })

  const refresh = useCallback(async () => {
    // Counts only for sections this person can see (server-side filtered).
    const response = await accessApi.attention()
    if (response.success && response.data) {
      const { pendingReports = 0, pendingGenderRequests = 0, autoHiddenListings = 0, failingJobs = 0 } = response.data
      setCounts({ pendingReports, pendingGenderRequests, autoHiddenListings, failingJobs })
    }
  }, [])

  useEffect(() => {
    const first = window.setTimeout(refresh, 0)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      counts,
      total: counts.pendingReports + counts.pendingGenderRequests + counts.autoHiddenListings + counts.failingJobs,
      refresh,
    }),
    [counts, refresh],
  )
  return <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAttention = () => useContext(AttentionContext)
