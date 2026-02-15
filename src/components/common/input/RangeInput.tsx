import type { ChangeEvent } from 'react'

import type { RangeInputProps } from '@/types'

export const RangeInput = ({ disabled, max, min, name, onBlur, onChange, step = 1, value }: RangeInputProps) => {
  const numValue = Number(value)
  const clampedValue = Math.max(min, Math.min(max, Number.isNaN(numValue) ? min : numValue))

  const handleRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '' || raw === '-') {
      onChange?.(raw)
      return
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return
    onChange?.(String(Math.floor(parsed)))
  }

  const handleNumberBlur = () => {
    onChange?.(String(clampedValue))
    onBlur?.()
  }

  return (
    <div className="flex items-center gap-3" data-disabled={disabled}>
      <input
        className="h-2 flex-1 cursor-pointer accent-primary"
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        onChange={handleRangeChange}
        step={step}
        type="range"
        value={clampedValue}
      />
      <input
        aria-label={name}
        className="text-sm w-16 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-center font-mono text-gray-300"
        disabled={disabled}
        max={max}
        min={min}
        onBlur={handleNumberBlur}
        onChange={handleNumberChange}
        type="number"
        value={value ?? min}
      />
    </div>
  )
}
