import { Button, ColorInput, RadioGroupInput } from '@/components/common'
import type { BackgroundRemoverResultProps, BgOption } from '@/types'

export const BackgroundRemoverResult = ({
  bgOption,
  customColor,
  displayUrl,
  onBgChange,
  onColorChange,
  onConfirm,
  sourcePreview,
}: BackgroundRemoverResultProps) => {
  return (
    <>
      <div
        aria-live="polite"
        className="bg-grid-texture flex flex-col items-center justify-center gap-6 bg-black tablet:min-h-0 tablet:grow tablet:flex-row"
      >
        {/* Original */}
        <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
          <p className="shrink-0 text-body-sm font-medium text-gray-300">Original</p>
          {sourcePreview && (
            <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
              <img alt="original" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={sourcePreview} />
            </picture>
          )}
        </div>

        <div className="tablet:border-t-none h-1 w-full border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-1 tablet:border-l-2" />

        {/* Result */}
        <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
          <p className="shrink-0 text-body-sm font-medium text-gray-300">Result</p>
          <picture
            className="flex size-full grow flex-col items-center justify-center gap-4 rounded tablet:max-h-full tablet:overflow-y-auto"
            style={
              bgOption === 'transparent'
                ? {
                    backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
                    backgroundSize: '16px 16px',
                  }
                : undefined
            }
          >
            <img alt="result" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={displayUrl} />
          </picture>
        </div>
      </div>

      {/* Controls at bottom */}
      <div className="flex w-full shrink-0 flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
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
        <div className="w-full desktop:w-2/5">
          <Button block onClick={onConfirm} variant="primary">
            Confirm
          </Button>
        </div>
      </div>
    </>
  )
}
