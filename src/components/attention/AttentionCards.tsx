import { Link } from 'react-router-dom'
import { fmtAge, fmtAgo, fmtTread, positionLabel } from '../../lib/format'
import { ROLE_LABEL, severityToStatus, STATUS_META } from '../../lib/status'
import type { AttentionRow } from '../../lib/types'
import { StatusBadge } from '../ui/StatusBadge'
import { StatusIcon } from '../ui/StatusIcon'

export function tireLink(row: Pick<AttentionRow, 'unit_id' | 'tire_id'>) {
  return `/units/${row.unit_id}?tire=${row.tire_id}`
}

// Phone layout: one tappable card per tire
export function AttentionCards({ rows }: { rows: AttentionRow[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const status = severityToStatus(r.severity)
        return (
          <li key={r.tire_id}>
            <Link to={tireLink(r)}
              className={`block rounded-xl border-l-8 bg-white p-3 shadow-sm active:bg-slate-50 ${STATUS_META[status].accent}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xl font-bold">{r.unit_number}</div>
                  <div className="text-base text-slate-700">
                    {positionLabel(r.position)} · {ROLE_LABEL[r.axle_role]}
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-base">
                <div>
                  <dt className="text-sm text-slate-600">Min tread</dt>
                  <dd className="flex items-center gap-1 font-semibold tabular-nums">
                    {r.tread_status !== 'ok' && <StatusIcon status={r.tread_status} className="h-4 w-4" />}
                    {fmtTread(r.min_tread_32)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Age</dt>
                  <dd className="flex items-center gap-1 font-semibold tabular-nums">
                    {r.age_status !== 'ok' && <StatusIcon status={r.age_status} className="h-4 w-4" />}
                    {fmtAge(r.age_years)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-600">Inspected</dt>
                  <dd className="font-semibold">{fmtAgo(r.last_inspected)}</dd>
                </div>
              </dl>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
