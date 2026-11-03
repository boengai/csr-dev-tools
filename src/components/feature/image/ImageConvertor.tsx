import { useState } from 'react'

import { ImageIcon } from '@/components/common'
import { ImageBatchShell } from '@/components/common/image-batch'
import { LOSSY_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import type { ImageBatchSourceMeta, ImageConvertorSettings, ImageFormat, ToolComponentProps } from '@/types'
import { convertImageFormat, parseDataUrlToBlob, parseFileName } from '@/utils'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const toolEntry = TOOL_REGISTRY_MAP['image-converter']

const INITIAL_SETTINGS: ImageConvertorSettings = { format: 'image/webp', quality: '0.8' }

export const ImageConvertor = ({ onAfterClose }: ToolComponentProps) => {
  const [settings, setSettings] = useState<ImageConvertorSettings>(INITIAL_SETTINGS)
  const isLossy = LOSSY_FORMATS.has(settings.format)

  // Converting never changes the pixel size, so the source size is the output size.
  const process = async (file: File, meta: ImageBatchSourceMeta) => {
    const dataUrl = await convertImageFormat(file, settings.format, { quality: Number(settings.quality) })
    return { blob: await parseDataUrlToBlob(dataUrl), height: meta.height, width: meta.width }
  }

  return (
    <ImageBatchShell
      accept="image/*"
      actionIcon={<ImageIcon />}
      actionLabel="Convert"
      resultLabel="Converted"
      description={toolEntry?.description}
      failureToastLabel="Image conversion failed — try a different format or smaller file"
      getOutputName={(file) => parseFileName(file.name, settings.format)}
      onAfterClose={onAfterClose}
      previewKey={JSON.stringify(settings)}
      process={process}
      rejectToastLabel="Skipped files that are not images"
      settings={
        <div className="flex w-full gap-2 *:w-1/2">
          <ImageFormatSelectInput
            onChange={(value) => setSettings((s) => ({ ...s, format: value as ImageFormat }))}
            value={settings.format}
          />
          <ImageQualitySelectInput
            disabled={!isLossy}
            onChange={(value) => setSettings((s) => ({ ...s, quality: value }))}
            value={settings.quality}
          />
        </div>
      }
      title="Convert your images"
      uploadLabel="Select images from your device"
      zipPrefix="converted"
    />
  )
}
