import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-[3px] block text-[10px] font-semibold uppercase tracking-[0.5px] text-subtext">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-md border-[1.5px] border-lightgrey bg-offwhite px-[11px] py-2 text-[12.5px] text-bodytext outline-none transition-colors focus:border-prussian focus:bg-white disabled:bg-surface disabled:text-mutedtext'

export function SelectField<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string
  options: T[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  const numeric = typeof options[0] === 'number'
  return (
    <Field label={label}>
      <select
        className={inputClass}
        value={String(value)}
        disabled={disabled}
        onChange={(e) =>
          onChange((numeric ? Number(e.target.value) : e.target.value) as T)
        }
      >
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>
            {String(o)}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function NumberField({
  label,
  min,
  max,
  value,
  onChange,
  disabled,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <Field label={`${label} (${min.toLocaleString('en-IN')} – ${max.toLocaleString('en-IN')})`}>
      <input
        type="number"
        className={inputClass}
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      />
    </Field>
  )
}

export function DateField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  min: string
  max: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <input
        type="date"
        className={inputClass}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

export function RadioField({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <span className="mb-[3px] block text-[10px] font-semibold uppercase tracking-[0.5px] text-subtext">
        {label}
      </span>
      <div className="flex gap-4">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-1.5 text-[12.5px]">
            <input
              type="radio"
              checked={value === o}
              onChange={() => onChange(o)}
              className="accent-prussian"
            />
            {o}
          </label>
        ))}
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        className={inputClass}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

export function StepButtons({
  onBack,
  nextLabel,
  onNext,
  busy,
}: {
  onBack?: () => void
  nextLabel: string
  onNext: () => void
  busy?: boolean
}) {
  return (
    <div className="flex gap-2 pt-1">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="rounded-md border-[1.5px] border-[rgba(21,48,80,0.14)] bg-white px-3 py-2 text-[11.5px] font-semibold text-prussian transition-colors hover:bg-offwhite disabled:opacity-50"
        >
          ⬅ Previous
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={busy}
        className="flex-1 rounded-[10px] bg-prussian px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_3px_10px_rgba(21,48,80,0.24)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  )
}

export function FundAllocationEditor({
  allocation,
  onChange,
  disabled,
}: {
  allocation: Record<string, number>
  onChange: (fund: string, value: number) => void
  disabled: boolean
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-subtext">
        Portfolio Funds %
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(allocation).map(([fund, value]) => (
          <label key={fund} className="block">
            <span className="mb-0.5 block text-[10px] text-mutedtext">{fund}</span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(fund, Number(e.target.value || 0))}
              className={inputClass}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

// ---- date helpers (mirror bi_forms.py) ----

export function yearsAgoIso(years: number): string {
  const t = new Date()
  const d = new Date(t.getFullYear() - years, t.getMonth(), t.getDate())
  return toIsoDate(d)
}

export function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function computeAge(dobIso: string): number {
  const today = new Date()
  const dob = new Date(`${dobIso}T00:00:00`)
  let age = today.getFullYear() - dob.getFullYear()
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age -= 1
  }
  return age
}
