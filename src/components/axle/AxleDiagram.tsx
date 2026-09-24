import { AXLE_LAYOUTS, isLayoutKey } from '../../shared/layouts'
import { severityToStatus } from '../../lib/status'
import type { UnitClass, UnitTire } from '../../lib/types'
import { EmptySlot, TireSlot } from './TireSlot'

type Props = {
  layout: string
  unitClass: UnitClass
  tires: UnitTire[]
  selectedTireId?: number | null
  onTire: (tire: UnitTire) => void
  onEmpty?: (position: string) => void
}

function axleName(unitClass: UnitClass, index: number) {
  if (unitClass === 'tractor') return index === 0 ? 'Steer' : `Drive ${index}`
  return `Axle ${index + 1}`
}

// Top-down view built from the shared layout: front at the top, driver's
// (left) side on the left, duals drawn as outer/inner pairs.
export function AxleDiagram({ layout, unitClass, tires, selectedTireId, onTire, onEmpty }: Props) {
  if (!isLayoutKey(layout)) {
    return <p className="text-base text-red-700">Unknown axle layout “{layout}”.</p>
  }
  const byPosition = new Map(tires.map((t) => [t.position, t]))
  const axles = AXLE_LAYOUTS[layout].axles

  const slot = (position: string) => {
    const tire = byPosition.get(position)
    if (!tire) return <EmptySlot key={position} position={position} onClick={onEmpty && (() => onEmpty(position))} />
    return (
      <TireSlot key={position} position={position} status={severityToStatus(tire.severity)}
        minTread={tire.min_tread_32} selected={tire.tire_id === selectedTireId} onClick={() => onTire(tire)} />
    )
  }

  return (
    <figure className="mx-auto max-w-md rounded-xl bg-white p-3 shadow-sm">
      <figcaption className="sr-only">Axle diagram, front of the vehicle at the top</figcaption>
      <div className="mb-2 flex items-center justify-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-500">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M12 4 4 14h16z" /></svg>
        Front
      </div>
      <div className="mb-1 grid grid-cols-2 px-1 text-sm font-semibold text-slate-500">
        <span>Left (driver)</span>
        <span className="text-right">Right</span>
      </div>

      <div className="relative mx-auto w-fit">
        {/* Frame rails */}
        <div className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 border-x-4 border-slate-300" aria-hidden />
        {unitClass === 'tractor' && (
          <div className="relative mx-auto mb-3 h-12 w-32 rounded-t-3xl border-4 border-slate-300 bg-slate-100" aria-hidden />
        )}
        <div className="relative space-y-3">
          {axles.map((sides, i) => {
            const positions = sides.map((s) => `A${i + 1}-${s}`)
            const half = positions.length / 2
            // Extra space after the steer axle, like on the truck
            const gap = unitClass === 'tractor' && i === 1 ? 'pt-6' : ''
            return (
              <div key={i} className={gap}>
                <div className="relative mb-1 text-center text-sm font-bold text-slate-700">
                  <span className="rounded bg-white px-1">{axleName(unitClass, i)}</span>
                </div>
                <div className="relative flex items-center justify-between gap-10">
                  <div className="absolute inset-x-6 top-1/2 h-2 -translate-y-1/2 rounded bg-slate-500" aria-hidden />
                  <div className="relative flex gap-1.5">{positions.slice(0, half).map(slot)}</div>
                  <div className="relative flex gap-1.5">{positions.slice(half).map(slot)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </figure>
  )
}
