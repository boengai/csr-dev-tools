import type { Crop, PixelCrop } from 'react-image-crop'

import { useEffect, useRef, useState } from 'react'
import 'react-image-crop/dist/ReactCrop.css'
import ReactCrop from 'react-image-crop'

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
import { useToast } from '@/hooks'
import { ASPECT_RATIO_OPTIONS, clampCropRegion, getAspectRatio, getDefaultCrop, scaleCropToNatural, tv } from '@/utils'

const cropAreaStyles = tv({
  base: 'bg-grid-texture flex grow items-center justify-center overflow-auto bg-black',
  variants: {
    disabled: {
      true: 'pointer-events-none opacity-70',
      false: '',
    },
  },
})

const aspectButtonStyles = tv({
  base: 'rounded-md px-3 py-1.5 text-body-sm transition-colors',
  variants: {
    active: {
      true: 'text-primary-foreground bg-primary',
      false: 'bg-surface-secondary hover:bg-surface-tertiary text-gray-300',
    },
  },
})

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
}

const toolEntry = TOOL_REGISTRY_MAP['image-cropper']

const cropImageCanvas = (
  image: HTMLImageElement,
  crop: CropRegion,
  mimeType: string,
  quality?: number,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'))
          return
        }
        resolve(URL.createObjectURL(blob))
      },
      mimeType,
      quality,
    )
  })

export const ImageCropper = () => {
  const croppedUrlRef = useRef<string | null>(null)
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

  useEffect(() => {
    return () => {
      clearTimeout(progressTimerRef.current)
      if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current)
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

    setSource(file)
    setCompletedCrop(null)
    setCrop(undefined)
    setAspectPreset('free')
    setDialogOpen(true)
  }

  const handleReset = () => {
    if (croppedUrlRef.current) {
      URL.revokeObjectURL(croppedUrlRef.current)
      croppedUrlRef.current = null
    }
    setTabValue(TABS_VALUES.IMPORT)
    setSource(null)
    setCompletedCrop(null)
    setCrop(undefined)
    setAspectPreset('free')
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

  const handleCropAndDownload = async () => {
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
      const blobUrl = await cropImageCanvas(imgRef.current, clamped, mimeType)

      if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current)
      croppedUrlRef.current = blobUrl

      const anchor = downloadAnchorRef.current
      if (!anchor) return
      const baseName = source.name.replace(/\.[^.]+$/, '')
      const ext = source.name.split('.').pop() || 'png'
      const fileName = `cropped-${baseName}.${ext}`
      anchor.href = blobUrl
      anchor.download = fileName
      anchor.click()

      toast({ action: 'add', item: { label: `Downloaded ${fileName}`, type: 'success' } })
      setTabValue(TABS_VALUES.DOWNLOAD)
      setDialogOpen(false)
    } catch {
      toast({ action: 'add', item: { label: 'Failed to crop image. Please try again.', type: 'error' } })
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
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <Tabs
          injected={{
            setValue: setTabValue,
            value: tabValue,
          }}
          items={[
            {
              content: (
                <div className="flex w-full grow flex-col items-center justify-center gap-4">
                  <div className="w-full desktop:w-8/10">
                    <UploadInput
                      accept="image/*"
                      button={{ block: true, children: 'Select image to crop' }}
                      multiple={false}
                      name="image-cropper"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              ),
              value: TABS_VALUES.IMPORT,
            },
            {
              content: (
                <div className="flex w-full grow flex-col items-center justify-center gap-6">
                  <NotoEmoji emoji="check" size={120} />
                  <div className="flex w-full flex-col gap-4 desktop:w-8/10">
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
            className={cropAreaStyles({ disabled: processing })}
          >
            {imageUrl && (
              <ReactCrop
                aspect={getAspectRatio(aspectPreset)}
                crop={crop}
                minHeight={10}
                minWidth={10}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                style={{ '--rc-drag-handle-mobile-size': '44px' } as React.CSSProperties}
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
                  className={aspectButtonStyles({ active: aspectPreset === option.value })}
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

            <Button block disabled={!completedCrop || processing} onClick={handleCropAndDownload} variant="primary">
              Crop & Download
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
