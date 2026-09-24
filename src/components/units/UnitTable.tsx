import { Link, useNavigate } from 'react-router-dom'
import { titleCase } from '../../lib/format'
import type { SortDir } from '../../lib/sort'
import type { UnitSummary } from '../../lib/types'
import { columnHelper, DataTable, type Columns } from '../table/DataTable'
import { MviBadge } from './MviBadge'
import { UnitStatusBadge } from './UnitStatusBadge'
import { UNIT_SORT } from './unitSort'

const helper = columnHelper<UnitSummary>()

const columns = [
  helper.accessor('unit_number', {
    header: 'Unit',
    cell: ({ row }) => (
      <Link to={`/units/${row.original.id}`} onClick={(e) => e.stopPropagation()} className="text-lg font-bold text-blue-800 hover:underline">
        {row.original.unit_number}
      </Link>
    ),
  }),
  helper.accessor('unit_class', {
    header: 'Class',
    cell: ({ row }) => (
      <span>
        {titleCase(row.original.unit_class)}
        {row.original.status !== 'active' && <span className="block text-sm font-semibold text-slate-600">{titleCase(row.original.status)}</span>}
      </span>
    ),
  }),
  helper.accessor('carrier', { header: 'Carrier', cell: (info) => info.getValue() ?? '—' }),
  helper.accessor('plate', { header: 'Plate', cell: (info) => info.getValue() ?? '—' }),
  helper.accessor('vin', { header: 'VIN', cell: (info) => <span className="font-mono text-sm">{info.getValue() ?? '—'}</span> }),
  helper.accessor('mvi_expiry', { header: 'MVI expiry', cell: (info) => <MviBadge expiry={info.getValue()} /> }),
  helper.accessor('worst_severity', { header: 'Tire status', cell: ({ row }) => <UnitStatusBadge unit={row.original} /> }),
] as Columns<UnitSummary>

const SORTABLE = Object.keys(UNIT_SORT)

type Props = { units: UnitSummary[]; sort: string | null; dir: SortDir; onSort: (column: string) => void }

export function UnitTable({ units, sort, dir, onSort }: Props) {
  const navigate = useNavigate()
  return (
    <DataTable caption="Units" columns={columns} data={units}
      getRowId={(u) => String(u.id)} onRowClick={(u) => navigate(`/units/${u.id}`)}
      sortable={SORTABLE} sort={sort} dir={dir} onSort={onSort} />
  )
}
