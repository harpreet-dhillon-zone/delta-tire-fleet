import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortDir } from '../lib/sort'

// Sort column and direction in the URL (?sort=min_tread_32&dir=asc), next to the filters.
// No sort param means the API's own order.
export function useUrlSort(allowed: readonly string[]) {
  const [params, setParams] = useSearchParams()
  const raw = params.get('sort')
  const sort = raw && allowed.includes(raw) ? raw : null
  const dir: SortDir = params.get('dir') === 'desc' ? 'desc' : 'asc'

  const setSort = useCallback(
    (column: string | null, direction: SortDir = 'asc') => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (column) {
          next.set('sort', column)
          next.set('dir', direction)
        } else {
          next.delete('sort')
          next.delete('dir')
        }
        return next
      }, { replace: true })
    },
    [setParams],
  )

  // Header click: ascending, then descending, then back to the default order
  const toggle = useCallback(
    (column: string) => {
      if (sort !== column) setSort(column, 'asc')
      else if (dir === 'asc') setSort(column, 'desc')
      else setSort(null)
    },
    [sort, dir, setSort],
  )

  return { sort, dir, setSort, toggle }
}
