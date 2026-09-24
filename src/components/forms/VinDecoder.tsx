import { useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { VinDecode } from '../../lib/types'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Field'
import { StatusIcon } from '../ui/StatusIcon'

type Props = {
  vin: string
  error?: string | null
  onChange: (vin: string) => void
  onDecoded: (result: VinDecode) => void
}

// VIN input with a Decode button (NHTSA lookup through /api/vin/:vin)
export function VinDecoder({ vin, error, onChange, onDecoded }: Props) {
  const decode = useMutation({ mutationFn: () => api.decodeVin(vin.trim()), onSuccess: onDecoded })
  const result = decode.data
  const clean = vin.trim()

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <TextField className="min-w-0 flex-1" label="VIN" value={vin} maxLength={17} autoCapitalize="characters"
          autoComplete="off" spellCheck={false} error={error ?? (decode.error as Error | null)?.message}
          hint={`${clean.length}/17 characters`}
          onChange={(e) => { onChange(e.target.value.toUpperCase()); decode.reset() }} />
        <Button onClick={() => decode.mutate()} disabled={clean.length !== 17 || decode.isPending}
          className="sm:mt-7">
          {decode.isPending ? 'Decoding…' : 'Decode VIN'}
        </Button>
      </div>
      {result && !result.check_digit_ok && (
        <div role="alert" className="mt-2 flex gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-3 text-base text-amber-900">
          <StatusIcon status="warning" className="h-6 w-6 shrink-0" />
          <span><span className="font-semibold">Check digit doesn’t match.</span> This VIN probably has a typo. Compare it with the plate on the unit.</span>
        </div>
      )}
      {result && (
        <p className="mt-2 text-base text-slate-700" role="status">
          {[result.year, result.make, result.model].filter(Boolean).join(' ') || 'No vehicle details found for this VIN'}
          {result.body_class && ` · ${result.body_class}`}
        </p>
      )}
    </div>
  )
}
