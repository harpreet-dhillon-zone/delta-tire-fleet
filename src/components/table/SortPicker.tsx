import type { SortDir, SortSpec } from '../../lib/sort'
import { SelectField } from '../ui/Field'

type Props<T> = {
  spec: SortSpec<T>
  defaultLabel: string
  sort: string | null
  dir: SortDir
  onChange: (column: string | null, dir: SortDir) => void
}

// Phone sort control: column dropdown plus a big direction toggle
export function SortPicker<T>({ spec, defaultLabel, sort, dir, onChange }: Props<T>) {
  return (
    <div className="flex items-end gap-2">
      <SelectField className="min-w-0 flex-1" label="Sort by" value={sort ?? ''}
        onChange={(e) => onChange(e.target.value || null, dir)}>
        <option value="">{defaultLabel}</option>
        {Object.entries(spec).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
      </SelectField>
      <button type="button" disabled={!sort} onClick={() => onChange(sort, dir === 'asc' ? 'desc' : 'asc')}
        aria-label={`Sort direction: ${dir === 'asc' ? 'ascending' : 'descending'}. Tap to reverse.`}
        className="flex h-12 min-w-36 items-center justify-center gap-1 rounded-xl border-2 border-slate-300 bg-white px-3 text-base font-semibold
          text-slate-800 disabled:text-slate-400">
        <span aria-hidden>{dir === 'asc' ? '↑' : '↓'}</span>
        {dir === 'asc' ? 'Ascending' : 'Descending'}
      </button>
    </div>
  )
}
