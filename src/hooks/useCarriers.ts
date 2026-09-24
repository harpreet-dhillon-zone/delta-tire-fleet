import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { qk } from '../lib/queryKeys'

export function useCarriers() {
  return useQuery({ queryKey: qk.carriers, queryFn: api.carriers, staleTime: 5 * 60_000 })
}
