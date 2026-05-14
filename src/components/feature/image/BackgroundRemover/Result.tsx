import { ColorInput, RadioGroupInput } from '@/components/common'
import type { BackgroundRemoverResultProps, BgOption } from '@/types'

export const BackgroundRemoverResult = ({
  bgOption,
  customColor,
  onBgChange,
  onColorChange,
}: BackgroundRemoverResultProps) => {
  return (
    <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
      <span className="text-body-sm text-gray-400">Background:</span>
      <RadioGroupInput
        name="bg-option"
        onChange={(val) => onBgChange(val as BgOption)}
        options={[
          { label: 'Transparent', value: 'transparent' },
          { label: 'White', value: 'white' },
          { label: 'Custom', value: 'custom' },
        ]}
        value={bgOption}
      />
      <ColorInput
        aria-label="Custom background color"
        disabled={bgOption !== 'custom'}
        onChange={onColorChange}
        value={customColor}
      />
    </div>
  )
}
