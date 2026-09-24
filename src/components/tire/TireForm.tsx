import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useInvalidateAll } from '../../hooks/useInvalidate'
import { api, fieldErrors } from '../../lib/api'
import { parseDot } from '../../lib/dot'
import { parseNum, positionLabel, round1, todayIso } from '../../lib/format'
import type { Tire, TireFieldsInput, TireType } from '../../lib/types'
import { Button } from '../ui/Button'
import { FormError, NumberField, SelectField, TextAreaField, TextField } from '../ui/Field'
import { Segmented } from '../ui/Segmented'

type Props =
  | { mode: 'add'; unitId: number; positions: string[]; position: string; onDone: () => void }
  | { mode: 'edit'; tire: Tire; onDone: () => void }

const str = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v))

// Add a tire to an empty position, or edit a tire's details
export function TireForm(props: Props) {
  const tire = props.mode === 'edit' ? props.tire : null
  const [v, setV] = useState({
    position: props.mode === 'add' ? props.position : '',
    serial_number: str(tire?.serial_number),
    dot_code: str(tire?.dot_code),
    brand: str(tire?.brand),
    model: str(tire?.model),
    size: str(tire?.size),
    tire_type: (tire?.tire_type ?? 'new') as TireType,
    original_tread_32: tire?.original_tread_32 === null || tire?.original_tread_32 === undefined ? '' : round1(tire.original_tread_32),
    install_date: todayIso(),
    notes: str(tire?.notes),
  })
  const set = (key: keyof typeof v) => (value: string) => setV((prev) => ({ ...prev, [key]: value }))
  const invalidate = useInvalidateAll()

  const dot = parseDot(v.dot_code)
  const tread = parseNum(v.original_tread_32)

  const mutation = useMutation({
    mutationFn: async (): Promise<unknown> => {
      const text = (s: string) => s.trim() || undefined
      const fields: TireFieldsInput = {
        serial_number: text(v.serial_number),
        dot_code: text(v.dot_code),
        // Sent explicitly so editing the DOT code also updates the age
        dot_week: dot?.week,
        dot_year: dot?.year,
        brand: text(v.brand),
        model: text(v.model),
        size: text(v.size),
        tire_type: v.tire_type,
        original_tread_32: tread,
        notes: text(v.notes),
      }
      if (props.mode === 'edit') return api.updateTire(props.tire.id, fields)
      return api.createTire({ ...fields, unit_id: props.unitId, position: v.position, install_date: v.install_date || undefined })
    },
    onSuccess: async () => {
      await invalidate()
      props.onDone()
    },
  })
  const errors = fieldErrors(mutation.error)
  const localTreadError = tread !== undefined && Number.isNaN(tread) ? 'Enter a number' : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (localTreadError) return
    mutation.mutate()
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {props.mode === 'add' && (
        <SelectField label="Position" value={v.position} onChange={(e) => set('position')(e.target.value)} error={errors.fields.position}>
          {props.positions.map((p) => <option key={p} value={p}>{positionLabel(p)} ({p})</option>)}
        </SelectField>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Brand" value={v.brand} onChange={(e) => set('brand')(e.target.value)} error={errors.fields.brand} autoCapitalize="words" />
        <TextField label="Model" value={v.model} onChange={(e) => set('model')(e.target.value)} error={errors.fields.model} />
        <TextField label="Size" placeholder="11R22.5" value={v.size} onChange={(e) => set('size')(e.target.value)} error={errors.fields.size} />
        <TextField label="Serial" value={v.serial_number} onChange={(e) => set('serial_number')(e.target.value)}
          error={errors.fields.serial_number} autoCapitalize="characters" />
      </div>

      <TextField label="DOT code" value={v.dot_code} onChange={(e) => set('dot_code')(e.target.value)} autoCapitalize="characters"
        placeholder="e.g. DOT 4B9E 1024"
        error={errors.fields.dot_code ?? errors.fields.dot_week ?? errors.fields.dot_year}
        hint={dot ? `Made week ${dot.week} of ${dot.year}` : 'The last 4 digits are the week and year it was made'} />

      <Segmented label="Type" value={v.tire_type} onChange={set('tire_type')}
        options={[{ value: 'new', label: 'New' }, { value: 'retread', label: 'Retread' }]} />

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Original tread (32nds)" value={v.original_tread_32} onChange={(e) => set('original_tread_32')(e.target.value)}
          error={localTreadError ?? errors.fields.original_tread_32} />
        {props.mode === 'add' && (
          <TextField label="Install date" type="date" value={v.install_date} onChange={(e) => set('install_date')(e.target.value)}
            error={errors.fields.install_date} />
        )}
      </div>

      <TextAreaField label="Notes" value={v.notes} onChange={(e) => set('notes')(e.target.value)} error={errors.fields.notes} />

      <FormError message={errors.general} />
      <Button type="submit" variant="primary" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : props.mode === 'add' ? 'Add tire' : 'Save changes'}
      </Button>
    </form>
  )
}
