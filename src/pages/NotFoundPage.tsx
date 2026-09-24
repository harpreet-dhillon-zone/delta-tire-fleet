import { ButtonLink } from '../components/ui/Button'
import { EmptyState } from '../components/ui/States'

export function NotFoundPage() {
  return (
    <EmptyState title="Page not found">
      <ButtonLink to="/" variant="primary" className="mt-2">Go to Attention</ButtonLink>
    </EmptyState>
  )
}
