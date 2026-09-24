export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | null | undefined

// A sortable column: a label for the phone sort picker and the value to compare
export type SortSpec<T> = Record<string, { label: string; value: (row: T) => SortValue }>

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

// Sorts a copy. Empty values always go last, whichever direction.
// Ties keep the API's order (worst first), since Array.sort is stable.
export function sortRows<T>(rows: T[], value: ((row: T) => SortValue) | undefined, dir: SortDir): T[] {
  if (!value) return rows
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const x = value(a)
    const y = value(b)
    const xEmpty = x === null || x === undefined || x === ''
    const yEmpty = y === null || y === undefined || y === ''
    if (xEmpty || yEmpty) return xEmpty === yEmpty ? 0 : xEmpty ? 1 : -1
    const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : collator.compare(String(x), String(y))
    return cmp * sign
  })
}

const SIDE_ORDER = ['L', 'LO', 'LI', 'RI', 'RO', 'R']

// "A2-LO" -> 2.1: front to back, then left to right
export function positionOrder(position: string | null | undefined): number | null {
  const m = position ? /^A(\d+)-(\w+)$/.exec(position) : null
  if (!m) return null
  return Number(m[1]) + SIDE_ORDER.indexOf(m[2]) / 10
}
