import { createColumnHelper, rowSortingFeature, tableFeatures, useTable, type ColumnDef, type RowData } from '@tanstack/react-table'
import type { SortDir } from '../../lib/sort'

// Rows arrive already sorted by the page (so phone cards and this table match);
// the sorting feature here only drives the clickable headers.
const features = tableFeatures({ rowSortingFeature })
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
  // Columns not in this list are not sortable
  sortable?: readonly string[]
  sort?: string | null
  dir?: SortDir
  onSort?: (column: string) => void
}

function SortArrow({ state }: { state: false | 'asc' | 'desc' }) {
  return (
    <svg viewBox="0 0 12 16" className="h-4 w-3 shrink-0" aria-hidden>
      <path d="M6 1 11 6H1z" className={state === 'asc' ? 'fill-blue-700' : 'fill-slate-300'} />
      <path d="M6 15 1 10h10z" className={state === 'desc' ? 'fill-blue-700' : 'fill-slate-300'} />
    </svg>
  )
}

// Desktop table. Rows are clickable; each row also has a real link
// in its first cell for keyboard and screen-reader users.
export function DataTable<T extends RowData>({
  columns, data, getRowId, onRowClick, rowClassName, caption, sortable = [], sort = null, dir = 'asc', onSort,
}: Props<T>) {
  const table = useTable({
    features,
    columns,
    data,
    getRowId,
    manualSorting: true,
    enableMultiSort: false,
    state: { sorting: sort ? [{ id: sort, desc: dir === 'desc' }] : [] },
    // Header clicks go to the page, which keeps the sort in the URL
    onSortingChange: () => {},
  })

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-base">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b-2 border-slate-200 bg-slate-50 text-sm uppercase tracking-wide text-slate-600">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const canSort = !!onSort && sortable.includes(header.column.id)
                const state = header.column.getIsSorted()
                return (
                  <th key={header.id} scope="col" className="px-2 py-1 font-semibold"
                    aria-sort={state === 'asc' ? 'ascending' : state === 'desc' ? 'descending' : canSort ? 'none' : undefined}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button type="button" onClick={() => onSort(header.column.id)}
                        className={`flex min-h-11 items-center gap-1.5 rounded-lg px-2 uppercase tracking-wide hover:bg-slate-200
                          ${state ? 'text-blue-800' : ''}`}>
                        <table.FlexRender header={header} />
                        <SortArrow state={state} />
                      </button>
                    ) : (
                      <span className="block px-2 py-3"><table.FlexRender header={header} /></span>
                    )}
                  </th>
                )
              })}
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
