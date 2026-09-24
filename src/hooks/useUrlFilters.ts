import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// Filters stored in the URL query string, so refresh and the back button keep them.
// Changes replace the current history entry instead of adding one per keystroke.
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams()

  const values = Object.fromEntries(keys.map((k) => [k, params.get(k) ?? ''])) as Record<K, string>

  const set = useCallback(
    (key: K, value: string) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      }, { replace: true })
    },
    [setParams],
  )

  const clear = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      keys.forEach((k) => next.delete(k))
      return next
    }, { replace: true })
  }, [setParams, keys])

  const activeCount = keys.filter((k) => values[k]).length

  return { values, set, clear, activeCount }
}
