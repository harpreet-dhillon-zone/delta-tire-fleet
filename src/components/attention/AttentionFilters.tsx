import { useState } from 'react'
import { useCarriers } from '../../hooks/useCarriers'
import { Button } from '../ui/Button'
import { SelectField, TextField } from '../ui/Field'
import { CLASS_OPTIONS, ROLE_OPTIONS, STATUS_OPTIONS } from './filterOptions'

export const ATTENTION_KEYS = ['unit', 'carrier', 'unit_class', 'axle_role', 'tread_status', 'age_status'] as const
export type AttentionKey = (typeof ATTENTION_KEYS)[number]

type Props = {
  values: Record<AttentionKey, string>
  set: (key: AttentionKey, value: string) => void
  clear: () => void
  activeCount: number
}

export function AttentionFilters({ values, set, clear, activeCount }: Props) {
  const [open, setOpen] = useState(false)
  const { data: carriers } = useCarriers()
  const selectCount = activeCount - (values.unit ? 1 : 0)

  const select = (key: AttentionKey, label: string, options: { value: string; label: string }[]) => (
    <SelectField label={label} value={values[key]} onChange={(e) => set(key, e.target.value)}>
      <option value="">All</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </SelectField>
  )

  return (
    <section aria-label="Filters" className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-end gap-2">
        <TextField className="flex-1" label="Unit number" type="search" inputMode="search" placeholder="e.g. T100"
          value={values.unit} onChange={(e) => set('unit', e.target.value)} />
        <Button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Filters{selectCount ? ` (${selectCount})` : ''}
        </Button>
      </div>

      <div className={`${open ? 'grid' : 'hidden'} mt-3 grid-cols-2 gap-3 md:grid md:grid-cols-5`}>
        {select('carrier', 'Carrier', (carriers ?? []).map((c) => ({ value: c.name, label: c.name })))}
        {select('unit_class', 'Tractor / trailer', CLASS_OPTIONS)}
        {select('axle_role', 'Axle', ROLE_OPTIONS)}
        {select('tread_status', 'Tread', STATUS_OPTIONS)}
        {select('age_status', 'Age', STATUS_OPTIONS)}
      </div>

      {activeCount > 0 && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={clear}>Clear filters</Button>
        </div>
      )}
    </section>
  )
}
