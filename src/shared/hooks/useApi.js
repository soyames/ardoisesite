import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'

/**
 * GET a path and track loading/error/data + a manual refetch --
 * covers every "list of X" screen in the app (pending approvals,
 * invoices, grade entries...) without repeating the same
 * loading/error boilerplate in every portal component.
 */
export function useApiGet(path, { skip = false } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    if (skip) return
    setLoading(true)
    setError(null)
    api
      .get(path)
      .then((res) => setData(res))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [path, skip])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
