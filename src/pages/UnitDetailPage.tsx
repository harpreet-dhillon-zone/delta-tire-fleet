import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { AxleDiagram } from '../components/axle/AxleDiagram'
import { TirePanel } from '../components/tire/TirePanel'
import { ButtonLink } from '../components/ui/Button'
import { ErrorState, Loading } from '../components/ui/States'
import { UnitHeader } from '../components/units/UnitHeader'
import { usePanelParams } from '../hooks/usePanelParams'
import { api } from '../lib/api'
import { qk } from '../lib/queryKeys'

export function UnitDetailPage() {
  const id = Number(useParams().id)
  const { params, open, close } = usePanelParams()
  const { data, error, isPending, refetch } = useQuery({ queryKey: qk.unit(id), queryFn: () => api.unit(id) })

  if (isPending) return <Loading />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />

  const { unit, tires } = data
  const tireId = params.get('tire') ? Number(params.get('tire')) : null
  const selected = tires.find((t) => t.tire_id === tireId)
  const mounted = tires.length

  return (
    <div className="space-y-4">
      <ButtonLink to="/units" variant="ghost" className="-ml-2">← Units</ButtonLink>
      <UnitHeader unit={unit} />

      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Tires</h2>
        <span className="text-base text-slate-600">{mounted} of {data.positions.length} positions filled</span>
      </div>
      <AxleDiagram layout={unit.axle_layout} unitClass={unit.unit_class} tires={tires}
        selectedTireId={tireId} onTire={(t) => open({ tire: String(t.tire_id) })} />

      {tireId !== null && (
        <TirePanel key={tireId} tireId={tireId} status={selected} onClose={close} />
      )}
    </div>
  )
}
