import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { UnitForm } from '../components/forms/UnitForm'
import { ButtonLink } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, Loading } from '../components/ui/States'
import { api } from '../lib/api'
import { qk } from '../lib/queryKeys'

export function NewUnitPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ButtonLink to="/units" variant="ghost" className="-ml-2">← Units</ButtonLink>
      <PageHeader title="Add unit" />
      <UnitForm onSaved={(id) => navigate(`/units/${id}`, { replace: true })} />
    </div>
  )
}

export function EditUnitPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useQuery({ queryKey: qk.unit(id), queryFn: () => api.unit(id) })
  if (isPending) return <Loading />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ButtonLink to={`/units/${id}`} variant="ghost" className="-ml-2">← {data.unit.unit_number}</ButtonLink>
      <PageHeader title={`Edit ${data.unit.unit_number}`}
        subtitle="Blank fields are left unchanged. The API does not clear a saved value." />
      <UnitForm unit={data.unit} hasTires={data.tires.length > 0}
        onSaved={() => navigate(`/units/${id}`, { replace: true })} />
    </div>
  )
}
