import { useQuery } from '@tanstack/react-query'
import { AttentionCards } from '../components/attention/AttentionCards'
import { ATTENTION_KEYS, AttentionFilters } from '../components/attention/AttentionFilters'
import { AttentionTable } from '../components/attention/AttentionTable'
import { ATTENTION_SORT } from '../components/attention/attentionSort'
import { SortPicker } from '../components/table/SortPicker'
import { SummaryCards } from '../components/attention/SummaryCards'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, Loading } from '../components/ui/States'
import { useDebounced } from '../hooks/useDebounced'
import { useUrlFilters } from '../hooks/useUrlFilters'
import { useUrlSort } from '../hooks/useUrlSort'
import { sortRows } from '../lib/sort'
import { api } from '../lib/api'
import { qk } from '../lib/queryKeys'
import type { AttentionFilters as Filters } from '../lib/types'

export function DashboardPage() {
  const filters = useUrlFilters(ATTENTION_KEYS)
  const unit = useDebounced(filters.values.unit)
  const { values } = filters
  const { sort, dir, setSort, toggle } = useUrlSort(Object.keys(ATTENTION_SORT))

  // Empty strings are dropped by the API client, so the casts are safe
  const query: Filters = {
    carrier: values.carrier,
    unit_class: values.unit_class as Filters['unit_class'],
    axle_role: values.axle_role as Filters['axle_role'],
    tread_status: values.tread_status as Filters['tread_status'],
    age_status: values.age_status as Filters['age_status'],
    unit,
  }
  const { data: rows, error, isPending, refetch, isFetching } = useQuery({
    queryKey: qk.attention(query),
    queryFn: () => api.attention(query),
    placeholderData: (prev) => prev,
  })

  const sorted = rows ? sortRows(rows, sort ? ATTENTION_SORT[sort].value : undefined, dir) : []

  return (
    <div className="space-y-4">
      <PageHeader title="Attention" subtitle="Mounted tires on active units" />
      <SummaryCards />
      <AttentionFilters {...filters} />

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No tires match">
          {filters.activeCount > 0 ? 'Try clearing some filters.' : 'No mounted tires on active units yet.'}
        </EmptyState>
      ) : (
        <section aria-label="Results" className={isFetching ? 'opacity-70 transition-opacity' : ''}>
          <p className="mb-2 text-base text-slate-600" aria-live="polite">
            {rows.length} {rows.length === 1 ? 'tire' : 'tires'}
          </p>
          <div className="space-y-3 md:hidden">
            <SortPicker spec={ATTENTION_SORT} defaultLabel="Worst first" sort={sort} dir={dir} onChange={setSort} />
            <AttentionCards rows={sorted} />
          </div>
          <div className="hidden md:block">
            <AttentionTable rows={sorted} sort={sort} dir={dir} onSort={toggle} />
          </div>
        </section>
      )}
    </div>
  )
}
