import { STATUS_META } from '../../lib/status'
import type { Status } from '../../lib/types'
import { StatusIcon } from './StatusIcon'

export function StatusBadge({ status, label, size = 'md' }: { status: Status; label?: string; size?: 'sm' | 'md' }) {
  const meta = STATUS_META[status]
  const sizing = size === 'sm' ? 'gap-1 px-2 py-0.5 text-sm' : 'gap-1.5 px-2.5 py-1 text-sm'
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${sizing} ${meta.badge}`}>
      <StatusIcon status={status} className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      {label ?? meta.label}
    </span>
  )
}
