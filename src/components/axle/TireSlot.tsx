import { round1 } from '../../lib/format'
import { positionLabel } from '../../lib/format'
import { STATUS_META } from '../../lib/status'
import type { Status } from '../../lib/types'
import { StatusIcon } from '../ui/StatusIcon'

const SLOT = 'flex h-24 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 sm:w-[4.5rem]'

type TireSlotProps = {
  position: string
  status: Status
  minTread: number | null
  selected: boolean
  onClick: () => void
}

// One mounted tire, seen from above. Color + icon + number, never color alone.
export function TireSlot({ position, status, minTread, selected, onClick }: TireSlotProps) {
  const meta = STATUS_META[status]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${positionLabel(position)}: ${meta.label}, min tread ${minTread === null ? 'not measured' : `${round1(minTread)} 32nds`}`}
      className={`${SLOT} ${meta.fill} shadow-sm active:scale-95 transition-transform
        ${selected ? 'ring-4 ring-blue-500 ring-offset-2' : ''}`}
    >
      <StatusIcon status={status} className="h-5 w-5" />
      <span className="mt-1 text-xl font-bold leading-none tabular-nums">{minTread === null ? '—' : round1(minTread)}</span>
      <span className="text-xs font-semibold opacity-90">{minTread === null ? 'no data' : '/32″'}</span>
    </button>
  )
}

// An empty position: tap to add a tire there
export function EmptySlot({ position, onClick }: { position: string; onClick?: () => void }) {
  const className = `${SLOT} border-dashed border-slate-400 bg-white/70 text-slate-600`
  const content = (
    <>
      <span className="text-2xl font-bold leading-none" aria-hidden>+</span>
      <span className="mt-1 text-center text-xs font-semibold leading-tight">Add tire</span>
    </>
  )
  if (!onClick) return <div className={className} aria-label={`${positionLabel(position)}: empty`}>{content}</div>
  return (
    <button type="button" onClick={onClick} className={`${className} hover:bg-white active:scale-95 transition-transform`}
      aria-label={`${positionLabel(position)}: empty, add tire`}>
      {content}
    </button>
  )
}
