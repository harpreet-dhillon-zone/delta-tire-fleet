import { positionOrder, type SortSpec } from '../../lib/sort'
import type { AttentionRow } from '../../lib/types'

// Keys match the table's column ids
export const ATTENTION_SORT: SortSpec<AttentionRow> = {
  unit_number: { label: 'Unit', value: (r) => r.unit_number },
  carrier: { label: 'Carrier', value: (r) => r.carrier },
  position: { label: 'Position', value: (r) => positionOrder(r.position) },
  min_tread_32: { label: 'Min tread', value: (r) => r.min_tread_32 },
  age_years: { label: 'Age', value: (r) => r.age_years },
  last_inspected: { label: 'Last inspected', value: (r) => r.last_inspected },
  severity: { label: 'Status', value: (r) => r.severity },
}
