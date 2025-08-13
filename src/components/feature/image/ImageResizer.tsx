import { type Dispatch, type RefObject, type SetStateAction, useEffect, useRef, useState } from 'react'

import type { ImageFormat, ImageProcessingResult, UseToast } from '@/types'

import { Button, Dialog, DownloadIcon, FieldForm, NotoEmoji, RefreshIcon, Tabs, UploadInput } from '@/components/common'
import { useDebounceCallback, useToast } from '@/hooks'
import { parseFileName, processImage, resizeImage } from '@/utils'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT' | 'PROCESSING', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
}

export const ImageResizer = () => {
  // ref
  const downloadAnchorRef: RefObject<HTMLAnchorElement | null> = useRef<HTMLAnchorElement>(null)

  // state
  const [tabValue, setTabValue]: [string, Dispatch<SetStateAction<string>>] = useState<string>(TABS_VALUES.IMPORT)
  const [dialogOpen, setDialogOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
  const [source, setSource]: [File | null, Dispatch<SetStateAction<File | null>>] = useState<File | null>(null)
  const [preview, setPreview]: [ImageProcessingResult | null, Dispatch<SetStateAction<ImageProcessingResult | null>>] =
    useState<ImageProcessingResult | null>(null)

  // hook
  const { toast }: UseToast = useToast()
  const dbSetPreview: (s: ImageProcessingResult) => Promise<void> = useDebounceCallback(
    async (s: ImageProcessingResult) => {
      try {
        const newResult: ImageProcessingResult = await resizeImage(
          source!,
          {
            height: s.height,
            width: s.width,
          },
          {
            format: s.format,
            quality: s.quality,
          },
        )
        setPreview(newResult)
      } catch {
        toast({
          action: 'add',
          item: {
            label: 'Failed to process image',
            type: 'error',
          },
        })
      }
    },
  )

  const handleUploadChange = async (values: Array<File>) => {
    try {
      setSource(values[0])
      setDialogOpen(true)
      if (values.length > 0) {
        setPreview(
          await processImage(values[0], {
            format: values[0].type as ImageFormat,
            quality: 1,
            strategy: 'stretch',
          }),
        )
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
    setPreview((prev: ImageProcessingResult | null) => {
      if (!prev) {
        return null
      }

      const newValue: number = Number(val)
      const newState: ImageProcessingResult = {
        ...prev,
        dataUrl: '', // unset dataUrl for showing loading state
        [key]: val,
      }

      // For width/height changes, maintain aspect ratio
      if (key === 'width' && !isNaN(newValue) && newValue > 0) {
        newState.height = Math.round(newValue / prev.ratio)
      } else if (key === 'height' && !isNaN(newValue) && newValue > 0) {
        newState.width = Math.round(newValue * prev.ratio)
      }

      // For other properties (format, quality), just update normally
      return newState
    })
  }

  const handleConvert = async () => {
    try {
      // go to processing tab
      setTabValue(TABS_VALUES.PROCESSING)

      // set to download anchor
      downloadAnchorRef.current!.href = preview!.dataUrl
      downloadAnchorRef.current!.download = parseFileName(source!.name, preview!.format)

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
        description="Adjust the size of your image"
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={handleReset}
        size="screen"
        title="Adjust the size of your image"
      >
        <div className="flex min-h-0 grow flex-col gap-4">
          <div className="bg-grid-texture flex min-h-0 grow items-center justify-center gap-4 bg-black p-4">
            {preview?.dataUrl ? (
              <img alt="preview" className="max-h-full w-full max-w-full object-contain" src={preview.dataUrl} />
            ) : (
              <NotoEmoji emoji="robot" size={120} />
            )}
          </div>
          <div className="desktop:flex-row flex w-full shrink-0 flex-col justify-center gap-2">
            <div className="flex w-full items-end gap-2">
              <FieldForm
                label="Width"
                name="width"
                onChange={(val: string) => handleInputChange('width', val)}
                type="number"
                value={preview?.width?.toString() ?? ''}
              />
              <FieldForm
                label="Height"
                name="height"
                onChange={(val: string) => handleInputChange('height', val)}
                type="number"
                value={preview?.height?.toString() ?? ''}
              />
              <ImageFormatSelectInput
                onChange={(val: string) => handleInputChange('format', val)}
                value={preview?.format}
              />
              <ImageQualitySelectInput
                onChange={(val: string) => handleInputChange('quality', val)}
                value={preview?.quality?.toString()}
              />
            </div>
            <div className="desktop:w-2/5 flex w-full items-end">
              <Button block onClick={handleConvert} variant="primary">
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
