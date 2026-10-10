import { useRef, useState } from 'react'

import 'react-image-crop/dist/ReactCrop.css'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'

import { ToggleButton } from '@/components/common'
import { ImageToolShell } from '@/components/common/image-tool'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { CropControls, CropPreviewProps, CropRegion, ToolComponentProps } from '@/types'
import {
  ASPECT_RATIO_OPTIONS,
  canvasToBlob,
  clampCropRegion,
  getAspectRatio,
  getDefaultCrop,
  scaleCropToNatural,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-cropper']

const cropImageCanvas = (image: HTMLImageElement, crop: CropRegion, mimeType: string): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas context not available'))
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return canvasToBlob(canvas, mimeType)
}

const INITIAL_CONTROLS: CropControls = { aspectPreset: 'free', naturalCrop: null }

export const ImageCropper = ({ onAfterClose }: ToolComponentProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<Crop | undefined>(undefined)
  const showError = useToast((s) => s.showError)

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
      description={toolEntry?.description}
      getDownloadFilename={({ sourceName }) => {
        const base = sourceName.replace(/\.[^.]+$/, '')
        const ext = sourceName.split('.').pop() || 'png'
        return `cropped-${base}.${ext}`
      }}
      initialControls={INITIAL_CONTROLS}
      onAfterClose={() => {
        // Shell auto-resets the controls bag. Tool clears its non-controls
        // state (imgRef, the live drag `crop`) so a re-upload starts clean.
        imgRef.current = null
        setCrop(undefined)
        onAfterClose?.()
      }}
      onRejectInvalidFile={() => showError('Please select an image file')}
      process={process}
      renderControls={({ controls, setControls }) => (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <ToggleButton
              key={option.value}
              onClick={() => {
                const img = imgRef.current
                if (!img) {
                  setControls({ aspectPreset: option.value })
                  return
                }
                const next = {
                  ...getDefaultCrop(img.width, img.height, getAspectRatio(option.value)),
                  unit: 'px' as const,
                }
                setCrop(next)
                setControls({ aspectPreset: option.value, naturalCrop: captureNaturalCrop(next) })
              }}
              pressed={controls.aspectPreset === option.value}
              variant="subtle"
            >
              {option.label}
            </ToggleButton>
          ))}
          {controls.naturalCrop && (
            <>
              <span className="h-5 w-px bg-gray-700" />
              <span aria-live="polite" className="text-body-xs text-gray-500">
                Size: {controls.naturalCrop.width} x {controls.naturalCrop.height} px
              </span>
            </>
          )}
        </div>
      )}
      renderPreview={({ controls, setControls, sourceUrl }) => (
        <CropPreview
          aspectPreset={controls.aspectPreset}
          captureNaturalCrop={captureNaturalCrop}
          crop={crop}
          imgRef={imgRef}
          onImageLoad={(e) => {
            const img = e.currentTarget
            const next = {
              ...getDefaultCrop(img.width, img.height, getAspectRatio(controls.aspectPreset)),
              unit: 'px' as const,
            }
            setCrop(next)
            setControls({ naturalCrop: captureNaturalCrop(next) })
          }}
          onCropComplete={(c) => setControls({ naturalCrop: captureNaturalCrop(c) })}
          setCrop={setCrop}
          sourceUrl={sourceUrl}
        />
      )}
      title="Image Cropper"
      uploadLabel="Select image to crop"
    />
  )
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
