import { useId } from 'react'

type Option<T extends string> = { value: T; label: string }

// Big radio buttons: easier with gloves than a dropdown for 2–4 choices
export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-1 text-base font-semibold text-slate-800">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <label key={o.value}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 px-2 text-center text-base font-semibold
              has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-200
              ${value === o.value ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-800'}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value}
              onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
