import { fmtTread, round1, titleCase } from '../../lib/format'
import type { Inspection } from '../../lib/types'

// Outer / center / inner tread, pressure and condition from one inspection
export function ReadingValues({ insp }: { insp: Inspection }) {
  const cells: [string, string][] = [
    ['Outer', fmtTread(insp.tread_outer_32)],
    ['Center', fmtTread(insp.tread_center_32)],
    ['Inner', fmtTread(insp.tread_inner_32)],
    ['Pressure', insp.pressure_psi === null ? '—' : `${round1(insp.pressure_psi)} psi`],
  ]
  return (
    <div>
      <dl className="grid grid-cols-4 gap-2">
        {cells.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="text-base font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {(insp.condition || insp.notes) && (
        <p className="mt-1 text-base text-slate-700">
          {insp.condition && <span className="font-semibold">{titleCase(insp.condition)}</span>}
          {insp.condition && insp.notes && ' · '}
          {insp.notes}
        </p>
      )}
    </div>
  )
}
