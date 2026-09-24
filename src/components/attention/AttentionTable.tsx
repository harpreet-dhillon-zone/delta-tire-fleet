import { Link, useNavigate } from 'react-router-dom'
import { fmtAge, fmtAgo, fmtDate, fmtTread, positionLabel } from '../../lib/format'
import type { SortDir } from '../../lib/sort'
import { ROLE_LABEL, severityToStatus } from '../../lib/status'
import type { ReactNode } from 'react'
import type { AttentionRow, Status } from '../../lib/types'
import { columnHelper, DataTable, type Columns } from '../table/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { StatusIcon } from '../ui/StatusIcon'
import { ATTENTION_SORT } from './attentionSort'
import { tireLink } from './AttentionCards'

const helper = columnHelper<AttentionRow>()

function Flagged({ status, children }: { status: Status; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
      {status !== 'ok' && <StatusIcon status={status} className="h-5 w-5" />}
      {children}
    </span>
  )
}

const columns: Columns<AttentionRow> = [
  helper.accessor('unit_number', {
    header: 'Unit',
    cell: ({ row }) => (
      <Link to={tireLink(row.original)} onClick={(e) => e.stopPropagation()} className="text-lg font-bold text-blue-800 hover:underline">
        {row.original.unit_number}
      </Link>
    ),
  }),
  helper.accessor('carrier', { header: 'Carrier', cell: (info) => info.getValue() ?? '—' }),
  helper.accessor('position', {
    header: 'Position',
    cell: ({ row }) => (
      <span>
        {positionLabel(row.original.position)}
        <span className="block text-sm text-slate-600">{ROLE_LABEL[row.original.axle_role]}</span>
      </span>
    ),
  }),
  helper.accessor('min_tread_32', {
    header: 'Min tread',
    cell: ({ row }) => <Flagged status={row.original.tread_status}>{fmtTread(row.original.min_tread_32)}</Flagged>,
  }),
  helper.accessor('age_years', {
    header: 'Age',
    cell: ({ row }) => <Flagged status={row.original.age_status}>{fmtAge(row.original.age_years)}</Flagged>,
  }),
  helper.accessor('last_inspected', {
    header: 'Last inspected',
    cell: (info) => (
      <span title={fmtDate(info.getValue())}>{fmtAgo(info.getValue())}</span>
    ),
  }),
  helper.accessor('severity', {
    header: 'Status',
    cell: (info) => <StatusBadge status={severityToStatus(info.getValue())} />,
  }),
] as Columns<AttentionRow>

const SORTABLE = Object.keys(ATTENTION_SORT)

type Props = { rows: AttentionRow[]; sort: string | null; dir: SortDir; onSort: (column: string) => void }

export function AttentionTable({ rows, sort, dir, onSort }: Props) {
  const navigate = useNavigate()
  return (
    <DataTable caption="Tires needing attention" columns={columns} data={rows}
      getRowId={(r) => String(r.tire_id)} onRowClick={(r) => navigate(tireLink(r))}
      sortable={SORTABLE} sort={sort} dir={dir} onSort={onSort} />
  )
}
