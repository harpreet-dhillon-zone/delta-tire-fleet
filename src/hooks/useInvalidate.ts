import { useQueryClient } from '@tanstack/react-query'

// Every write can change tire statuses, unit summaries and the dashboard,
// so after a save we refetch whatever is on screen.
export function useInvalidateAll() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}
