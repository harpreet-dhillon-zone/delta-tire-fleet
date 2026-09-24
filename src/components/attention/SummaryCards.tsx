import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { qk } from '../../lib/queryKeys'
import { STATUS_META } from '../../lib/status'
import type { Status } from '../../lib/types'
import { StatusIcon } from '../ui/StatusIcon'
import { ErrorState } from '../ui/States'

type Card = { label: string; value: number | undefined; status: Status }

function SummaryCard({ label, value, status }: Card) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border-2 p-3 ${STATUS_META[status].badge}`}>
      <StatusIcon status={status} className="h-8 w-8 shrink-0" />
      <div className="min-w-0">
        <div className="text-3xl font-bold tabular-nums leading-none">{value ?? '–'}</div>
        <div className="mt-1 text-sm font-semibold leading-tight">{label}</div>
      </div>
    </div>
  )
}

export function SummaryCards() {
  const { data, error, refetch } = useQuery({ queryKey: qk.summary, queryFn: api.dashboardSummary })
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />

  const cards: Card[] = [
    { label: 'Critical tires', value: data?.tires.critical, status: 'critical' },
    { label: 'Warning tires', value: data?.tires.warning, status: 'warning' },
    { label: 'Tires with no data', value: data?.tires.no_data, status: 'no_data' },
    { label: 'MVI expired', value: data ? data.units.mvi_expired ?? 0 : undefined, status: 'critical' },
    { label: 'MVI due soon', value: data ? data.units.mvi_due_soon ?? 0 : undefined, status: 'warning' },
  ]
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => <SummaryCard key={c.label} {...c} />)}
    </section>
  )
}
