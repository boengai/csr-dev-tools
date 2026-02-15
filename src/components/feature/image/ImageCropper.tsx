import { useEffect, useRef, useState } from 'react'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import type { Crop, PixelCrop } from 'react-image-crop'

import type { AspectRatioPreset, CropRegion } from '@/types'

import {
  Button,
  Dialog,
  DownloadIcon,
  NotoEmoji,
  ProgressBar,
  RefreshIcon,
  Tabs,
  UploadInput,
} from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToolError, useToast } from '@/hooks'
import { ASPECT_RATIO_OPTIONS, clampCropRegion, getAspectRatio, getDefaultCrop, scaleCropToNatural } from '@/utils'

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
}

const toolEntry = TOOL_REGISTRY_MAP['image-cropper']

const cropImageCanvas = (image: HTMLImageElement, crop: CropRegion, mimeType: string, quality?: number): string => {
  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  return canvas.toDataURL(mimeType, quality)
}

export const ImageCropper = () => {
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [tabValue, setTabValue] = useState(TABS_VALUES.IMPORT)
  const [source, setSource] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('free')
  const [processing, setProcessing] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  const { toast } = useToast()
  const { clearError, error, setError } = useToolError()

  useEffect(() => {
    return () => {
      clearTimeout(progressTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!source) {
      setImageUrl(null)
      return
    }
    const url = URL.createObjectURL(source)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [source])

  const handleInputChange = (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    clearError()
    setSource(file)
    setCompletedCrop(null)
    setCrop(undefined)
    setAspectPreset('free')
    setDialogOpen(true)
  }

  const handleReset = () => {
    setTabValue(TABS_VALUES.IMPORT)
    setSource(null)
    setCompletedCrop(null)
    setCrop(undefined)
    setAspectPreset('free')
    clearError()
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { height, width } = e.currentTarget
    const defaultCrop = getDefaultCrop(width, height, getAspectRatio(aspectPreset))
    const pixelCrop = { ...defaultCrop, unit: 'px' as const }
    setCrop(pixelCrop)
    setCompletedCrop(pixelCrop)
  }

  const handleAspectChange = (preset: AspectRatioPreset) => {
    setAspectPreset(preset)
    if (imgRef.current) {
      const { height, width } = imgRef.current
      const defaultCrop = getDefaultCrop(width, height, getAspectRatio(preset))
      const pixelCrop = { ...defaultCrop, unit: 'px' as const }
      setCrop(pixelCrop)
      setCompletedCrop(pixelCrop)
    }
  }

  const handleCrop = () => {
    if (!completedCrop || !imgRef.current || !source) return

    setProcessing(true)
    progressTimerRef.current = setTimeout(() => setShowProgress(true), 300)

    try {
      const naturalCrop = scaleCropToNatural(
        completedCrop,
        imgRef.current.width,
        imgRef.current.height,
        imgRef.current.naturalWidth,
        imgRef.current.naturalHeight,
      )
      const clamped = clampCropRegion(naturalCrop, imgRef.current.naturalWidth, imgRef.current.naturalHeight)
      const mimeType = source.type || 'image/png'
      const dataUrl = cropImageCanvas(imgRef.current, clamped, mimeType)

      const anchor = downloadAnchorRef.current
      if (!anchor) return
      const baseName = source.name.replace(/\.[^.]+$/, '')
      const ext = source.name.split('.').pop() || 'png'
      anchor.href = dataUrl
      anchor.download = `cropped-${baseName}.${ext}`

      setTabValue(TABS_VALUES.DOWNLOAD)
      setDialogOpen(false)
    } catch {
      setError('Failed to crop image. Please try again.')
    } finally {
      clearTimeout(progressTimerRef.current)
      setShowProgress(false)
      setProcessing(false)
    }
  }

  const naturalCrop =
    completedCrop && imgRef.current
      ? scaleCropToNatural(
          completedCrop,
          imgRef.current.width,
          imgRef.current.height,
          imgRef.current.naturalWidth,
          imgRef.current.naturalHeight,
        )
      : null

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

        <Tabs
          injected={{
            setValue: setTabValue,
            value: tabValue,
          }}
          items={[
            {
              content: (
                <div className="flex w-full grow flex-col items-center justify-center gap-4">
                  <div className="desktop:w-8/10 w-full">
                    <UploadInput
                      accept="image/*"
                      button={{ block: true, children: 'Select image to crop' }}
                      multiple={false}
                      name="image-cropper"
                      onChange={handleInputChange}
                    />
                  </div>
                  {error != null && !dialogOpen && (
                    <p className="text-error text-body-sm shrink-0" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              ),
              value: TABS_VALUES.IMPORT,
            },
            {
              content: (
                <div className="flex w-full grow flex-col items-center justify-center gap-6">
                  <NotoEmoji emoji="check" size={120} />
                  <div className="desktop:w-8/10 flex w-full flex-col gap-4">
                    <Button
                      block
                      icon={<DownloadIcon />}
                      onClick={() => {
                        downloadAnchorRef.current?.click()
                        const fileName = downloadAnchorRef.current?.download
                        if (fileName) {
                          toast({ action: 'add', item: { label: `Downloaded ${fileName}`, type: 'success' } })
                        }
                      }}
                      variant="primary"
                    >
                      Download
                    </Button>
                    <Button block icon={<RefreshIcon />} onClick={handleReset}>
                      Start Over
                    </Button>
                  </div>
                </div>
              ),
              value: TABS_VALUES.DOWNLOAD,
            },
          ]}
        />
        <a className="hidden" download="" href="" ref={downloadAnchorRef} />
      </div>
      <Dialog
        description="Crop your image using the selection handles"
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          if (tabValue !== TABS_VALUES.DOWNLOAD) handleReset()
        }}
        size="screen"
        title={source?.name ?? 'Crop Image'}
      >
        <div className="flex size-full flex-col">
          <div
            className={`bg-grid-texture flex grow items-center justify-center overflow-auto bg-black ${processing ? 'pointer-events-none opacity-70' : ''}`}
          >
            {imageUrl && (
              <ReactCrop
                aspect={getAspectRatio(aspectPreset)}
                crop={crop}
                minHeight={10}
                minWidth={10}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
              >
                <img
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  ref={imgRef}
                  src={imageUrl}
                  style={{ maxHeight: '65vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-gray-800 pt-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ASPECT_RATIO_OPTIONS.map((option) => (
                <button
                  className={`text-body-sm rounded-md px-3 py-1.5 transition-colors ${
                    aspectPreset === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-secondary hover:bg-surface-tertiary text-gray-300'
                  }`}
                  disabled={processing}
                  key={option.value}
                  onClick={() => handleAspectChange(option.value)}
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

            {showProgress && <ProgressBar value={50} />}

            {error != null && (
              <p className="text-error text-body-sm text-center" role="alert">
                {error}
              </p>
            )}

            <Button block disabled={!completedCrop || processing} onClick={handleCrop} variant="primary">
              Crop
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
