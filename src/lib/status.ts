// Status rules, mirroring v_tire_status in migrations/0001_initial.sql so the
// inspection screen can preview a status before it is saved.
import type { AxleRole, Status, UnitClass } from './types'

export const STATUS_META: Record<Status, { label: string; badge: string; fill: string; accent: string }> = {
  critical: {
    label: 'Critical',
    badge: 'bg-red-50 text-red-800 border-red-300',
    fill: 'bg-red-600 text-white border-red-800',
    accent: 'border-red-600',
  },
  warning: {
    label: 'Warning',
    badge: 'bg-amber-50 text-amber-900 border-amber-400',
    fill: 'bg-amber-400 text-amber-950 border-amber-600',
    accent: 'border-amber-500',
  },
  no_data: {
    label: 'No data',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    fill: 'bg-slate-200 text-slate-800 border-slate-400',
    accent: 'border-slate-400',
  },
  ok: {
    label: 'OK',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-400',
    fill: 'bg-emerald-600 text-white border-emerald-800',
    accent: 'border-emerald-600',
  },
}

const RANK: Record<Status, number> = { ok: 0, no_data: 1, warning: 2, critical: 3 }

// The API's severity number: 3 critical, 2 warning, 1 no data, 0 ok
export function severityToStatus(severity: number | null | undefined): Status {
  if (severity === 3) return 'critical'
  if (severity === 2) return 'warning'
  if (severity === 0) return 'ok'
  return 'no_data'
}

export function worstStatus(...statuses: (Status | null | undefined)[]): Status {
  let worst: Status = 'ok'
  let any = false
  for (const s of statuses) {
    if (!s) continue
    any = true
    if (RANK[s] > RANK[worst]) worst = s
  }
  return any ? worst : 'no_data'
}

export type Thresholds = Record<string, number>

export function axleRoleFor(unitClass: UnitClass, position: string): AxleRole {
  if (unitClass === 'trailer') return 'trailer'
  return position.startsWith('A1-') ? 'steer' : 'drive'
}

export function minTread(...values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
  return nums.length ? Math.min(...nums) : null
}

export function treadStatus(min: number | null, role: AxleRole, t: Thresholds): Status {
  if (min === null) return 'no_data'
  const crit = t[`${role}_critical_32`]
  const warn = t[`${role}_warn_32`]
  if (crit !== undefined && min <= crit) return 'critical'
  if (warn !== undefined && min <= warn) return 'warning'
  return 'ok'
}

export const ROLE_LABEL: Record<AxleRole, string> = { steer: 'Steer', drive: 'Drive', trailer: 'Trailer' }
