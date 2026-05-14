import { useState } from 'react'

import { FieldForm } from '@/components/common'
import { ImageToolShell } from '@/components/common/image-tool'
import { LOSSY_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { ImageFormat, ToolComponentProps } from '@/types'
import { isValidImageFormat, parseDataUrlToBlob, parseFileName, resizeImage } from '@/utils'

import { EMPTY_IMAGE } from './ImagePreview'
import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const toolEntry = TOOL_REGISTRY_MAP['image-resizer']

type ResizeControls = {
  format: ImageFormat | null
  height: number | null
  quality: number | null
  ratio: number | null
  width: number | null
}

const initialControls: ResizeControls = {
  format: null,
  height: null,
  quality: null,
  ratio: null,
  width: null,
}

export const ImageResizer = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [controls, setControls] = useState<ResizeControls>(initialControls)
  const { toast } = useToast()

  const process = async (file: File, c: ResizeControls): Promise<Blob | null> => {
    if (!c.width || !c.height || !c.format) return null

    let width = c.width
    let height = c.height
    const ratio = c.ratio ?? width / Math.max(height, 1)

    // Preserve the minimum-1px fallback from the original (avoid collapse).
    if (height * ratio <= 1) {
      height = 10
      width = Math.round(1 * ratio * 10)
    } else if (width / ratio <= 1) {
      width = 10
      height = Math.round((1 / ratio) * 10)
    }

    const isLossyFormat = LOSSY_FORMATS.has(c.format)
    const quality = isLossyFormat ? c.quality ?? 0.8 : 1
    const result = await resizeImage(file, { height, width }, { format: c.format, quality })
    if (result.dataUrl === EMPTY_IMAGE) return null
    return parseDataUrlToBlob(result.dataUrl)
  }

  const setAndRecompute = (next: ResizeControls, recompute: () => void) => {
    setControls(next)
    recompute()
  }

  const setNumber = (key: 'height' | 'width', val: string, recompute: () => void) => {
    const n = Number(val)
    const next = { ...controls }
    if (Number.isNaN(n) || n <= 0) {
      next[key] = null
    } else {
      next[key] = n
      if (next.ratio) {
        if (key === 'width') {
          next.height = Math.round(n / next.ratio)
        } else {
          next.width = Math.round(n * next.ratio)
        }
      }
    }
    setAndRecompute(next, recompute)
  }

  const isLossy = controls.format ? LOSSY_FORMATS.has(controls.format) : false
  const ready = Boolean(controls.width && controls.height && controls.format)

  return (
    <ImageToolShell<ResizeControls>
      accept="image/*"
      controls={controls}
      description={toolEntry?.description}
      getDownloadFilename={({ sourceName }) => parseFileName(sourceName, controls.format ?? undefined)}
      onAfterDialogClose={() => {
        setControls(initialControls)
        onAfterDialogClose?.()
      }}
      onRejectInvalidFile={() =>
        toast({
          action: 'add',
          item: { label: 'Upload a valid image file (PNG, JPEG, WebP, GIF, BMP, or AVIF)', type: 'error' },
        })
      }
      process={process}
      renderControls={({ recompute }) => (
        <div className="flex w-full shrink-0 flex-col items-end gap-2 tablet:flex-row">
          <div className="flex w-full gap-2">
            <FieldForm
              disabled={!ready}
              label="Width"
              name="width"
              onChange={(val) => setNumber('width', val, recompute)}
              placeholder="1920"
              type="number"
              value={controls.width?.toString() ?? ''}
            />
            <FieldForm
              disabled={!ready}
              label="Height"
              name="height"
              onChange={(val) => setNumber('height', val, recompute)}
              placeholder="1080"
              type="number"
              value={controls.height?.toString() ?? ''}
            />
          </div>
          <div className="flex w-full gap-2 *:w-full">
            <ImageFormatSelectInput
              disabled={!ready}
              onChange={(val) => setAndRecompute({ ...controls, format: val as ImageFormat }, recompute)}
              value={controls.format ?? undefined}
            />
            <ImageQualitySelectInput
              disabled={!ready || !isLossy}
              onChange={(val) =>
                setAndRecompute({ ...controls, quality: Number(val) }, recompute)
              }
              value={(isLossy ? controls.quality : 1)?.toString() ?? '1'}
            />
          </div>
        </div>
      )}
      renderPreview={({ recompute, resultUrl, source, sourceUrl }) => (
        <div className="bg-grid-texture flex flex-col items-center justify-center gap-6 bg-black tablet:min-h-0 tablet:grow tablet:flex-row">
          <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
            <p className="shrink-0 text-body-sm font-medium text-gray-300">Original</p>
            <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
              <img
                alt="original"
                className="w-full max-w-full tablet:max-h-full tablet:w-auto"
                onLoad={(e) => {
                  if (controls.width && controls.height) return
                  const img = e.currentTarget
                  const fileType = source.type as ImageFormat
                  setControls({
                    format: isValidImageFormat(fileType) ? fileType : ('image/jpeg' as ImageFormat),
                    height: img.naturalHeight,
                    quality: 1,
                    ratio: img.naturalWidth / Math.max(img.naturalHeight, 1),
                    width: img.naturalWidth,
                  })
                  recompute()
                }}
                src={sourceUrl}
              />
            </picture>
          </div>
          <div className="tablet:border-t-none h-1 w-full border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-1 tablet:border-l-2" />
          <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
            <p className="shrink-0 text-body-sm font-medium text-gray-300">Resized</p>
            {resultUrl ? (
              <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
                <img alt="resized" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={resultUrl} />
              </picture>
            ) : null}
          </div>
        </div>
      )}
      title="Adjust the size of your image"
      uploadLabel="Select images from your device"
    />
  )
}
