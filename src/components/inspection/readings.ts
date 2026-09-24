import { parseNum } from '../../lib/format'
import type { ReadingInput } from '../../lib/types'

export type ReadingDraft = { outer: string; center: string; inner: string; pressure: string; condition: string }

export const EMPTY_READING: ReadingDraft = { outer: '', center: '', inner: '', pressure: '', condition: '' }

export const CONDITIONS = [
  { value: 'ok', label: 'OK' },
  { value: 'irregular_wear', label: 'Irregular wear' },
  { value: 'cut', label: 'Cut' },
  { value: 'bulge', label: 'Bulge' },
  { value: 'puncture', label: 'Puncture' },
  { value: 'sidewall_damage', label: 'Sidewall damage' },
  { value: 'low_pressure', label: 'Low pressure' },
]

export function isTouched(d: ReadingDraft) {
  return Object.values(d).some((v) => v.trim() !== '')
}

// Checks one row the same way the API will, so errors show before saving.
// Returns field -> message; an empty object means the row is fine.
export function checkReading(d: ReadingDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const num = (key: keyof ReadingDraft, field: string, max: number) => {
    const n = parseNum(d[key])
    if (n === undefined) return
    if (Number.isNaN(n)) errors[field] = 'Enter a number'
    else if (n < 0 || n > max) errors[field] = `0 to ${max}`
  }
  num('outer', 'tread_outer_32', 40)
  num('center', 'tread_center_32', 40)
  num('inner', 'tread_inner_32', 40)
  num('pressure', 'pressure_psi', 200)
  if (isTouched(d) && !d.outer.trim() && !d.center.trim() && !d.inner.trim()) {
    errors.row = 'Enter at least one tread reading'
  }
  return errors
}

export function toReadingInput(tireId: number, d: ReadingDraft): ReadingInput {
  return {
    tire_id: tireId,
    tread_outer_32: parseNum(d.outer),
    tread_center_32: parseNum(d.center),
    tread_inner_32: parseNum(d.inner),
    pressure_psi: parseNum(d.pressure),
    condition: d.condition || undefined,
  }
}
