import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs `request` (a fetcher-style function) whenever its identity changes.
 * - loading: true until the first response
 * - refreshing: true while any later request is in flight
 * Stale responses from superseded requests are ignored.
 */
export const useFetch = (request) => {
  const [data, setData] = useState()
  const [pagination, setPagination] = useState()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const latestId = useRef(0)

  const run = useCallback(async () => {
    const id = latestId.current + 1
    latestId.current = id
    setRefreshing(true)
    const response = await request()
    if (id !== latestId.current) return response

    if (response.success) {
      setData(response.data)
      setPagination(response.pagination ?? undefined)
      setError('')
    } else {
      setError(response.message || 'Request failed')
    }
    setLoading(false)
    setRefreshing(false)
    return response
  }, [request])

  useEffect(() => {
    const timer = window.setTimeout(run, 0)
    return () => window.clearTimeout(timer)
  }, [run])

  return { data, pagination, loading, refreshing, error, refetch: run }
}
