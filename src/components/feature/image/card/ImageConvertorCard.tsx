import JSZip from 'jszip'
import { motion } from 'motion/react'
import { type Dispatch, type RefObject, type SetStateAction, useRef, useState } from 'react'

import type { ImageFormat } from '@/types'

import {
  ArrowIcon,
  Button,
  Card,
  DownloadIcon,
  ImageIcon,
  NotoEmoji,
  RefreshIcon,
  SelectInput,
  Tabs,
  TrashIcon,
  UploadInput,
} from '@/components/common'
import { ProgressBar } from '@/components/common/progress-bar/ProgressBar'
import { convertImageFormat, parseDataUrlToBlob, parseFileName } from '@/utils'

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT' | 'PROCESSING' | 'SELECT_FORMAT', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
  SELECT_FORMAT: 'select-format',
}

const FILE_EXTENSIONS: Record<ImageFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const ImageConvertorCard = () => {
  // ref
  const downloadAnchorRef: RefObject<HTMLAnchorElement | null> = useRef<HTMLAnchorElement>(null)

  // states
  const [tabValue, setTabValue]: [string, Dispatch<SetStateAction<string>>] = useState<string>(TABS_VALUES.IMPORT)
  const [images, setImages]: [Array<File>, Dispatch<SetStateAction<Array<File>>>] = useState<Array<File>>([])
  const [format, setFormat]: [string, Dispatch<SetStateAction<string>>] = useState<string>('image/webp')
  const [processing, setProcessing]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0)

  const handleInputChange = (values: Array<File>) => {
    setImages(values)
    if (values.length > 0) {
      setTabValue(TABS_VALUES.SELECT_FORMAT)
    }
  }

  const handleReset = () => {
    setTabValue(TABS_VALUES.IMPORT)
    setImages([])
  }

  const handleRemoveImage = (idx: number) => {
    setImages((prev: Array<File>) => prev.filter((_: unknown, i: number) => i !== idx))
    if (images.length === 1) {
      setTabValue(TABS_VALUES.IMPORT)
    }
  }

  const handleConvert = async () => {
    try {
      // go to processing tab
      setTabValue(TABS_VALUES.PROCESSING)

      // reset state
      setProcessing(0)
      downloadAnchorRef.current!.href = ''
      downloadAnchorRef.current!.download = ''

      const formattedImages: Record<string, string> = {}
      const processTick: number = 100 / images.length
      for (const img of images) {
        const fi: string = await convertImageFormat(img, format as ImageFormat)
        formattedImages[`${parseFileName(img.name)}.${FILE_EXTENSIONS[format as ImageFormat]}`] = fi
        setProcessing((prev: number) => prev + processTick)
        await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 800))
      }

      // save
      if (Object.keys(formattedImages).length > 1) {
        const zip: JSZip = new JSZip()
        Object.entries(formattedImages).forEach(([key, value]: [string, string]) => {
          zip.file(key, parseDataUrlToBlob(value))
        })
        downloadAnchorRef.current!.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }))
        downloadAnchorRef.current!.download = `crs-dev-tools_${Date.now()}.zip`
      } else {
        Object.entries(formattedImages).forEach(([key, value]: [string, string]) => {
          downloadAnchorRef.current!.href = value
          downloadAnchorRef.current!.download = key
        })
      }

      // go to download tab
      setTabValue(TABS_VALUES.DOWNLOAD)
    } catch {
      // back to import tab
      setTabValue(TABS_VALUES.IMPORT)
    }
  }

  return (
    <Card title="Image Converter">
      <Tabs
        inject={{
          setValue: setTabValue,
          value: tabValue,
        }}
        items={[
          {
            content: (
              <div className="flex w-full grow flex-col items-center justify-center gap-4">
                <p className="text-center text-gray-400">
                  Upload one or more images and
                  <br />
                  download as a format you want
                </p>
                <div className="desktop:w-8/10 w-full">
                  <UploadInput
                    accept="image/png, image/jpeg, image/webp"
                    button={{ block: true, children: 'Select images from your device' }}
                    multiple
                    name="images"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ),
            value: TABS_VALUES.IMPORT,
          },
          {
            content: (
              <div className="flex h-full grow flex-col items-start gap-4">
                <Button icon={<ArrowIcon />} onClick={handleReset} variant="text">
                  Back
                </Button>
                <ul className="flex max-h-full w-full grow flex-col gap-2 overflow-y-auto">
                  {images.map((img: File, idx: number) => (
                    <motion.li
                      animate={{ opacity: 1, y: 0 }}
                      className="flex w-full items-center gap-2"
                      exit={{ opacity: 0, y: -16 }}
                      initial={{ opacity: 0, y: 16 }}
                      key={`${idx}-${img.name}`}
                      transition={{ damping: 30, stiffness: 300, type: 'spring' }}
                    >
                      <img alt={img.name} className="size-15 shrink-0 rounded-sm" src={URL.createObjectURL(img)} />
                      <span className="grow truncate text-gray-400">{img.name}</span>
                      <button
                        className="hover:bg-error mr-4 cursor-pointer rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <TrashIcon />
                      </button>
                    </motion.li>
                  ))}
                </ul>
                <div className="flex w-full shrink-0 gap-2 [&>*]:w-1/2">
                  <SelectInput
                    name="format"
                    onChange={setFormat}
                    options={[
                      { label: 'PNG', value: 'image/png' },
                      { label: 'JPEG', value: 'image/jpeg' },
                      { label: 'WebP', value: 'image/webp' },
                    ]}
                    placeholder="Select image format"
                    value={format}
                  />
                  <Button block icon={<ImageIcon />} onClick={handleConvert} variant="primary">
                    Convert
                  </Button>
                </div>
              </div>
            ),
            value: TABS_VALUES.SELECT_FORMAT,
          },
          {
            content: (
              <div className="flex w-full grow flex-col items-center justify-center gap-6">
                <NotoEmoji emoji="robot" size={120} />
                <div className="desktop:w-8/10 w-full">
                  <ProgressBar value={processing} />
                </div>
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
      <a className="hidden" download="" href="" ref={downloadAnchorRef} />
    </Card>
  )
}
