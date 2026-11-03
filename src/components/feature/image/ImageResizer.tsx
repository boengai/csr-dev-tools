import { useState } from 'react'

import { FieldForm, ImageIcon, SelectInput } from '@/components/common'
import { ImageBatchShell } from '@/components/common/image-batch'
import { IMAGE_LABEL, LOSSY_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import type { ImageFormat, ImageOutputFormat, ImageResizeMode, ImageResizerSettings, ToolComponentProps } from '@/types'
import {
  detectEncodableImageFormats,
  isValidImageFormat,
  parseDataUrlToBlob,
  parseFileName,
  processImage,
} from '@/utils'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const toolEntry = TOOL_REGISTRY_MAP['image-resizer']

const INITIAL_SETTINGS: ImageResizerSettings = {
  format: 'original',
  height: null,
  mode: 'fit',
  quality: '0.9',
  width: null,
}

const MODE_OPTIONS: Array<{ label: string; value: ImageResizeMode }> = [
  { label: 'Fit within', value: 'fit' },
  { label: 'Exact — crop to fill', value: 'cover' },
  { label: 'Exact — stretch', value: 'stretch' },
]

const MODE_HINT: Record<ImageResizeMode, string> = {
  cover:
    'Every image becomes exactly width × height. It is scaled to cover the box and the overflow is cropped from the centre, so nothing is distorted.',
  fit: 'Each image shrinks to fit within the box and keeps its aspect ratio. Leave a side blank to limit only the other; images already smaller are not enlarged.',
  stretch:
    'Every image becomes exactly width × height. Images with a different shape are stretched to fill, which distorts them.',
}

/** "Keep original" falls back to PNG when the browser can't encode the source's format (e.g. GIF, BMP). */
const resolveFormat = (choice: ImageOutputFormat, file: File): ImageFormat => {
  if (choice !== 'original') return choice
  return isValidImageFormat(file.type) && detectEncodableImageFormats().includes(file.type) ? file.type : 'image/png'
}

const parseDimension = (value: string): number | null => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 ? n : null
}

export const ImageResizer = ({ onAfterClose }: ToolComponentProps) => {
  const [settings, setSettings] = useState<ImageResizerSettings>(INITIAL_SETTINGS)
  const { format, height, mode, quality, width } = settings
  const isExact = mode !== 'fit'
  // Fit needs one side; an exact size needs both.
  const ready = isExact ? Boolean(width && height) : Boolean(width || height)
  const showQuality = format === 'original' || LOSSY_FORMATS.has(format)

  const process = async (file: File) => {
    const target = resolveFormat(format, file)
    const base = { format: target, quality: LOSSY_FORMATS.has(target) ? Number(quality) : 1 }
    const result =
      mode === 'fit'
        ? // processImage only scales down under maxWidth/maxHeight, so smaller images keep their size.
          await processImage(file, {
            ...base,
            maxHeight: height ?? undefined,
            maxWidth: width ?? undefined,
            strategy: 'stretch',
          })
        : await processImage(file, { ...base, height: height ?? 1, strategy: mode, width: width ?? 1 })
    return { blob: await parseDataUrlToBlob(result.dataUrl), height: result.height, width: result.width }
  }

  return (
    <ImageBatchShell
      accept="image/*"
      actionIcon={<ImageIcon />}
      actionLabel="Resize"
      canProcess={ready}
      description={toolEntry?.description}
      failureToastLabel="Image resizing failed — try a different format or smaller file"
      getOutputName={(file) => parseFileName(file.name, resolveFormat(format, file))}
      onAfterClose={onAfterClose}
      previewKey={JSON.stringify(settings)}
      process={process}
      rejectToastLabel="Skipped files that are not images"
      resultLabel="Resized"
      settings={
        <>
          <div className="flex w-full flex-col gap-2 tablet:flex-row tablet:items-end">
            <div className="flex w-full gap-2 tablet:w-2/5 tablet:shrink-0">
              <FieldForm
                label={isExact ? 'Width' : 'Max width'}
                name="width"
                onChange={(val) => setSettings((s) => ({ ...s, width: parseDimension(val) }))}
                placeholder="1920"
                type="number"
                value={width?.toString() ?? ''}
              />
              <FieldForm
                label={isExact ? 'Height' : 'Max height'}
                name="height"
                onChange={(val) => setSettings((s) => ({ ...s, height: parseDimension(val) }))}
                placeholder="1080"
                type="number"
                value={height?.toString() ?? ''}
              />
            </div>
            <div className="grid w-full grid-cols-1 gap-2 tablet:grid-cols-3">
              <SelectInput
                aria-label="Resize mode"
                name="mode"
                onChange={(val) => setSettings((s) => ({ ...s, mode: val as ImageResizeMode }))}
                options={MODE_OPTIONS}
                value={mode}
              />
              <ImageFormatSelectInput
                includeOriginal
                onChange={(val) => setSettings((s) => ({ ...s, format: val as ImageOutputFormat }))}
                value={format}
              />
              <ImageQualitySelectInput
                disabled={!showQuality}
                onChange={(val) => setSettings((s) => ({ ...s, quality: val }))}
                value={showQuality ? quality : '1'}
              />
            </div>
          </div>
          <p className="text-body-xs text-gray-500">{MODE_HINT[mode]}</p>
          {format === 'original' && (
            <p className="text-body-xs text-gray-500">
              Quality applies to JPEG, WebP, and AVIF images; other formats are lossless.
            </p>
          )}
          {format !== 'original' && !showQuality && (
            <p className="text-body-xs text-gray-500">
              {IMAGE_LABEL[format]} is lossless, so it has no quality setting. Choose JPEG or WebP to set quality.
            </p>
          )}
        </>
      }
      title="Adjust the size of your images"
      uploadLabel="Select images from your device"
      zipPrefix="resized"
    />
  )
}
