import { createColumnHelper, tableFeatures, useTable, type ColumnDef, type RowData } from '@tanstack/react-table'

// Plain tables: data is already sorted and filtered by the API
const features = tableFeatures({})
type Features = typeof features

export type Columns<T extends RowData> = ColumnDef<Features, T, any>[]

export const columnHelper = <T extends RowData>() => createColumnHelper<Features, T>()

type Props<T extends RowData> = {
  columns: Columns<T>
  data: T[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string
  caption: string
}

// Desktop table. Rows are clickable; each row also has a real link
// in its first cell for keyboard and screen-reader users.
export function DataTable<T extends RowData>({ columns, data, getRowId, onRowClick, rowClassName, caption }: Props<T>) {
  const table = useTable({ features, columns, data, getRowId })

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-base">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b-2 border-slate-200 bg-slate-50 text-sm uppercase tracking-wide text-slate-600">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} scope="col" className="px-4 py-3 font-semibold">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={`border-b border-slate-100 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''} ${rowClassName?.(row.original) ?? ''}`}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="h-14 px-4 py-2 align-middle">
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
