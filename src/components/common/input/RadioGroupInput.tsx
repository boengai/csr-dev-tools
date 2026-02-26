import type { RadioGroupInputProps } from '@/types'

export const RadioGroupInput = ({ disabled, name, onBlur, onChange, options, value }: RadioGroupInputProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4" onBlur={onBlur} role="radiogroup">
      {options.map((option) => (
        <label className="flex cursor-pointer items-center gap-1.5 text-body-sm text-gray-300" key={option.value}>
          <input
            checked={value === option.value}
            disabled={disabled ?? option.disabled}
            name={name}
            onChange={() => onChange?.(option.value)}
            type="radio"
            value={option.value}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
