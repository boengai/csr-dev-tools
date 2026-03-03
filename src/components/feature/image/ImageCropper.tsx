import type { Crop, PixelCrop } from 'react-image-crop'

import { useEffect, useReducer, useRef } from 'react'
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

type State = {
  aspectPreset: AspectRatioPreset
  completedCrop: PixelCrop | null
  crop: Crop | undefined
  dialogOpen: boolean
  imageUrl: string | null
  processing: boolean
  showProgress: boolean
  source: File | null
  tabValue: string
}

type Action =
  | { type: 'SET_ASPECT_PRESET'; payload: AspectRatioPreset }
  | { type: 'SET_COMPLETED_CROP'; payload: PixelCrop | null }
  | { type: 'SET_CROP'; payload: Crop | undefined }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_IMAGE_URL'; payload: string | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_SHOW_PROGRESS'; payload: boolean }
  | { type: 'SET_SOURCE'; payload: File | null }
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'INPUT_FILE'; payload: File }
  | { type: 'FINISH_PROCESSING' }
  | { type: 'RESET' }

const initialState: State = {
  aspectPreset: 'free',
  completedCrop: null,
  crop: undefined,
  dialogOpen: false,
  imageUrl: null,
  processing: false,
  showProgress: false,
  source: null,
  tabValue: TABS_VALUES.IMPORT,
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_ASPECT_PRESET':
      return { ...state, aspectPreset: action.payload }
    case 'SET_COMPLETED_CROP':
      return { ...state, completedCrop: action.payload }
    case 'SET_CROP':
      return { ...state, crop: action.payload }
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_IMAGE_URL':
      return { ...state, imageUrl: action.payload }
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload }
    case 'SET_SHOW_PROGRESS':
      return { ...state, showProgress: action.payload }
    case 'SET_SOURCE':
      return { ...state, source: action.payload }
    case 'SET_TAB_VALUE':
      return { ...state, tabValue: action.payload }
    case 'INPUT_FILE':
      return { ...state, source: action.payload, completedCrop: null, crop: undefined, aspectPreset: 'free', dialogOpen: true }
    case 'FINISH_PROCESSING':
      return { ...state, showProgress: false, processing: false }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

export const ImageCropper = () => {
  const croppedUrlRef = useRef<string | null>(null)
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [state, dispatch] = useReducer(reducer, initialState)
  const { aspectPreset, completedCrop, crop, dialogOpen, imageUrl, processing, showProgress, source, tabValue } = state

  const { toast } = useToast()

  useEffect(() => {
    return () => {
      clearTimeout(progressTimerRef.current)
      if (croppedUrlRef.current) URL.revokeObjectURL(croppedUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!source) {
      dispatch({ type: 'SET_IMAGE_URL', payload: null })
      return
    }
    const url = URL.createObjectURL(source)
    dispatch({ type: 'SET_IMAGE_URL', payload: url })
    return () => URL.revokeObjectURL(url)
  }, [source])

  const handleInputChange = (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    dispatch({ type: 'INPUT_FILE', payload: file })
  }

  const handleReset = () => {
    if (croppedUrlRef.current) {
      URL.revokeObjectURL(croppedUrlRef.current)
      croppedUrlRef.current = null
    }
    dispatch({ type: 'RESET' })
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { height, width } = e.currentTarget
    const defaultCrop = getDefaultCrop(width, height, getAspectRatio(aspectPreset))
    const pixelCrop = { ...defaultCrop, unit: 'px' as const }
    dispatch({ type: 'SET_CROP', payload: pixelCrop })
    dispatch({ type: 'SET_COMPLETED_CROP', payload: pixelCrop })
  }

  const handleAspectChange = (preset: AspectRatioPreset) => {
    dispatch({ type: 'SET_ASPECT_PRESET', payload: preset })
    if (imgRef.current) {
      const { height, width } = imgRef.current
      const defaultCrop = getDefaultCrop(width, height, getAspectRatio(preset))
      const pixelCrop = { ...defaultCrop, unit: 'px' as const }
      dispatch({ type: 'SET_CROP', payload: pixelCrop })
      dispatch({ type: 'SET_COMPLETED_CROP', payload: pixelCrop })
    }
  }

  const handleCropAndDownload = async () => {
    if (!completedCrop || !imgRef.current || !source) return

    dispatch({ type: 'SET_PROCESSING', payload: true })
    progressTimerRef.current = setTimeout(() => dispatch({ type: 'SET_SHOW_PROGRESS', payload: true }), 300)

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
      dispatch({ type: 'SET_TAB_VALUE', payload: TABS_VALUES.DOWNLOAD })
      dispatch({ type: 'SET_DIALOG_OPEN', payload: false })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to crop image. Please try again.', type: 'error' } })
    } finally {
      clearTimeout(progressTimerRef.current)
      dispatch({ type: 'FINISH_PROCESSING' })
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
            setValue: (val: string) => dispatch({ type: 'SET_TAB_VALUE', payload: val }),
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
        <a aria-hidden="true" className="hidden" download href="about:blank" ref={downloadAnchorRef} tabIndex={-1} />
      </div>
      <Dialog
        description="Crop your image using the selection handles"
        injected={{ open: dialogOpen, setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }) }}
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
                onChange={(c) => dispatch({ type: 'SET_CROP', payload: c })}
                onComplete={(c) => dispatch({ type: 'SET_COMPLETED_CROP', payload: c })}
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
