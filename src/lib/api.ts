// The one place the frontend talks to the API. Every endpoint in
// src/worker/routes/ has a typed function here.
import type {
  AttentionFilters, AttentionRow, Carrier, DashboardSummary, InspectionInput, Issue, Setting,
  TireCreateInput, TireDetail, TireFieldsInput, TireMoveInput, UnitDetail, UnitFilters, UnitInput,
  UnitSummary, VinDecode,
} from './types'

export class ApiError extends Error {
  status: number
  issues: Issue[]
  body: unknown

  constructor(status: number, message: string, issues: Issue[], body: unknown) {
    super(message)
    this.status = status
    this.issues = issues
    this.body = body
  }
}

type ErrorBody = { error?: string; issues?: Issue[]; missing?: number[]; unknown?: string[] }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No connection. Check your signal and try again.', [], null)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data ?? {}) as ErrorBody
    let message = err.error ?? `Request failed (${res.status})`
    if (err.missing?.length) message += `: ${err.missing.join(', ')}`
    if (err.unknown?.length) message += `: ${err.unknown.join(', ')}`
    throw new ApiError(res.status, message, err.issues ?? [], data)
  }
  return data as T
}

// Builds "?a=1&b=2", skipping empty values
function qs(params: object): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const api = {
  dashboardSummary: () => request<DashboardSummary>('GET', '/dashboard/summary'),

  attention: (filters: AttentionFilters) => request<AttentionRow[]>('GET', `/tires/attention${qs(filters)}`),

  units: (filters: UnitFilters) => request<UnitSummary[]>('GET', `/units${qs(filters)}`),
  unit: (id: number) => request<UnitDetail>('GET', `/units/${id}`),
  createUnit: (body: UnitInput) => request<{ id: number }>('POST', '/units', body),
  updateUnit: (id: number, body: Partial<UnitInput>) => request<{ ok: true }>('PATCH', `/units/${id}`, body),

  tire: (id: number) => request<TireDetail>('GET', `/tires/${id}`),
  createTire: (body: TireCreateInput) => request<{ id: number }>('POST', '/tires', body),
  updateTire: (id: number, body: TireFieldsInput) => request<{ ok: true }>('PATCH', `/tires/${id}`, body),
  moveTire: (id: number, body: TireMoveInput) => request<{ ok: true }>('POST', `/tires/${id}/move`, body),

  createInspection: (body: InspectionInput) => request<{ saved: number }>('POST', '/inspections', body),
  deleteInspection: (id: number) => request<{ ok: true }>('DELETE', `/inspections/${id}`),

  settings: () => request<Setting[]>('GET', '/settings'),
  updateSettings: (values: Record<string, number>) => request<{ ok: true }>('PUT', '/settings', values),

  carriers: () => request<Carrier[]>('GET', '/carriers'),
  createCarrier: (name: string) => request<{ id: number }>('POST', '/carriers', { name }),

  decodeVin: (vin: string) => request<VinDecode>('GET', `/vin/${encodeURIComponent(vin)}`),
}

// Splits API validation issues into per-field messages and one general message.
// `prefix` strips a leading path, e.g. "readings.0." for one inspection row.
export function fieldErrors(error: unknown, prefix = ''): { fields: Record<string, string>; general: string | null } {
  if (!(error instanceof ApiError)) {
    return { fields: {}, general: error ? String((error as Error).message ?? error) : null }
  }
  const fields: Record<string, string> = {}
  const unmatched: string[] = []
  for (const issue of error.issues) {
    if (issue.field && issue.field.startsWith(prefix) && issue.field !== prefix.replace(/\.$/, '')) {
      const key = issue.field.slice(prefix.length)
      fields[key] ??= issue.message
    } else {
      unmatched.push(issue.message)
    }
  }
  const general = error.issues.length ? (unmatched.length ? unmatched.join('. ') : null) : error.message
  return { fields, general }
}
