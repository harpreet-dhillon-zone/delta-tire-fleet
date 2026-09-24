import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useInvalidateAll } from '../../hooks/useInvalidate'
import { api, fieldErrors } from '../../lib/api'
import { positionLabel, titleCase, todayIso } from '../../lib/format'
import { qk } from '../../lib/queryKeys'
import type { Tire, TireStatus } from '../../lib/types'
import { Button } from '../ui/Button'
import { FormError, SelectField, TextField } from '../ui/Field'
import { Segmented } from '../ui/Segmented'

type Action = 'move' | 'stock' | 'scrap'

const REASONS: Record<Action, string[]> = {
  move: ['rotation', 'match_duals', 'repair_returned'],
  stock: ['removed_worn', 'flat', 'repair', 'unit_retired'],
  scrap: ['worn_out', 'damaged', 'too_old', 'failed_inspection'],
}

const STATUS_FOR: Record<Action, TireStatus> = { move: 'mounted', stock: 'in_stock', scrap: 'scrapped' }

// Rotate to another position or unit, pull to stock, or scrap. A reason is required.
export function MoveTireForm({ tire, onDone }: { tire: Tire; onDone: () => void }) {
  const [action, setAction] = useState<Action>('move')
  const [unitId, setUnitId] = useState(tire.unit_id ? String(tire.unit_id) : '')
  const [position, setPosition] = useState('')
  const [reason, setReason] = useState('')
  const [movedAt, setMovedAt] = useState(todayIso())
  const [missing, setMissing] = useState<Record<string, string>>({})
  const invalidate = useInvalidateAll()

  const { data: units } = useQuery({ queryKey: qk.units({}), queryFn: () => api.units({}) })
  const target = useQuery({
    queryKey: qk.unit(Number(unitId)),
    queryFn: () => api.unit(Number(unitId)),
    enabled: action === 'move' && !!unitId,
  })
  const taken = new Set(target.data?.tires.map((t) => t.position))
  const freePositions = target.data?.positions.filter((p) => !taken.has(p)) ?? []

  const mutation = useMutation({
    mutationFn: () => api.moveTire(tire.id, {
      to_unit_id: action === 'move' ? Number(unitId) : null,
      to_position: action === 'move' ? position : null,
      new_status: STATUS_FOR[action],
      reason: reason.trim(),
      moved_at: movedAt || undefined,
    }),
    onSuccess: async () => {
      await invalidate()
      onDone()
    },
  })
  const errors = fieldErrors(mutation.error)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const m: Record<string, string> = {}
    if (action === 'move' && !unitId) m.to_unit_id = 'Choose a unit'
    if (action === 'move' && !position) m.to_position = 'Choose a position'
    if (!reason.trim()) m.reason = 'A reason is required'
    setMissing(m)
    if (!Object.keys(m).length) mutation.mutate()
  }

  const changeAction = (a: Action) => {
    setAction(a)
    setReason('')
    setMissing({})
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-base text-slate-700">
        Now: <span className="font-semibold">
          {tire.unit_number ? `${tire.unit_number} · ${positionLabel(tire.position)}` : titleCase(tire.status)}
        </span>
      </p>

      <Segmented label="What are you doing?" value={action} onChange={changeAction}
        options={[{ value: 'move', label: 'Move' }, { value: 'stock', label: 'To stock' }, { value: 'scrap', label: 'Scrap' }]} />

      {action === 'move' && (
        <>
          <SelectField label="To unit" value={unitId} error={missing.to_unit_id ?? errors.fields.to_unit_id}
            onChange={(e) => { setUnitId(e.target.value); setPosition('') }}>
            <option value="">Choose a unit…</option>
            {units?.map((u) => <option key={u.id} value={u.id}>{u.unit_number}{u.carrier ? ` · ${u.carrier}` : ''}</option>)}
          </SelectField>
          <SelectField label="To position" value={position} disabled={!target.data}
            error={missing.to_position ?? errors.fields.to_position}
            hint={target.data && !freePositions.length ? 'No empty positions on this unit. Pull a tire to stock first to swap.' : 'Only empty positions are listed'}
            onChange={(e) => setPosition(e.target.value)}>
            <option value="">{target.isFetching ? 'Loading…' : 'Choose a position…'}</option>
            {freePositions.map((p) => <option key={p} value={p}>{positionLabel(p)} ({p})</option>)}
          </SelectField>
        </>
      )}

      <div>
        <TextField label="Reason" value={reason} maxLength={60} onChange={(e) => setReason(e.target.value)}
          error={missing.reason ?? errors.fields.reason} placeholder="Pick one below or type" />
        <div className="mt-2 flex flex-wrap gap-2">
          {REASONS[action].map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={`min-h-11 rounded-full border-2 px-4 text-base font-semibold
                ${reason === r ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700'}`}>
              {titleCase(r)}
            </button>
          ))}
        </div>
      </div>

      <TextField label="Date" type="date" value={movedAt} onChange={(e) => setMovedAt(e.target.value)} error={errors.fields.moved_at} />

      <FormError message={errors.general} />
      <Button type="submit" variant={action === 'scrap' ? 'danger' : 'primary'} className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : action === 'move' ? 'Move tire' : action === 'stock' ? 'Pull to stock' : 'Scrap tire'}
      </Button>
    </form>
  )
}
