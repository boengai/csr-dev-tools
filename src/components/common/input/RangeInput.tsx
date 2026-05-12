import { Range, Root, Thumb, Track } from '@radix-ui/react-slider'
import type { ChangeEvent } from 'react'

import type { RangeInputProps } from '@/types'

export const RangeInput = ({ disabled, id, max, min, name, onBlur, onChange, step = 1, value }: RangeInputProps) => {
  const numValue = Number(value)
  const clampedValue = Math.max(min, Math.min(max, Number.isNaN(numValue) ? min : numValue))

  const handleSliderChange = (values: Array<number>) => {
    onChange?.(String(values[0]))
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
      <Root
        className="relative flex flex-1 cursor-pointer touch-none items-center select-none"
        disabled={disabled}
        max={max}
        min={min}
        name={name}
        onValueChange={handleSliderChange}
        step={step}
        value={[clampedValue]}
      >
        <Track className="relative h-1.5 grow rounded-full bg-gray-800">
          <Range className="absolute h-full rounded-full bg-primary" />
        </Track>
        <Thumb
          aria-label={name}
          className="block size-4 rounded-full border border-gray-700 bg-gray-200 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </Root>
      <input
        aria-label={name}
        className="text-sm w-16 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-center font-mono text-gray-300"
        disabled={disabled}
        id={id}
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
