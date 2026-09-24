import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { AXLE_LAYOUTS, type LayoutKey } from '../../shared/layouts'
import { useCarriers } from '../../hooks/useCarriers'
import { useInvalidateAll } from '../../hooks/useInvalidate'
import { api, ApiError, fieldErrors } from '../../lib/api'
import type { Unit, UnitClass, UnitInput, UnitStatus } from '../../lib/types'
import { Button } from '../ui/Button'
import { FormError, SelectField, TextAreaField, TextField } from '../ui/Field'
import { Segmented } from '../ui/Segmented'
import { VinDecoder } from './VinDecoder'

const NEW_CARRIER = '__new__'
const EQUIPMENT = ['Tractor', 'Semi-truck trailer', 'Chassis', 'Flatbed', 'Reefer', 'Tanker']

const layoutsFor = (unitClass: UnitClass) =>
  (Object.keys(AXLE_LAYOUTS) as LayoutKey[]).filter((k) => AXLE_LAYOUTS[k].unitClass === unitClass)

const str = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v))

export function UnitForm({ unit, hasTires, onSaved }: { unit?: Unit; hasTires?: boolean; onSaved: (id: number) => void }) {
  const [v, setV] = useState({
    unit_number: str(unit?.unit_number),
    unit_class: (unit?.unit_class ?? 'tractor') as UnitClass,
    axle_layout: unit?.axle_layout ?? layoutsFor('tractor')[0],
    carrier_id: str(unit?.carrier_id),
    new_carrier: '',
    equipment_type: unit ? str(unit.equipment_type) : 'Tractor',
    plate: str(unit?.plate),
    vin: str(unit?.vin),
    make: str(unit?.make),
    model_year: str(unit?.model_year),
    mvi_expiry: str(unit?.mvi_expiry),
    status: (unit?.status ?? 'active') as UnitStatus,
    notes: str(unit?.notes),
  })
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((prev) => ({ ...prev, [key]: value }))
  const { data: carriers } = useCarriers()
  const invalidate = useInvalidateAll()

  const changeClass = (unitClass: UnitClass) =>
    setV((prev) => ({
      ...prev,
      unit_class: unitClass,
      axle_layout: AXLE_LAYOUTS[prev.axle_layout as LayoutKey]?.unitClass === unitClass ? prev.axle_layout : layoutsFor(unitClass)[0],
      equipment_type: prev.equipment_type || (unitClass === 'tractor' ? 'Tractor' : 'Semi-truck trailer'),
    }))

  const mutation = useMutation({
    mutationFn: async () => {
      const text = (s: string) => s.trim() || undefined
      let carrierId = v.carrier_id && v.carrier_id !== NEW_CARRIER ? Number(v.carrier_id) : undefined
      if (v.carrier_id === NEW_CARRIER && v.new_carrier.trim()) {
        carrierId = (await api.createCarrier(v.new_carrier.trim())).id
      }
      const body: UnitInput = {
        unit_number: v.unit_number.trim(),
        unit_class: v.unit_class,
        axle_layout: v.axle_layout,
        carrier_id: carrierId,
        equipment_type: text(v.equipment_type),
        plate: text(v.plate),
        vin: text(v.vin),
        make: text(v.make),
        model_year: v.model_year.trim() ? Number(v.model_year) : undefined,
        mvi_expiry: text(v.mvi_expiry),
        status: v.status,
        notes: text(v.notes),
      }
      if (unit) {
        await api.updateUnit(unit.id, body)
        return unit.id
      }
      return (await api.createUnit(body)).id
    },
    onSuccess: async (id) => {
      await invalidate()
      onSaved(id)
    },
  })

  const errors = fieldErrors(mutation.error)
  // Duplicate unit number or VIN comes back as a 409 with the column in `detail`
  if (mutation.error instanceof ApiError && mutation.error.status === 409) {
    const detail = String((mutation.error.body as { detail?: string } | null)?.detail ?? '')
    if (detail.includes('units.unit_number')) errors.fields.unit_number = 'Another unit already has this number'
    else if (detail.includes('units.vin')) errors.fields.vin = 'Another unit already has this VIN'
    else if (detail.includes('carriers.name')) errors.fields.carrier_id = 'That carrier already exists. Pick it from the list.'
    if (Object.keys(errors.fields).length) errors.general = null
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  const layoutChanged = unit && v.axle_layout !== unit.axle_layout

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Unit number" value={v.unit_number} required autoCapitalize="characters"
          onChange={(e) => set('unit_number', e.target.value)} error={errors.fields.unit_number} />
        <Segmented label="Class" value={v.unit_class} onChange={changeClass}
          options={[{ value: 'tractor', label: 'Tractor' }, { value: 'trailer', label: 'Trailer' }]} />
      </div>

      <SelectField label="Axle layout" value={v.axle_layout} onChange={(e) => set('axle_layout', e.target.value)}
        error={errors.fields.axle_layout}
        hint={layoutChanged && hasTires ? 'This unit has tires mounted. Positions that no longer exist in the new layout will not show on the diagram.' : undefined}>
        {layoutsFor(v.unit_class).map((k) => <option key={k} value={k}>{AXLE_LAYOUTS[k].label}</option>)}
      </SelectField>

      <VinDecoder vin={v.vin} error={errors.fields.vin} onChange={(vin) => set('vin', vin)}
        onDecoded={(r) => setV((prev) => ({
          ...prev,
          make: r.make ?? prev.make,
          model_year: r.year ? String(r.year) : prev.model_year,
        }))} />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Make" value={v.make} onChange={(e) => set('make', e.target.value)} error={errors.fields.make} />
        <TextField label="Year" inputMode="numeric" value={v.model_year} maxLength={4}
          onChange={(e) => set('model_year', e.target.value.replace(/\D/g, ''))} error={errors.fields.model_year} />
        <TextField label="Plate" value={v.plate} autoCapitalize="characters" onChange={(e) => set('plate', e.target.value)}
          error={errors.fields.plate} />
        <TextField label="MVI expiry" type="date" value={v.mvi_expiry} onChange={(e) => set('mvi_expiry', e.target.value)}
          error={errors.fields.mvi_expiry} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <SelectField label="Carrier" value={v.carrier_id} onChange={(e) => set('carrier_id', e.target.value)} error={errors.fields.carrier_id}>
            <option value="">None</option>
            {carriers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value={NEW_CARRIER}>+ New carrier…</option>
          </SelectField>
          {v.carrier_id === NEW_CARRIER && (
            <TextField className="mt-2" label="New carrier name" value={v.new_carrier} onChange={(e) => set('new_carrier', e.target.value)}
              error={errors.fields.name} />
          )}
        </div>
        <div>
          <TextField label="Equipment type" list="equipment-types" value={v.equipment_type}
            onChange={(e) => set('equipment_type', e.target.value)} error={errors.fields.equipment_type} />
          <datalist id="equipment-types">{EQUIPMENT.map((x) => <option key={x} value={x} />)}</datalist>
        </div>
      </div>

      {unit && (
        <Segmented label="Status" value={v.status} onChange={(s) => set('status', s)}
          options={[{ value: 'active', label: 'Active' }, { value: 'out_of_service', label: 'Out of service' }, { value: 'retired', label: 'Retired' }]} />
      )}

      <TextAreaField label="Notes" value={v.notes} onChange={(e) => set('notes', e.target.value)} error={errors.fields.notes} />

      <FormError message={errors.general} />
      <Button type="submit" variant="primary" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : unit ? 'Save changes' : 'Add unit'}
      </Button>
    </form>
  )
}
