import { useRef, useState } from 'react'

import 'react-image-crop/dist/ReactCrop.css'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'

import { ImageToolShell } from '@/components/common/image-tool'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { AspectRatioPreset, CropRegion, ToolComponentProps } from '@/types'
import {
  ASPECT_RATIO_OPTIONS,
  canvasToBlob,
  clampCropRegion,
  getAspectRatio,
  getDefaultCrop,
  scaleCropToNatural,
  tv,
} from '@/utils'

const aspectButtonStyles = tv({
  base: 'rounded-md px-3 py-1.5 text-body-sm transition-colors',
  variants: {
    active: {
      true: 'text-primary-foreground bg-primary',
      false: 'bg-surface-secondary hover:bg-surface-tertiary text-gray-300',
    },
  },
})

const toolEntry = TOOL_REGISTRY_MAP['image-cropper']

const cropImageCanvas = (
  image: HTMLImageElement,
  crop: CropRegion,
  mimeType: string,
): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas context not available'))
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return canvasToBlob(canvas, mimeType)
}

type CropControls = {
  aspectPreset: AspectRatioPreset
  naturalCrop: CropRegion | null
}

export const ImageCropper = ({ onAfterDialogClose }: ToolComponentProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('free')
  const [crop, setCrop] = useState<Crop | undefined>(undefined)
  const [naturalCrop, setNaturalCrop] = useState<CropRegion | null>(null)
  const { toast } = useToast()

  const captureNaturalCrop = (displayCrop: PixelCrop) => {
    const img = imgRef.current
    if (!img) return null
    const scaled = scaleCropToNatural(displayCrop, img.width, img.height, img.naturalWidth, img.naturalHeight)
    return clampCropRegion(scaled, img.naturalWidth, img.naturalHeight)
  }

  const process = async (file: File, ctrls: CropControls): Promise<Blob | null> => {
    if (!ctrls.naturalCrop || !imgRef.current) return null
    return cropImageCanvas(imgRef.current, ctrls.naturalCrop, file.type || 'image/png')
  }

  return (
    <ImageToolShell<CropControls>
      accept="image/*"
      controls={{ aspectPreset, naturalCrop }}
      description={toolEntry?.description}
      getDownloadFilename={({ sourceName }) => {
        const base = sourceName.replace(/\.[^.]+$/, '')
        const ext = sourceName.split('.').pop() || 'png'
        return `cropped-${base}.${ext}`
      }}
      onAfterDialogClose={() => {
        // Reset per-Tool state so a re-upload starts clean.
        imgRef.current = null
        setAspectPreset('free')
        setCrop(undefined)
        setNaturalCrop(null)
        onAfterDialogClose?.()
      }}
      onRejectInvalidFile={() =>
        toast({ action: 'add', item: { label: 'Please select an image file', type: 'error' } })
      }
      process={process}
      renderControls={({ recompute }) => (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <button
              className={aspectButtonStyles({ active: aspectPreset === option.value })}
              key={option.value}
              onClick={() => {
                setAspectPreset(option.value)
                const img = imgRef.current
                if (!img) return
                const next = { ...getDefaultCrop(img.width, img.height, getAspectRatio(option.value)), unit: 'px' as const }
                setCrop(next)
                const nc = captureNaturalCrop(next)
                setNaturalCrop(nc)
                recompute()
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
          {naturalCrop && (
            <>
              <span className="h-5 w-px bg-gray-700" />
              <span aria-live="polite" className="text-body-xs text-gray-500">
                Size: {naturalCrop.width} x {naturalCrop.height} px
              </span>
            </>
          )}
        </div>
      )}
      renderPreview={({ recompute, sourceUrl }) => (
        <CropPreview
          aspectPreset={aspectPreset}
          captureNaturalCrop={captureNaturalCrop}
          crop={crop}
          imgRef={imgRef}
          onImageLoad={(e) => {
            const img = e.currentTarget
            const next = { ...getDefaultCrop(img.width, img.height, getAspectRatio(aspectPreset)), unit: 'px' as const }
            setCrop(next)
            const nc = captureNaturalCrop(next)
            setNaturalCrop(nc)
            recompute()
          }}
          onCropComplete={(c) => {
            const nc = captureNaturalCrop(c)
            setNaturalCrop(nc)
            recompute()
          }}
          setCrop={setCrop}
          sourceUrl={sourceUrl}
        />
      )}
      title="Image Cropper"
      uploadLabel="Select image to crop"
    />
  )
}

type CropPreviewProps = {
  aspectPreset: AspectRatioPreset
  captureNaturalCrop: (displayCrop: PixelCrop) => CropRegion | null
  crop: Crop | undefined
  imgRef: React.MutableRefObject<HTMLImageElement | null>
  onCropComplete: (c: PixelCrop) => void
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void
  setCrop: (c: Crop) => void
  sourceUrl: string
}

const CropPreview = ({
  aspectPreset,
  crop,
  imgRef,
  onCropComplete,
  onImageLoad,
  setCrop,
  sourceUrl,
}: CropPreviewProps) => (
  <div className="bg-grid-texture flex grow items-center justify-center overflow-auto bg-black">
    <ReactCrop
      aspect={getAspectRatio(aspectPreset)}
      crop={crop}
      minHeight={10}
      minWidth={10}
      onChange={(c) => setCrop(c)}
      onComplete={onCropComplete}
      style={{ '--rc-drag-handle-mobile-size': '44px' } as React.CSSProperties}
    >
      <img
        alt="Crop preview"
        onLoad={onImageLoad}
        ref={imgRef}
        src={sourceUrl}
        style={{ maxHeight: '65vh', maxWidth: '100%' }}
      />
    </ReactCrop>
  </div>
)
