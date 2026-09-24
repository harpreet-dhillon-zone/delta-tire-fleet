import { Link, useNavigate } from 'react-router-dom'
import { titleCase } from '../../lib/format'
import type { UnitSummary } from '../../lib/types'
import { columnHelper, DataTable, type Columns } from '../table/DataTable'
import { MviBadge } from './MviBadge'
import { UnitStatusBadge } from './UnitStatusBadge'

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
  helper.accessor('worst_severity', { header: 'Tires', cell: ({ row }) => <UnitStatusBadge unit={row.original} /> }),
] as Columns<UnitSummary>

export function UnitTable({ units }: { units: UnitSummary[] }) {
  const navigate = useNavigate()
  return (
    <DataTable caption="Units, worst tire status first" columns={columns} data={units}
      getRowId={(u) => String(u.id)} onRowClick={(u) => navigate(`/units/${u.id}`)} />
  )
}
