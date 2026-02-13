import { type ImgHTMLAttributes, useEffect, useRef, useState } from 'react'

import type { ImageFormat, ImageProcessingResult } from '@/types'

import { Button, Dialog, DownloadIcon, FieldForm, NotoEmoji, RefreshIcon, Tabs, UploadInput } from '@/components/common'
import { IMAGE_VALUE } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
import { parseFileName, processImage, resizeImage } from '@/utils'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT' | 'PROCESSING', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
}

const EMPTY_IMAGE = 'data:,'

const formatBytes = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))}${sizes[i]}`
}

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
    <div className="tablet:size-full tablet:max-h-full flex w-full grow flex-col items-center justify-center gap-4 p-4">
      {src ? (
        src === EMPTY_IMAGE ? (
          <NotoEmoji emoji="bomb" size={120} />
        ) : (
          <>
            <picture className="tablet:max-h-full tablet:overflow-y-auto flex size-full grow flex-col items-center justify-center gap-4">
              <img alt="preview" className="tablet:max-h-full tablet:w-auto w-full max-w-full" src={src} />
            </picture>
            {metadata && (
              <ul className="text-body-sm flex gap-1 text-center text-gray-200 italic">
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

  // hook
  const { toast } = useToast()
  const dbSetPreview = useDebounceCallback(async (s: ImageProcessingResult) => {
    let height = s.height
    let width = s.width

    // find possible minimum
    if (height * source![1].ratio <= 1) {
      height = 1 * 10
      width = Math.round(1 * source![1].ratio * 10)
    } else if (width / source![1].ratio <= 1) {
      width = 1 * 10
      height = Math.round((1 / source![1].ratio) * 10)
    }

    try {
      const result = await resizeImage(
        source![0],
        {
          height,
          width,
        },
        {
          format: s.format,
          quality: s.quality || 0.05,
        },
      )

      setPreview(result)

      if (result.dataUrl === EMPTY_IMAGE) {
        throw new Error('Could not process image. Because of memory limit.')
      }
    } catch (e: unknown) {
      toast({
        action: 'add',
        item: {
          duration: 5_000,
          label: e instanceof Error ? e.message : 'Failed to process image',
          type: 'error',
        },
      })
    }
  })

  const handleUploadChange = async (values: Array<File>) => {
    try {
      if (values.length > 0) {
        setDialogOpen(true)
        const preview = await processImage(values[0], {
          format: values[0].type as ImageFormat,
          quality: 1,
          strategy: 'stretch',
        })

        setSource([values[0], preview])
        setPreview(preview)
        setTabValue(TABS_VALUES.PROCESSING)
      }
    } catch {
      toast({
        action: 'add',
        item: {
          label: 'Failed to process image',
          type: 'error',
        },
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
        // NOTE: this might cause type errors
        // when the value is not a number
        const newValue = Number(val)
        newState[key] = newValue as never

        if (!isNaN(newValue) && newValue > 0) {
          if (key === 'width') {
            newState.height = Math.round(newValue / source![1].ratio)
          } else if (key === 'height') {
            newState.width = Math.round(newValue * source![1].ratio)
          }
        }
      }

      // For other properties (format, quality), just update normally
      return newState
    })
  }

  const handleConvert = async () => {
    try {
      if (!preview?.dataUrl) {
        return
      }

      // go to processing tab
      setTabValue(TABS_VALUES.PROCESSING)

      // set to download anchor
      downloadAnchorRef.current!.href = preview!.dataUrl
      downloadAnchorRef.current!.download = parseFileName(source![0].name, preview!.format)

      toast({ action: 'add', item: { label: 'Resized image successfully', type: 'success' } })

      // go to download tab
      setTabValue(TABS_VALUES.DOWNLOAD)
      setDialogOpen(false)
    } catch {
      toast({ action: 'add', item: { label: 'Failed to resize image', type: 'error' } })
      // back to import tab
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

  return (
    <>
      <Tabs
        injected={{
          setValue: setTabValue,
          value: tabValue,
        }}
        items={[
          {
            content: (
              <div className="flex w-full grow flex-col items-center justify-center gap-4">
                <p className="text-body-sm text-center text-gray-400">Select an image to resize</p>
                <div className="desktop:w-8/10 w-full">
                  <UploadInput
                    accept="image/png, image/jpeg, image/webp"
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
                <div className="desktop:w-8/10 flex w-full flex-col gap-4">
                  <Button
                    block
                    icon={<DownloadIcon />}
                    onClick={() => downloadAnchorRef.current!.click()}
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
      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="Adjust the size of your image"
      >
        <div className="tablet:min-h-0 flex grow flex-col gap-4">
          <div className="bg-grid-texture tablet:min-h-0 tablet:grow tablet:flex-row flex flex-col items-center justify-center gap-6 bg-black">
            <ImagePreview
              metadata={{
                format: source?.[1].format,
                height: source?.[1].height,
                size: source?.[0].size,
                width: source?.[1].width,
              }}
              src={source ? source[1].dataUrl : undefined}
            />
            <div className="tablet:border-t-none tablet:h-full tablet:w-1 tablet:border-l-2 h-1 w-full border-t-2 border-dashed border-gray-700" />
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
          <div className="desktop:flex-row flex w-full shrink-0 flex-col justify-center gap-2">
            <div className="tablet:flex-row flex w-full flex-col items-end gap-2">
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
              <div className="flex w-full gap-2 [&>*]:w-full">
                <ImageFormatSelectInput
                  disabled={!source}
                  onChange={(val) => handleInputChange('format', val)}
                  value={preview?.format}
                />
                <ImageQualitySelectInput
                  disabled={!source || preview?.format === IMAGE_VALUE['image/png']}
                  onChange={(val) => handleInputChange('quality', val)}
                  value={preview?.format === IMAGE_VALUE['image/png'] ? '1' : preview?.quality?.toString()}
                />
              </div>
            </div>
            <div className="desktop:w-2/5 flex w-full items-end">
              <Button block disabled={!source} onClick={handleConvert} variant="primary">
                Convert
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
      <a className="hidden" download="" href="" ref={downloadAnchorRef} />
    </>
  )
}
