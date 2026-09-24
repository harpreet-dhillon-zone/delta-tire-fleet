import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { AxleDiagram } from '../components/axle/AxleDiagram'
import { TireActionSheet } from '../components/tire/TireActionSheet'
import { TireForm } from '../components/tire/TireForm'
import { TirePanel } from '../components/tire/TirePanel'
import { Button, ButtonLink } from '../components/ui/Button'
import { Sheet } from '../components/ui/Sheet'
import { ErrorState, Loading } from '../components/ui/States'
import { UnitHeader } from '../components/units/UnitHeader'
import { usePanelParams } from '../hooks/usePanelParams'
import { api } from '../lib/api'
import { positionLabel } from '../lib/format'
import { qk } from '../lib/queryKeys'

export function UnitDetailPage() {
  const id = Number(useParams().id)
  const { params, open, close, reset } = usePanelParams()
  const { data, error, isPending, refetch } = useQuery({ queryKey: qk.unit(id), queryFn: () => api.unit(id) })

  if (isPending) return <Loading />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />

  const { unit, tires, positions } = data
  const tireId = params.get('tire') ? Number(params.get('tire')) : null
  const action = params.get('action')
  const addPosition = params.get('add')
  const selected = tires.find((t) => t.tire_id === tireId)
  const taken = new Set(tires.map((t) => t.position))
  const freePositions = positions.filter((p) => !taken.has(p))

  return (
    <div className="space-y-4">
      <ButtonLink to="/units" variant="ghost" className="-ml-2">← Units</ButtonLink>
      <UnitHeader unit={unit} />

      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">Tires</h2>
        <span className="text-base text-slate-600">{tires.length} of {positions.length} positions filled</span>
      </div>
      <AxleDiagram layout={unit.axle_layout} unitClass={unit.unit_class} tires={tires}
        selectedTireId={tireId} onTire={(t) => open({ tire: String(t.tire_id) })}
        onEmpty={(position) => open({ add: position })} />

      {tireId !== null && (action === 'move' || action === 'edit') ? (
        <TireActionSheet key={`${tireId}-${action}`} tireId={tireId} action={action} onClose={close} onMoved={reset} />
      ) : tireId !== null ? (
        <TirePanel key={tireId} tireId={tireId} status={selected} onClose={close}
          actions={
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => open({ tire: String(tireId), action: 'move' })}>Move</Button>
              <Button onClick={() => open({ tire: String(tireId), action: 'edit' })}>Edit</Button>
            </div>
          } />
      ) : addPosition ? (
        <Sheet title={`Add tire · ${positionLabel(addPosition)}`} onClose={close}>
          <TireForm mode="add" unitId={unit.id} position={addPosition}
            positions={freePositions.includes(addPosition) ? freePositions : [addPosition, ...freePositions]}
            onDone={close} />
        </Sheet>
      ) : null}
    </div>
  )
}
