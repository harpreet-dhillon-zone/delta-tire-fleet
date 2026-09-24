import { useCarriers } from '../../hooks/useCarriers'
import { Button } from '../ui/Button'
import { SelectField, TextField } from '../ui/Field'

export const UNIT_KEYS = ['search', 'carrier_id', 'unit_class'] as const
export type UnitKey = (typeof UNIT_KEYS)[number]

type Props = {
  values: Record<UnitKey, string>
  set: (key: UnitKey, value: string) => void
  clear: () => void
  activeCount: number
}

export function UnitFilters({ values, set, clear, activeCount }: Props) {
  const { data: carriers } = useCarriers()
  return (
    <section aria-label="Filters" className="rounded-xl bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
        <TextField className="col-span-2 md:col-span-1" label="Search" type="search" placeholder="Unit, plate or VIN"
          value={values.search} onChange={(e) => set('search', e.target.value)} />
        <SelectField label="Carrier" value={values.carrier_id} onChange={(e) => set('carrier_id', e.target.value)}>
          <option value="">All</option>
          {carriers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <SelectField label="Class" value={values.unit_class} onChange={(e) => set('unit_class', e.target.value)}>
          <option value="">All</option>
          <option value="tractor">Tractors</option>
          <option value="trailer">Trailers</option>
        </SelectField>
        {activeCount > 0 && (
          <Button variant="ghost" className="col-span-2 md:col-span-1" onClick={clear}>Clear</Button>
        )}
      </div>
    </section>
  )
}
