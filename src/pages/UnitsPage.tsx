import { useQuery } from '@tanstack/react-query'
import { ButtonLink } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, Loading } from '../components/ui/States'
import { UnitCards } from '../components/units/UnitCards'
import { UNIT_KEYS, UnitFilters } from '../components/units/UnitFilters'
import { UnitTable } from '../components/units/UnitTable'
import { useDebounced } from '../hooks/useDebounced'
import { useUrlFilters } from '../hooks/useUrlFilters'
import { api } from '../lib/api'
import { qk } from '../lib/queryKeys'
import type { UnitFilters as Filters } from '../lib/types'

export function UnitsPage() {
  const filters = useUrlFilters(UNIT_KEYS)
  const search = useDebounced(filters.values.search)
  const query: Filters = {
    search,
    carrier_id: filters.values.carrier_id ? Number(filters.values.carrier_id) : undefined,
    unit_class: (filters.values.unit_class || undefined) as Filters['unit_class'],
  }
  const { data: units, error, isPending, refetch, isFetching } = useQuery({
    queryKey: qk.units(query),
    queryFn: () => api.units(query),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-4">
      <PageHeader title="Units" actions={<ButtonLink to="/units/new" variant="primary">+ Add unit</ButtonLink>} />
      <UnitFilters {...filters} />
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : units.length === 0 ? (
        <EmptyState title="No units match">{filters.activeCount > 0 && 'Try a different search or clear filters.'}</EmptyState>
      ) : (
        <section aria-label="Units" className={isFetching ? 'opacity-70 transition-opacity' : ''}>
          <p className="mb-2 text-base text-slate-600" aria-live="polite">
            {units.length} {units.length === 1 ? 'unit' : 'units'}
          </p>
          <div className="md:hidden"><UnitCards units={units} /></div>
          <div className="hidden md:block"><UnitTable units={units} /></div>
        </section>
      )}
    </div>
  )
}
