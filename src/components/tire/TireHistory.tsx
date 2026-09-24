import { fmtDate, positionLabel, titleCase } from '../../lib/format'
import type { Inspection, TireMove } from '../../lib/types'
import { ReadingValues } from './ReadingValues'

function place(unit: string | null, position: string | null) {
  if (!unit) return 'Stock'
  return `${unit} ${position ?? ''}`.trim()
}

export function InspectionHistory({ inspections, emptyText = 'No inspections yet.' }: { inspections: Inspection[]; emptyText?: string }) {
  if (!inspections.length) return <p className="text-base text-slate-600">{emptyText}</p>
  return (
    <ol className="divide-y divide-slate-200">
      {inspections.map((insp) => (
        <li key={insp.id} className="py-2">
          <div className="mb-1 text-sm font-semibold text-slate-600">
            {fmtDate(insp.inspected_at)}
            {insp.position && ` · ${positionLabel(insp.position)}`}
            {insp.inspector && ` · ${insp.inspector}`}
          </div>
          <ReadingValues insp={insp} />
        </li>
      ))}
    </ol>
  )
}

export function MoveHistory({ moves }: { moves: TireMove[] }) {
  if (!moves.length) return <p className="text-base text-slate-600">No moves recorded.</p>
  return (
    <ol className="divide-y divide-slate-200">
      {moves.map((m) => (
        <li key={m.id} className="py-2 text-base">
          <div className="text-sm font-semibold text-slate-600">{fmtDate(m.moved_at)}</div>
          <div>
            {m.from_unit || m.from_position ? `${place(m.from_unit, m.from_position)} → ` : ''}
            <span className="font-semibold">{place(m.to_unit, m.to_position)}</span>
          </div>
          {m.reason && <div className="text-slate-700">{titleCase(m.reason)}</div>}
        </li>
      ))}
    </ol>
  )
}
