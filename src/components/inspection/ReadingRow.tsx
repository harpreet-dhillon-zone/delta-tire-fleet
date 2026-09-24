import { fmtAgo, fmtTread, parseNum, positionLabel, round1 } from '../../lib/format'
import { minTread, ROLE_LABEL, STATUS_META, treadStatus, type Thresholds } from '../../lib/status'
import type { AxleRole, UnitTire } from '../../lib/types'
import { NumberField, SelectField } from '../ui/Field'
import { StatusBadge } from '../ui/StatusBadge'
import { CONDITIONS, type ReadingDraft } from './readings'

type Props = {
  tire: UnitTire
  role: AxleRole
  draft: ReadingDraft
  errors: Record<string, string>
  thresholds?: Thresholds
  onChange: (draft: ReadingDraft) => void
}

// Live status from what has been typed so far, using the thresholds in Settings
function LivePreview({ draft, role, thresholds }: { draft: ReadingDraft; role: AxleRole; thresholds?: Thresholds }) {
  const min = minTread(parseNum(draft.outer), parseNum(draft.center), parseNum(draft.inner))
  if (min === null) return <span className="text-base font-semibold text-slate-500">Not entered</span>
  if (!thresholds) return <span className="text-base font-semibold">Min {fmtTread(min)}</span>
  const status = treadStatus(min, role, thresholds)
  return <StatusBadge status={status} label={`${STATUS_META[status].label} · ${round1(min)}/32″`} />
}

export function ReadingRow({ tire, role, draft, errors, thresholds, onChange }: Props) {
  const set = (key: keyof ReadingDraft) => (e: { target: { value: string } }) => onChange({ ...draft, [key]: e.target.value })
  return (
    <section id={`tire-${tire.tire_id}`} aria-labelledby={`tire-${tire.tire_id}-h`}
      className={`scroll-mt-4 rounded-xl bg-white p-3 shadow-sm ${errors.row ? 'ring-2 ring-red-500' : ''}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`tire-${tire.tire_id}-h`} className="text-lg font-bold">{positionLabel(tire.position)}</h3>
          <p className="text-sm text-slate-600">
            {ROLE_LABEL[role]} · last {fmtTread(tire.min_tread_32)} · {fmtAgo(tire.last_inspected)}
          </p>
        </div>
        <div aria-live="polite"><LivePreview draft={draft} role={role} thresholds={thresholds} /></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Outer" value={draft.outer} onChange={set('outer')} error={errors.tread_outer_32} enterKeyHint="next" />
        <NumberField label="Center" value={draft.center} onChange={set('center')} error={errors.tread_center_32} enterKeyHint="next" />
        <NumberField label="Inner" value={draft.inner} onChange={set('inner')} error={errors.tread_inner_32} enterKeyHint="next" />
      </div>
      <div className="mt-2 grid grid-cols-[1fr_1.4fr] gap-2">
        <NumberField label="PSI" value={draft.pressure} onChange={set('pressure')} error={errors.pressure_psi} enterKeyHint="next" />
        <SelectField label="Condition" value={draft.condition} onChange={set('condition')} error={errors.condition}>
          <option value="">—</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </SelectField>
      </div>
      {errors.row && <p role="alert" className="mt-2 text-base font-semibold text-red-700">{errors.row}</p>}
    </section>
  )
}
