import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { checkReading, EMPTY_READING, isTouched, toReadingInput, type ReadingDraft } from '../components/inspection/readings'
import { ReadingRow } from '../components/inspection/ReadingRow'
import { Button, ButtonLink } from '../components/ui/Button'
import { FormError, TextField } from '../components/ui/Field'
import { EmptyState, ErrorState, Loading } from '../components/ui/States'
import { useInvalidateAll } from '../hooks/useInvalidate'
import { useThresholds } from '../hooks/useSettings'
import { api, ApiError } from '../lib/api'
import { todayIso } from '../lib/format'
import { qk } from '../lib/queryKeys'
import { axleRoleFor } from '../lib/status'
import type { UnitDetail } from '../lib/types'

type Drafts = Record<number, ReadingDraft>

// Browser storage is only a convenience here: a half-done walk-around survives
// a reload, and the inspector's name is remembered on this device.
const draftKey = (unitId: number) => `inspect-draft-${unitId}`
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: nothing to do
  }
}

// Enter on the number pad jumps to the next field instead of submitting
function nextOnEnter(e: KeyboardEvent<HTMLFormElement>) {
  const el = e.target as HTMLElement
  if (e.key !== 'Enter' || el.tagName !== 'INPUT') return
  e.preventDefault()
  const fields = [...e.currentTarget.querySelectorAll<HTMLElement>('input, select')]
  fields[fields.indexOf(el) + 1]?.focus()
}

export function InspectPage() {
  const id = Number(useParams().id)
  const { data, error, isPending, refetch } = useQuery({ queryKey: qk.unit(id), queryFn: () => api.unit(id) })
  if (isPending) return <Loading />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  return <InspectForm detail={data} />
}

function InspectForm({ detail }: { detail: UnitDetail }) {
  const { unit, positions } = detail
  const navigate = useNavigate()
  const { hash } = useLocation()
  const thresholds = useThresholds()
  const invalidate = useInvalidateAll()

  // Mounted tires in walk-around order (the layout's position order)
  const tires = [...detail.tires].sort((a, b) => positions.indexOf(a.position) - positions.indexOf(b.position))

  const [drafts, setDrafts] = useState<Drafts>(() => load(draftKey(unit.id), {}))
  const [date, setDate] = useState(todayIso())
  const [inspector, setInspector] = useState(() => load('inspector-name', ''))
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => save(draftKey(unit.id), Object.values(drafts).some(isTouched) ? drafts : null), [drafts, unit.id])
  useEffect(() => save('inspector-name', inspector || null), [inspector])

  // Opened from a tire's panel: jump to that tire
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  const touched = tires.filter((t) => isTouched(drafts[t.tire_id] ?? EMPTY_READING))
  const localErrors = Object.fromEntries(tires.map((t) => [t.tire_id, checkReading(drafts[t.tire_id] ?? EMPTY_READING)]))
  const hasLocalErrors = Object.values(localErrors).some((e) => Object.keys(e).length)

  const mutation = useMutation({
    mutationFn: () => api.createInspection({
      inspected_at: date || undefined,
      inspector: inspector.trim() || undefined,
      readings: touched.map((t) => toReadingInput(t.tire_id, drafts[t.tire_id])),
    }),
    onSuccess: async (res) => {
      save(draftKey(unit.id), null)
      await invalidate()
      navigate(`/units/${unit.id}`, { replace: true, state: { saved: res.saved } })
    },
  })

  // Map API issues like "readings.2.tread_outer_32" back to the tire in that row
  const apiErrors: Record<number, Record<string, string>> = {}
  const general: string[] = []
  if (mutation.error instanceof ApiError && mutation.error.issues.length) {
    for (const issue of mutation.error.issues) {
      const m = /^readings\.(\d+)(?:\.(\w+))?$/.exec(issue.field)
      const tire = m ? touched[Number(m[1])] : undefined
      if (tire) (apiErrors[tire.tire_id] ??= {})[m![2] ?? 'row'] = issue.message
      else general.push(issue.field ? `${issue.field}: ${issue.message}` : issue.message)
    }
  } else if (mutation.error) {
    general.push(mutation.error.message)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (!touched.length || hasLocalErrors) return
    mutation.mutate()
  }

  const update = (tireId: number, d: ReadingDraft) => setDrafts((prev) => ({ ...prev, [tireId]: d }))

  return (
    <form onSubmit={submit} onKeyDown={nextOnEnter} noValidate className="space-y-4">
      <ButtonLink to={`/units/${unit.id}`} variant="ghost" className="-ml-2">← {unit.unit_number}</ButtonLink>
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Inspect {unit.unit_number}</h1>
        <p className="text-base text-slate-600">Tread in 32nds. Leave a tire blank to skip it.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-3 shadow-sm">
        <TextField label="Date" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Inspector" value={inspector} autoComplete="name" onChange={(e) => setInspector(e.target.value)} />
      </div>

      {tires.length === 0 ? (
        <EmptyState title="No tires mounted on this unit" />
      ) : (
        <div className="space-y-3">
          {tires.map((t) => (
            <ReadingRow key={t.tire_id} tire={t} thresholds={thresholds}
              role={t.axle_role ?? axleRoleFor(unit.unit_class, t.position)}
              draft={drafts[t.tire_id] ?? EMPTY_READING}
              errors={{ ...(showErrors ? localErrors[t.tire_id] : {}), ...apiErrors[t.tire_id] }}
              onChange={(d) => update(t.tire_id, d)} />
          ))}
        </div>
      )}

      {/* Save bar stays in reach at the bottom of the screen, above the tab bar */}
      <div className="sticky bottom-20 z-20 space-y-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:bottom-4">
        <FormError message={general.join('. ') || (showErrors && !touched.length ? 'Enter readings for at least one tire' : null)} />
        {showErrors && hasLocalErrors && <FormError message="Fix the highlighted readings" />}
        <Button type="submit" variant="primary" className="min-h-14 w-full text-lg" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : `Save ${touched.length} of ${tires.length} tires`}
        </Button>
      </div>
    </form>
  )
}
