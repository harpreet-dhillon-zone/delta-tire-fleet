import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { qk } from '../lib/queryKeys'
import type { Thresholds } from '../lib/status'

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: api.settings, staleTime: 5 * 60_000 })
}

// Settings as a key -> value map for status calculations
export function useThresholds(): Thresholds | undefined {
  const { data } = useSettings()
  return data ? Object.fromEntries(data.map((s) => [s.key, s.value])) : undefined
}
