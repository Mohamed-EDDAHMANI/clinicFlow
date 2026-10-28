import { useCallback, useEffect, useState } from 'react'

export const useApi = (request, { enabled = true } = {}) => {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ request: null, version: -1, data: null, error: null, updatedAt: null })

  useEffect(() => {
    if (!enabled) return undefined

    let active = true

    request().then(
      (data) => active && setResult({ request, version, data, error: null, updatedAt: new Date() }),
      (error) => active && setResult((previous) => ({ ...previous, request, version, error })),
    )

    return () => {
      active = false
    }
  }, [request, version, enabled])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const setData = useCallback((update) => setResult((previous) => ({ ...previous, data: update(previous.data) })), [])
  const settled = result.request === request && result.version === version

  return {
    data: result.data,
    updatedAt: result.updatedAt,
    error: settled ? result.error : null,
    loading: enabled && !settled,
    reload,
    setData,
  }
}
