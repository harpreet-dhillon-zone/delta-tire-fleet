import { Link } from 'react-router-dom'
import { titleCase } from '../../lib/format'
import type { UnitSummary } from '../../lib/types'
import { MviBadge } from './MviBadge'
import { UnitStatusBadge } from './UnitStatusBadge'

export function UnitCards({ units }: { units: UnitSummary[] }) {
  return (
    <ul className="space-y-2">
      {units.map((u) => (
        <li key={u.id}>
          <Link to={`/units/${u.id}`} className="block rounded-xl bg-white p-3 shadow-sm active:bg-slate-50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xl font-bold">{u.unit_number}</div>
                <div className="truncate text-base text-slate-700">
                  {titleCase(u.unit_class)}{u.carrier ? ` · ${u.carrier}` : ''}
                  {u.status !== 'active' && <span className="font-semibold"> · {titleCase(u.status)}</span>}
                </div>
              </div>
              <UnitStatusBadge unit={u} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
              <span><span className="text-slate-600">Plate </span><span className="font-semibold">{u.plate ?? '—'}</span></span>
              <span><span className="text-slate-600">MVI </span><MviBadge expiry={u.mvi_expiry} /></span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
