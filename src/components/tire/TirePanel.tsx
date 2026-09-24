import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api } from '../../lib/api'
import { fmtAge, fmtDate, fmtTread, positionLabel, titleCase } from '../../lib/format'
import { qk } from '../../lib/queryKeys'
import { ROLE_LABEL, severityToStatus } from '../../lib/status'
import type { TireDetail, UnitTire } from '../../lib/types'
import { Sheet } from '../ui/Sheet'
import { ErrorState, Loading } from '../ui/States'
import { StatusBadge } from '../ui/StatusBadge'
import { ReadingValues } from './ReadingValues'
import { InspectionHistory, MoveHistory } from './TireHistory'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="break-words text-base font-semibold">{value || '—'}</dd>
    </div>
  )
}

type Props = {
  tireId: number
  // Status fields from the unit endpoint (null when the unit is not active)
  status?: UnitTire
  onClose: () => void
  actions?: ReactNode
}

export function TirePanel({ tireId, status, onClose, actions }: Props) {
  const { data, error, isPending, refetch } = useQuery({ queryKey: qk.tire(tireId), queryFn: () => api.tire(tireId) })
  const position = data?.tire.position ?? status?.position

  return (
    <Sheet title={position ? positionLabel(position) : 'Tire'} onClose={onClose} footer={actions}>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <TireBody detail={data} status={status} />
      )}
    </Sheet>
  )
}

function TireBody({ detail, status }: { detail: TireDetail; status?: UnitTire }) {
  const { tire, inspections, moves } = detail
  const latest = inspections[0]
  return (
        <>
          {status && (
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={severityToStatus(status.severity)} />
              {status.tread_status && <StatusBadge size="sm" status={status.tread_status} label={`Tread ${fmtTread(status.min_tread_32)}`} />}
              {status.age_status && <StatusBadge size="sm" status={status.age_status} label={`Age ${fmtAge(status.age_years)}`} />}
            </div>
          )}
          {status && status.severity === null && (
            <p className="mt-2 text-base text-slate-600">Status is only calculated for active units.</p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Detail label="Brand / model" value={[tire.brand, tire.model].filter(Boolean).join(' ')} />
            <Detail label="Size" value={tire.size} />
            <Detail label="Serial" value={tire.serial_number} />
            <Detail label="DOT" value={tire.dot_code ?? (tire.dot_year ? `Week ${tire.dot_week ?? '?'} / ${tire.dot_year}` : null)} />
            <Detail label="Type" value={titleCase(tire.tire_type)} />
            <Detail label="Original tread" value={tire.original_tread_32 === null ? null : fmtTread(tire.original_tread_32)} />
            <Detail label="Installed" value={fmtDate(tire.install_date)} />
            <Detail label="Axle" value={status?.axle_role ? ROLE_LABEL[status.axle_role] : null} />
          </dl>
          {tire.notes && <p className="mt-3 whitespace-pre-wrap text-base text-slate-700">{tire.notes}</p>}

          <Section title="Latest inspection">
            {latest ? (
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="mb-1 text-sm font-semibold text-slate-600">
                  {fmtDate(latest.inspected_at)}{latest.inspector && ` · ${latest.inspector}`}
                </div>
                <ReadingValues insp={latest} />
              </div>
            ) : (
              <p className="text-base text-slate-600">Never inspected.</p>
            )}
          </Section>

          <Section title="Earlier inspections">
            <InspectionHistory inspections={inspections.slice(1)} emptyText="No earlier inspections." />
          </Section>

          <Section title="Moves">
            <MoveHistory moves={moves} />
          </Section>
        </>
  )
}
