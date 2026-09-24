import type { ReactNode } from 'react'
import { AXLE_LAYOUTS, isLayoutKey } from '../../shared/layouts'
import { titleCase } from '../../lib/format'
import type { Unit } from '../../lib/types'
import { MviBadge } from './MviBadge'

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="break-words text-base font-semibold">{children}</dd>
    </div>
  )
}

export function UnitHeader({ unit, actions }: { unit: Unit; actions?: ReactNode }) {
  const layout = isLayoutKey(unit.axle_layout) ? AXLE_LAYOUTS[unit.axle_layout].label : unit.axle_layout
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{unit.unit_number}</h1>
          <p className="text-base text-slate-700">
            {[unit.model_year, unit.make].filter(Boolean).join(' ')}
            {(unit.model_year || unit.make) && ' · '}
            {unit.equipment_type || titleCase(unit.unit_class)}
            {unit.carrier && ` · ${unit.carrier}`}
          </p>
          {unit.status !== 'active' && (
            <p className="mt-1 inline-block rounded-lg bg-slate-800 px-2 py-0.5 text-sm font-bold text-white">
              {titleCase(unit.status)}
            </p>
          )}
        </div>
        {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Item label="Plate">{unit.plate ?? '—'}</Item>
        <Item label="MVI expiry"><MviBadge expiry={unit.mvi_expiry} /></Item>
        <Item label="VIN"><span className="font-mono text-sm">{unit.vin ?? '—'}</span></Item>
        <Item label="Layout">{layout}</Item>
      </dl>
      {unit.notes && <p className="mt-3 whitespace-pre-wrap text-base text-slate-700">{unit.notes}</p>}
    </section>
  )
}
