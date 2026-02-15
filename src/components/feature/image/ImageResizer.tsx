import { type ImgHTMLAttributes, useEffect, useRef, useState } from 'react'

import type { ImageFormat, ImageProcessingResult } from '@/types'

import { Button, Dialog, DownloadIcon, FieldForm, NotoEmoji, RefreshIcon, Tabs, UploadInput } from '@/components/common'
import { LOSSY_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { formatFileSize, isValidImageFormat, parseFileName, processImage, resizeImage } from '@/utils'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT' | 'PROCESSING', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
}

const EMPTY_IMAGE = 'data:,'

const toolEntry = TOOL_REGISTRY_MAP['image-resizer']

const formatBytes = formatFileSize

const ImagePreview = ({
  metadata,
  src,
}: Pick<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  metadata?: {
    format?: ImageFormat
    height?: number
    size?: number
    width?: number
  }
}) => {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
      {src ? (
        src === EMPTY_IMAGE ? (
          <NotoEmoji emoji="bomb" size={120} />
        ) : (
          <>
            <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
              <img alt="preview" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={src} />
            </picture>
            {metadata && (
              <ul className="flex gap-1 text-center text-body-sm text-gray-200 italic">
                {metadata.width && metadata.height && (
                  <li>
                    {metadata.width}x{metadata.height};
                  </li>
                )}
                {metadata.format && <li>{metadata.format};</li>}
                {metadata.size && <li>{formatBytes(metadata.size)};</li>}
              </ul>
            )}
          </>
        )
      ) : (
        <NotoEmoji emoji="robot" size={120} />
      )}
    </div>
  )
}

export const ImageResizer = () => {
  // ref
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)

  // state
  const [tabValue, setTabValue] = useState(TABS_VALUES.IMPORT)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [source, setSource] = useState<[File, ImageProcessingResult] | null>(null)
  const [preview, setPreview] = useState<ImageProcessingResult | null>(null)

  const sessionRef = useRef(0)

  // hooks
  const { toast } = useToast()

  const dbSetPreview = useDebounceCallback(async (s: ImageProcessingResult) => {
    if (!source) return

    const currentSession = ++sessionRef.current

    let height = s.height
    let width = s.width

    // Validate dimensions before processing
    if (Number.isNaN(height) || Number.isNaN(width) || height <= 0 || width <= 0) {
      toast({ action: 'add', item: { label: 'Enter valid dimensions (e.g., 800 x 600)', type: 'error' } })
      return
    }

    // find possible minimum
    if (height * source[1].ratio <= 1) {
      height = 1 * 10
      width = Math.round(1 * source[1].ratio * 10)
    } else if (width / source[1].ratio <= 1) {
      width = 1 * 10
      height = Math.round((1 / source[1].ratio) * 10)
    }

    try {
      const result = await resizeImage(
        source[0],
        {
          height,
          width,
        },
        {
          format: s.format,
          quality: s.quality || 0.05,
        },
      )

      if (currentSession !== sessionRef.current) return

      if (result.dataUrl === EMPTY_IMAGE) {
        toast({
          action: 'add',
          item: { label: 'Image resize failed — file may be too large for browser memory', type: 'error' },
        })
        return
      }

      setPreview(result)
    } catch {
      if (currentSession !== sessionRef.current) return
      toast({
        action: 'add',
        item: { label: 'Image resize failed — try smaller dimensions or a different format', type: 'error' },
      })
    }
  })

  const handleUploadChange = async (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    if (!isValidImageFormat(file.type)) {
      toast({
        action: 'add',
        item: { label: 'Upload a valid image file (PNG, JPEG, WebP, GIF, BMP, or AVIF)', type: 'error' },
      })
      return
    }

    try {
      setDialogOpen(true)
      const result = await processImage(file, {
        format: file.type as ImageFormat,
        quality: 1,
        strategy: 'stretch',
      })

      setSource([file, result])
      setPreview(result)
      setTabValue(TABS_VALUES.PROCESSING)
    } catch {
      toast({
        action: 'add',
        item: { label: 'Upload a valid image file (PNG, JPEG, WebP, GIF, BMP, or AVIF)', type: 'error' },
      })
      handleReset()
    }
  }

  const handleInputChange = (key: keyof ImageProcessingResult, val: unknown) => {
    setPreview((prev) => {
      if (!prev) {
        return null
      }

      const newState = {
        ...prev,
        dataUrl: '', // unset dataUrl for showing loading state
      }

      if (key === 'format') {
        newState.format = val as ImageFormat
      } else {
        const newValue = Number(val)
        newState[key] = newValue as never

        if (!Number.isNaN(newValue) && newValue > 0) {
          if (key === 'width') {
            newState.height = Math.round(newValue / (source?.[1].ratio ?? 1))
          } else if (key === 'height') {
            newState.width = Math.round(newValue * (source?.[1].ratio ?? 1))
          }
        }
      }

      return newState
    })
  }

  const handleConvert = async () => {
    try {
      const anchor = downloadAnchorRef.current
      if (!preview?.dataUrl || !anchor || !source) {
        return
      }

      // go to processing tab
      setTabValue(TABS_VALUES.PROCESSING)

      // set to download anchor
      anchor.href = preview.dataUrl
      anchor.download = parseFileName(source[0].name, preview.format)

      // go to download tab
      setTabValue(TABS_VALUES.DOWNLOAD)
      setDialogOpen(false)
    } catch {
      toast({
        action: 'add',
        item: { label: 'Image resize failed — try smaller dimensions or a different format', type: 'error' },
      })
      setDialogOpen(false)
    }
  }

  const handleReset = () => {
    setTabValue(TABS_VALUES.IMPORT)
    setSource(null)
    setPreview(null)
  }

  useEffect(() => {
    if (!preview?.dataUrl && preview?.format) {
      dbSetPreview(preview)
    }
  }, [preview, dbSetPreview])

  const isLossy = preview?.format ? LOSSY_FORMATS.has(preview.format) : false

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
                      button={{ block: true, children: 'Select images from your device' }}
                      multiple={false}
                      name="images"
                      onChange={handleUploadChange}
                    />
                  </div>
                </div>
              ),
              value: TABS_VALUES.IMPORT,
            },
            {
              content: (
                <div className="flex w-full grow flex-col items-center justify-center gap-6">
                  <NotoEmoji emoji="robot" size={120} />
                </div>
              ),
              value: TABS_VALUES.PROCESSING,
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
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="Adjust the size of your image"
      >
        <div className="flex grow flex-col gap-4 tablet:min-h-0">
          <div
            aria-live="polite"
            className="bg-grid-texture flex flex-col items-center justify-center gap-6 bg-black tablet:min-h-0 tablet:grow tablet:flex-row"
          >
            <ImagePreview
              metadata={{
                format: source?.[1].format,
                height: source?.[1].height,
                size: source?.[0].size,
                width: source?.[1].width,
              }}
              src={source ? source[1].dataUrl : undefined}
            />
            <div className="tablet:border-t-none h-1 w-full border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-1 tablet:border-l-2" />
            <ImagePreview
              metadata={{
                format: preview?.format,
                height: preview?.height,
                size: preview?.size,
                width: preview?.width,
              }}
              src={preview?.dataUrl}
            />
          </div>
          <div className="flex w-full shrink-0 flex-col justify-center gap-2 desktop:flex-row">
            <div className="flex w-full flex-col items-end gap-2 tablet:flex-row">
              <div className="flex w-full gap-2">
                <FieldForm
                  disabled={!source}
                  label="Width"
                  name="width"
                  onChange={(val) => handleInputChange('width', val)}
                  placeholder="1920"
                  type="number"
                  value={preview?.width?.toString() ?? ''}
                />
                <FieldForm
                  disabled={!source}
                  label="Height"
                  name="height"
                  onChange={(val) => handleInputChange('height', val)}
                  placeholder="1080"
                  type="number"
                  value={preview?.height?.toString() ?? ''}
                />
              </div>
              <div className="flex w-full gap-2 *:w-full">
                <ImageFormatSelectInput
                  disabled={!source}
                  onChange={(val) => handleInputChange('format', val)}
                  value={preview?.format}
                />
                <ImageQualitySelectInput
                  disabled={!source || !isLossy}
                  onChange={(val) => handleInputChange('quality', val)}
                  value={!isLossy ? '1' : preview?.quality?.toString()}
                />
              </div>
            </div>
            <div className="flex w-full items-end desktop:w-2/5">
              <Button block disabled={!source} onClick={handleConvert} variant="primary">
                Convert
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
