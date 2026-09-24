import type { AttentionFilters, UnitFilters } from './types'

export const qk = {
  summary: ['dashboard', 'summary'] as const,
  attention: (f: AttentionFilters) => ['tires', 'attention', f] as const,
  units: (f: UnitFilters) => ['units', 'list', f] as const,
  unit: (id: number) => ['units', 'detail', id] as const,
  tire: (id: number) => ['tires', 'detail', id] as const,
  settings: ['settings'] as const,
  carriers: ['carriers'] as const,
}
