import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { positionLabel } from '../../lib/format'
import { qk } from '../../lib/queryKeys'
import { Sheet } from '../ui/Sheet'
import { ErrorState, Loading } from '../ui/States'
import { MoveTireForm } from './MoveTireForm'
import { TireForm } from './TireForm'

// Move or edit form for one tire, in a panel
export function TireActionSheet({ tireId, action, onClose, onMoved }: {
  tireId: number
  action: 'move' | 'edit'
  onClose: () => void
  onMoved: () => void
}) {
  const { data, error, isPending, refetch } = useQuery({ queryKey: qk.tire(tireId), queryFn: () => api.tire(tireId) })
  const where = data?.tire.position ? ` · ${positionLabel(data.tire.position)}` : ''
  return (
    <Sheet title={`${action === 'move' ? 'Move tire' : 'Edit tire'}${where}`} onClose={onClose}>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : action === 'move' ? (
        <MoveTireForm tire={data.tire} onDone={onMoved} />
      ) : (
        <TireForm mode="edit" tire={data.tire} onDone={onClose} />
      )}
    </Sheet>
  )
}
