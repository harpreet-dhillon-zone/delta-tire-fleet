import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const inputBase = `block w-full rounded-xl border-2 bg-white px-3 text-lg text-slate-900 placeholder:text-slate-400
  focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:bg-slate-100`

function borderFor(error?: string | null) {
  return error ? 'border-red-600' : 'border-slate-300'
}

type FieldProps = {
  label: ReactNode
  error?: string | null
  hint?: ReactNode
  className?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}

// Label + control + hint + validation error, wired up for screen readers
export function Field({ label, error, hint, className = '', children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-base font-semibold text-slate-800">
        {label}
      </label>
      {children(id, describedBy)}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-sm text-slate-600">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

type Common = { label: ReactNode; error?: string | null; hint?: ReactNode; className?: string }

export function TextField({ label, error, hint, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <input id={id} aria-invalid={!!error} aria-describedby={describedBy}
          className={`${inputBase} h-12 ${borderFor(error)}`} {...rest} />
      )}
    </Field>
  )
}

// Big numeric input: decimal keypad on phones, large text
export function NumberField({ label, error, hint, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <input id={id} type="text" inputMode="decimal" autoComplete="off" aria-invalid={!!error}
          aria-describedby={describedBy} className={`${inputBase} h-14 text-2xl font-semibold tabular-nums ${borderFor(error)}`}
          {...rest} />
      )}
    </Field>
  )
}

export function SelectField({ label, error, hint, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <select id={id} aria-invalid={!!error} aria-describedby={describedBy}
          className={`${inputBase} h-12 ${borderFor(error)}`} {...rest}>
          {children}
        </select>
      )}
    </Field>
  )
}

export function TextAreaField({ label, error, hint, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <textarea id={id} aria-invalid={!!error} aria-describedby={describedBy} rows={3}
          className={`${inputBase} py-2 ${borderFor(error)}`} {...rest} />
      )}
    </Field>
  )
}

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-base font-semibold text-red-800">
      {message}
    </div>
  )
}
