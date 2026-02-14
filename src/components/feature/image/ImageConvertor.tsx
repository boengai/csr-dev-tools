import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import type { ImageFormat } from '@/types'

import {
  ArrowIcon,
  Button,
  DownloadIcon,
  ImageIcon,
  NotoEmoji,
  RefreshIcon,
  Tabs,
  TrashIcon,
  UploadInput,
} from '@/components/common'
import { ProgressBar } from '@/components/common/progress-bar/ProgressBar'
import { LOSSY_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useToolError, useToast } from '@/hooks'
import { convertImageFormat, isValidImageFormat, parseDataUrlToBlob, parseFileName } from '@/utils'

import { ImageFormatSelectInput, ImageQualitySelectInput } from './input'

const TABS_VALUES: Record<'DOWNLOAD' | 'IMPORT' | 'PROCESSING' | 'SELECT_FORMAT', string> = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
  SELECT_FORMAT: 'select-format',
}

const fakeWait = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms))

const toolEntry = TOOL_REGISTRY_MAP['image-converter']

export const ImageConvertor = () => {
  // ref
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)

  // hooks
  const { toast } = useToast()
  const { clearError, error, setError } = useToolError()

  // states
  const [tabValue, setTabValue] = useState(TABS_VALUES.IMPORT)
  const [sources, setSources] = useState<Array<File>>([])
  const [target, setTarget] = useState<{ format: ImageFormat; quality: string }>({
    format: 'image/webp',
    quality: '0.8',
  })
  const [processing, setProcessing] = useState(0)
  const [previews, setPreviews] = useState<Array<{ height: number; url: string; width: number }>>([])

  useEffect(() => {
    if (sources.length === 0) {
      setPreviews([])
      return
    }

    let cancelled = false
    const urls: Array<string> = []

    Promise.all(
      sources.map(
        (file) =>
          new Promise<{ height: number; url: string; width: number }>((resolve) => {
            const url = URL.createObjectURL(file)
            urls.push(url)
            const img = new Image()
            img.onload = () => resolve({ height: img.naturalHeight, url, width: img.naturalWidth })
            img.onerror = () => resolve({ height: 0, url, width: 0 })
            img.src = url
          }),
      ),
    ).then((data) => {
      if (!cancelled) setPreviews(data)
    })

    return () => {
      cancelled = true
      for (const url of urls) {
        URL.revokeObjectURL(url)
      }
    }
  }, [sources])

  const handleInputChange = (values: Array<File>) => {
    const invalidFiles = values.filter((f) => !isValidImageFormat(f.type))
    if (invalidFiles.length > 0) {
      setError('Upload a valid image file (PNG, JPEG, WebP, GIF, BMP, or AVIF)')
      return
    }
    if (values.length > 0) {
      clearError()
      setSources(values)
      setTabValue(TABS_VALUES.SELECT_FORMAT)
    }
  }

  const handleReset = () => {
    clearError()
    setTabValue(TABS_VALUES.IMPORT)
    setSources([])
  }

  const handleRemoveImage = (idx: number) => {
    setSources((prev) => prev.filter((_, i) => i !== idx))
    if (sources.length === 1) {
      setTabValue(TABS_VALUES.IMPORT)
    }
  }

  const handleFormatChange = (value: string) => {
    setTarget((prev) => ({
      ...prev,
      format: value as ImageFormat,
    }))
  }

  const handleConvert = async () => {
    const anchor = downloadAnchorRef.current
    if (!anchor) return

    try {
      // go to processing tab
      setTabValue(TABS_VALUES.PROCESSING)

      // reset state
      setProcessing(0)
      anchor.href = ''
      anchor.download = ''

      const formattedImages: Record<string, string> = {}
      const processTick = 100 / sources.length
      for (const img of sources) {
        const [, fi] = await Promise.all([
          await fakeWait(),
          convertImageFormat(img, target.format, {
            quality: Number(target.quality),
          }),
        ])

        formattedImages[`${parseFileName(img.name, target.format)}`] = fi
        setProcessing((prev) => prev + processTick)
      }

      // wait for animation to complete
      await fakeWait(450)

      // save
      if (Object.keys(formattedImages).length > 1) {
        const { default: JSZip } = await import('jszip')
        const zip = new JSZip()
        for (const [key, value] of Object.entries(formattedImages)) {
          zip.file(key, await parseDataUrlToBlob(value))
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        anchor.href = URL.createObjectURL(blob)
        anchor.download = `csr-dev-tools_converted_${Date.now()}.zip`
      } else {
        for (const [key, value] of Object.entries(formattedImages)) {
          anchor.href = value
          anchor.download = key
        }
      }

      const fileName = anchor.download
      toast({ action: 'add', item: { label: `Downloaded ${fileName}`, type: 'success' } })

      // go to download tab
      setTabValue(TABS_VALUES.DOWNLOAD)
    } catch {
      setError('Image conversion failed — try a different format or smaller file')
      setTabValue(TABS_VALUES.SELECT_FORMAT)
    }
  }

  const isLossy = LOSSY_FORMATS.has(target.format)

  return (
    <div className="flex size-full grow flex-col gap-4">
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
                    button={{ block: true, children: 'Select images from your device' }}
                    multiple
                    name="images"
                    onChange={handleInputChange}
                  />
                </div>
                {error != null && (
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
              <div className="flex h-full grow flex-col items-start gap-4">
                <Button icon={<ArrowIcon />} onClick={handleReset} variant="text">
                  Back
                </Button>
                <ul className="flex max-h-full w-full grow flex-col gap-2 overflow-y-auto">
                  {sources.map((img, idx) => (
                    <motion.li
                      animate={{ opacity: 1, y: 0 }}
                      className="flex w-full items-center gap-2"
                      exit={{ opacity: 0, y: -16 }}
                      initial={{ opacity: 0, y: 16 }}
                      key={`${idx}-${img.name}`}
                      transition={{ damping: 30, stiffness: 300, type: 'spring' }}
                    >
                      {previews[idx] ? (
                        <img alt={img.name} className="size-15 shrink-0 rounded-sm" src={previews[idx].url} />
                      ) : (
                        <div className="size-15 shrink-0 rounded-sm bg-gray-800" />
                      )}
                      <span className="flex grow flex-col truncate">
                        <span className="truncate text-gray-400">{img.name}</span>
                        {previews[idx]?.width ? (
                          <span className="text-body-xs text-gray-500">
                            {previews[idx].width} × {previews[idx].height}
                          </span>
                        ) : null}
                      </span>
                      <button
                        className="hover:bg-error mr-4 rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <TrashIcon />
                      </button>
                    </motion.li>
                  ))}
                </ul>
                <div className="flex w-full shrink-0 gap-2 [&>button]:w-[calc(40%-8px)]">
                  <div className="flex w-3/5 items-center gap-2 [&>*]:w-1/2">
                    <ImageFormatSelectInput onChange={handleFormatChange} value={target.format} />
                    <ImageQualitySelectInput
                      disabled={!isLossy}
                      onChange={(value) =>
                        setTarget((prev) => ({
                          ...prev,
                          quality: value,
                        }))
                      }
                      value={target.quality.toString()}
                    />
                  </div>
                  <Button block icon={<ImageIcon />} onClick={handleConvert} variant="primary">
                    Convert
                  </Button>
                </div>
                {error != null && (
                  <p className="text-error text-body-sm shrink-0" role="alert">
                    {error}
                  </p>
                )}
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
                    onClick={() => downloadAnchorRef.current?.click()}
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
  )
}
