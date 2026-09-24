import { severityToStatus } from '../../lib/status'
import type { UnitSummary } from '../../lib/types'
import { StatusBadge } from '../ui/StatusBadge'

// Worst tire status on the unit, with counts when something is wrong
export function UnitStatusBadge({ unit }: { unit: UnitSummary }) {
  if (unit.worst_severity < 0) return <StatusBadge status="no_data" label="No tires" />
  const status = severityToStatus(unit.worst_severity)
  const label =
    status === 'critical' ? `${unit.critical_tires} critical`
    : status === 'warning' ? `${unit.warning_tires} warning`
    : undefined
  return <StatusBadge status={status} label={label} />
}
