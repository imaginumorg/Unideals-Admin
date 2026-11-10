import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { campusesApi } from '../../features/campuses/api/campusesApi'

/**
 * List filters stored in the URL (?search=&status=&page=…), so filtered
 * views are linkable from the dashboard, command palette and bookmarks.
 * Changing any filter other than `page` resets to page 1.
 */
export const useListFilters = (defaults) => {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const values = { page: 1, ...defaults }
    Object.keys(values).forEach((key) => {
      const raw = params.get(key)
      if (raw !== null) values[key] = key === 'page' ? Math.max(1, Number.parseInt(raw, 10) || 1) : raw
    })
    return values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const setFilter = useCallback(
    (key, value) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          const fallback = key === 'page' ? 1 : defaults[key]
          if (value === undefined || value === null || value === '' || value === fallback) next.delete(key)
          else next.set(key, String(value))
          if (key !== 'page') next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  )

  const resetFilters = useCallback(() => setParams({}, { replace: true }), [setParams])

  const isFiltered = Object.keys(defaults).some((key) => filters[key] !== defaults[key])

  return { filters, setFilter, resetFilters, isFiltered }
}

export const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Search box state that commits to the URL after the user pauses typing.
 */
export const useSearchFilter = (filters, setFilter, key = 'search') => {
  const [text, setText] = useState(filters[key] || '')
  const debounced = useDebouncedValue(text)

  useEffect(() => {
    if ((filters[key] || '') !== debounced) setFilter(key, debounced.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Keep the box in sync when the URL changes externally (reset, palette).
  const [lastUrlValue, setLastUrlValue] = useState(filters[key] || '')
  if ((filters[key] || '') !== lastUrlValue) {
    setLastUrlValue(filters[key] || '')
    if ((filters[key] || '') !== debounced.trim()) setText(filters[key] || '')
  }

  return [text, setText]
}

let campusCache = null

// Real campus list for filter dropdowns (cached for the session).
export const useCampusOptions = () => {
  const [campuses, setCampuses] = useState(campusCache || [])
  useEffect(() => {
    if (campusCache) return undefined
    let active = true
    campusesApi.getCampuses().then((response) => {
      if (!active || !response.success) return
      campusCache = (response.data || []).map((campus) => ({
        id: String(campus._id || campus.id),
        name: campus.name,
        shortName: campus.short_name,
        slug: campus.slug,
        isActive: campus.is_active !== false,
      }))
      setCampuses(campusCache)
    })
    return () => {
      active = false
    }
  }, [])
  return campuses
}

export const invalidateCampusOptions = () => {
  campusCache = null
}
