import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { FormError, NumberField } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, Loading } from '../components/ui/States'
import { StatusIcon } from '../components/ui/StatusIcon'
import { useInvalidateAll } from '../hooks/useInvalidate'
import { useSettings } from '../hooks/useSettings'
import { api, fieldErrors } from '../lib/api'
import { parseNum, round1 } from '../lib/format'
import type { Setting } from '../lib/types'

const ROLES = [
  { role: 'steer', label: 'Steer' },
  { role: 'drive', label: 'Drive' },
  { role: 'trailer', label: 'Trailer' },
]

export function SettingsPage() {
  const { data, error, isPending, refetch } = useSettings()
  if (isPending) return <Loading />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  return <SettingsForm settings={data} />
}

function Group({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mb-3 text-base text-slate-600">{description}</p>
      {children}
    </section>
  )
}

function Label({ status, children }: { status: 'critical' | 'warning'; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <StatusIcon status={status} className={`h-4 w-4 ${status === 'critical' ? 'text-red-700' : 'text-amber-700'}`} />
      {children}
    </span>
  )
}

function SettingsForm({ settings }: { settings: Setting[] }) {
  const initial = Object.fromEntries(settings.map((s) => [s.key, round1(s.value)]))
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saved, setSaved] = useState(false)
  const invalidate = useInvalidateAll()
  const has = (key: string) => key in initial

  const changed = Object.keys(values).filter((k) => values[k] !== initial[k])

  // Local checks: numbers 0–100 (the API's range), and critical must be worse than warning
  const local: Record<string, string> = {}
  for (const k of Object.keys(values)) {
    const n = parseNum(values[k])
    if (n === undefined) local[k] = 'Required'
    else if (Number.isNaN(n)) local[k] = 'Enter a number'
    else if (n < 0 || n > 100) local[k] = '0 to 100'
  }
  const num = (k: string) => parseNum(values[k] ?? '') ?? NaN
  for (const { role, label } of ROLES) {
    if (num(`${role}_critical_32`) > num(`${role}_warn_32`)) {
      local[`${role}_critical_32`] ??= `${label} critical should be at or below warning`
    }
  }
  if (num('age_warn_years') > num('age_critical_years')) local.age_critical_years ??= 'Critical age should be at or above warning age'

  const mutation = useMutation({
    mutationFn: () => api.updateSettings(Object.fromEntries(changed.map((k) => [k, num(k)]))),
    onSuccess: async () => {
      // Normalize what was typed ("4.0" -> "4") so it matches the reloaded values
      setValues((v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round1(parseNum(x) ?? 0)])))
      setSaved(true)
      await invalidate()
    },
  })
  const errors = fieldErrors(mutation.error)
  const err = (k: string) => local[k] ?? errors.fields[k]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaved(false)
    if (!Object.keys(local).length && changed.length) mutation.mutate()
  }

  const field = (key: string, label: ReactNode) =>
    has(key) && (
      <NumberField label={label} value={values[key]} error={err(key)}
        onChange={(e) => { setSaved(false); setValues((v) => ({ ...v, [key]: e.target.value })) }} />
    )

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Settings" subtitle="Thresholds used for every tire status. Check tread minimums against current BC rules." />

      <Group title="Tread depth (32nds)" description="A tire at or below the number gets that status.">
        <div className="space-y-4">
          {ROLES.map(({ role, label }) => (
            <fieldset key={role}>
              <legend className="mb-1 text-lg font-bold">{label}</legend>
              <div className="grid grid-cols-2 gap-3">
                {field(`${role}_critical_32`, <Label status="critical">Critical</Label>)}
                {field(`${role}_warn_32`, <Label status="warning">Warning</Label>)}
              </div>
            </fieldset>
          ))}
        </div>
      </Group>

      <Group title="Tire age (years)" description="Counted from the DOT date. At or above the number gets that status.">
        <div className="grid grid-cols-2 gap-3">
          {field('age_warn_years', <Label status="warning">Warning</Label>)}
          {field('age_critical_years', <Label status="critical">Critical</Label>)}
        </div>
      </Group>

      <Group title="MVI" description="Flag units this many days before their MVI expires.">
        <div className="grid grid-cols-2 gap-3">{field('mvi_warn_days', 'Warn days before')}</div>
      </Group>

      <div className="sticky bottom-20 z-20 space-y-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:bottom-4">
        <FormError message={errors.general} />
        {saved && !changed.length && (
          <p role="status" className="text-base font-semibold text-emerald-800">Saved. Statuses now use the new thresholds.</p>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={!changed.length || mutation.isPending}>
          {mutation.isPending ? 'Saving…' : changed.length ? `Save ${changed.length} ${changed.length === 1 ? 'change' : 'changes'}` : 'No changes'}
        </Button>
      </div>
    </form>
  )
}
