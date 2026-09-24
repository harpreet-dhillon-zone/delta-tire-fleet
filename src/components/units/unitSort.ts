import type { SortSpec } from '../../lib/sort'
import type { UnitSummary } from '../../lib/types'

// Keys match the table's column ids
export const UNIT_SORT: SortSpec<UnitSummary> = {
  unit_number: { label: 'Unit', value: (u) => u.unit_number },
  unit_class: { label: 'Class', value: (u) => u.unit_class },
  carrier: { label: 'Carrier', value: (u) => u.carrier },
  plate: { label: 'Plate', value: (u) => u.plate },
  vin: { label: 'VIN', value: (u) => u.vin },
  mvi_expiry: { label: 'MVI expiry', value: (u) => u.mvi_expiry },
  worst_severity: { label: 'Tire status', value: (u) => (u.worst_severity < 0 ? null : u.worst_severity) },
}
