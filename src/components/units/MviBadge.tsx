import { useThresholds } from '../../hooks/useSettings'
import { daysFromToday, fmtDate, mviState } from '../../lib/format'
import { StatusIcon } from '../ui/StatusIcon'

// MVI expiry date, highlighted when expired or inside the warning window
export function MviBadge({ expiry }: { expiry: string | null }) {
  const thresholds = useThresholds()
  const state = mviState(expiry, thresholds?.mvi_warn_days ?? 30)
  if (!expiry || !state) return <span className="text-slate-500">No MVI date</span>

  if (state === 'ok') return <span className="tabular-nums">{fmtDate(expiry)}</span>

  const days = daysFromToday(expiry)
  const expired = state === 'expired'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-semibold
      ${expired ? 'border-red-300 bg-red-50 text-red-800' : 'border-amber-400 bg-amber-50 text-amber-900'}`}>
      <StatusIcon status={expired ? 'critical' : 'warning'} className="h-4 w-4" />
      <span className="tabular-nums">{fmtDate(expiry)}</span>
      <span className="font-normal">
        {expired ? `expired ${-days}d ago` : days === 0 ? 'due today' : `due in ${days}d`}
      </span>
    </span>
  )
}
