import type { ReactNode } from 'react'
import { Button } from './Button'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-lg text-slate-600" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-4 border-slate-300 border-t-blue-700" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4">
      <p className="text-base font-semibold text-red-800">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-2 text-base text-slate-600">{children}</div>}
    </div>
  )
}
