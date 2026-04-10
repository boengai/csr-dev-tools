import { Button, FieldForm } from '@/components/common'
import type { ImageResizerControlsProps } from '@/types/components/feature/image/imageResizerControls'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

export const ImageResizerControls = ({
  isLossy,
  onConvert,
  onInputChange,
  preview,
  source,
}: ImageResizerControlsProps) => {
  return (
    <div className="flex w-full shrink-0 flex-col justify-center gap-2 desktop:flex-row">
      <div className="flex w-full flex-col items-end gap-2 tablet:flex-row">
        <div className="flex w-full gap-2">
          <FieldForm
            disabled={!source}
            label="Width"
            name="width"
            onChange={(val) => onInputChange('width', val)}
            placeholder="1920"
            type="number"
            value={preview?.width?.toString() ?? ''}
          />
          <FieldForm
            disabled={!source}
            label="Height"
            name="height"
            onChange={(val) => onInputChange('height', val)}
            placeholder="1080"
            type="number"
            value={preview?.height?.toString() ?? ''}
          />
        </div>
        <div className="flex w-full gap-2 *:w-full">
          <ImageFormatSelectInput
            disabled={!source}
            onChange={(val) => onInputChange('format', val)}
            value={preview?.format}
          />
          <ImageQualitySelectInput
            disabled={!source || !isLossy}
            onChange={(val) => onInputChange('quality', val)}
            value={!isLossy ? '1' : preview?.quality?.toString()}
          />
        </div>
      </div>
      <div className="flex w-full items-end desktop:w-2/5">
        <Button block disabled={!source} onClick={onConvert} variant="primary">
          Convert
        </Button>
      </div>
    </div>
  )
}
