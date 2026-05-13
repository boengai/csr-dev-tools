import { m } from 'motion/react'
import { useEffect, useReducer, useRef } from 'react'

import {
  ArrowIcon,
  Button,
  DownloadIcon,
  ImageIcon,
  NotoEmoji,
  ProgressBar,
  RefreshIcon,
  Tabs,
  TrashIcon,
  UploadInput,
} from '@/components/common'
import { LOSSY_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { ImageFormat } from '@/types'
import type { DownloadTarget, State, Action } from '@/types/components/feature/image/imageConvertor'
import { downloadBlob } from '@/utils/download'
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
const initialState: State = {
  previews: [],
  processing: 0,
  sources: [],
  tabValue: TABS_VALUES.IMPORT,
  target: { format: 'image/webp', quality: '0.8' },
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TAB_VALUE':
      return { ...state, tabValue: action.payload }
    case 'SET_SOURCES':
      return { ...state, sources: action.payload }
    case 'SET_TARGET':
      return { ...state, target: action.payload }
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload }
    case 'SET_PREVIEWS':
      return { ...state, previews: action.payload }
    case 'INCREMENT_PROCESSING':
      return { ...state, processing: state.processing + action.payload }
    case 'REMOVE_SOURCE':
      return { ...state, sources: state.sources.filter((_, i) => i !== action.payload) }
    case 'RESET':
      return { ...state, tabValue: TABS_VALUES.IMPORT, sources: [] }
  }
}

export const ImageConvertor = () => {
  const downloadTargetRef = useRef<DownloadTarget | null>(null)

  // hooks
  const { toast } = useToast()

  // state
  const [state, dispatch] = useReducer(reducer, initialState)
  const { previews, processing, sources, tabValue, target } = state

  useEffect(() => {
    if (sources.length === 0) {
      dispatch({ type: 'SET_PREVIEWS', payload: [] })
      return
    }

    let cancelled = false

    Promise.all(
      sources.map(
        (file) =>
          new Promise<{ height: number; url: string; width: number }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const url = typeof reader.result === 'string' ? reader.result : ''
              const img = new Image()
              img.onload = () => resolve({ height: img.naturalHeight, url, width: img.naturalWidth })
              img.onerror = () => resolve({ height: 0, url, width: 0 })
              img.src = url
            }
            reader.onerror = () => resolve({ height: 0, url: '', width: 0 })
            reader.readAsDataURL(file)
          }),
      ),
    ).then((data) => {
      if (!cancelled) dispatch({ type: 'SET_PREVIEWS', payload: data })
    })

    return () => {
      cancelled = true
    }
  }, [sources])

  const handleInputChange = (values: Array<File>) => {
    const invalidFiles = values.filter((f) => !isValidImageFormat(f.type))
    if (invalidFiles.length > 0) {
      toast({
        action: 'add',
        item: { label: 'Upload a valid image file (PNG, JPEG, WebP, GIF, BMP, or AVIF)', type: 'error' },
      })
      return
    }
    if (values.length > 0) {
      dispatch({ type: 'SET_SOURCES', payload: values })
      dispatch({ type: 'SET_TAB_VALUE', payload: TABS_VALUES.SELECT_FORMAT })
    }
  }

  const handleReset = () => {
    dispatch({ type: 'RESET' })
  }

  const handleRemoveImage = (idx: number) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: idx })
    if (sources.length === 1) {
      dispatch({ type: 'SET_TAB_VALUE', payload: TABS_VALUES.IMPORT })
    }
  }

  const handleFormatChange = (value: string) => {
    dispatch({
      type: 'SET_TARGET',
      payload: { ...target, format: value as ImageFormat },
    })
  }

  const handleConvert = async () => {
    try {
      // go to processing tab
      dispatch({ type: 'SET_TAB_VALUE', payload: TABS_VALUES.PROCESSING })
      dispatch({ type: 'SET_PROCESSING', payload: 0 })
      downloadTargetRef.current = null

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
        dispatch({ type: 'INCREMENT_PROCESSING', payload: processTick })
      }

      // wait for animation to complete
      await fakeWait(450)

      // save
      let fileName: string
      if (Object.keys(formattedImages).length > 1) {
        const { default: JSZip } = await import('jszip')
        const zip = new JSZip()
        for (const [key, value] of Object.entries(formattedImages)) {
          zip.file(key, await parseDataUrlToBlob(value))
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        fileName = `csr-dev-tools_converted_${Date.now()}.zip`
        downloadTargetRef.current = { blob, filename: fileName }
        downloadBlob(blob, fileName)
      } else {
        const [[key, dataUrl]] = Object.entries(formattedImages)
        fileName = key
        downloadTargetRef.current = { dataUrl, filename: fileName }
        const blob = await parseDataUrlToBlob(dataUrl)
        downloadBlob(blob, fileName)
      }

      toast({ action: 'add', item: { label: `Downloaded ${fileName}`, type: 'success' } })

      // go to download tab
      dispatch({ type: 'SET_TAB_VALUE', payload: TABS_VALUES.DOWNLOAD })
    } catch {
      toast({
        action: 'add',
        item: { label: 'Image conversion failed — try a different format or smaller file', type: 'error' },
      })
      dispatch({ type: 'SET_TAB_VALUE', payload: TABS_VALUES.SELECT_FORMAT })
    }
  }

  const handleRedownload = async () => {
    const dt = downloadTargetRef.current
    if (!dt) return
    let blob: Blob
    if ('blob' in dt) {
      blob = dt.blob
    } else {
      blob = await parseDataUrlToBlob(dt.dataUrl)
    }
    downloadBlob(blob, dt.filename)
    toast({ action: 'add', item: { label: `Downloaded ${dt.filename}`, type: 'success' } })
  }

  const isLossy = LOSSY_FORMATS.has(target.format)

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <Tabs
        injected={{
          setValue: (value: string) => dispatch({ type: 'SET_TAB_VALUE', payload: value }),
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
                  {sources.map((img, idx) => (
                    <m.li
                      animate={{ opacity: 1, y: 0 }}
                      className="flex w-full items-center gap-2"
                      exit={{ opacity: 0, y: -16 }}
                      initial={{ opacity: 0, y: 16 }}
                      key={`${img.name}-${img.size}-${img.lastModified}`}
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
                        aria-label={`Remove ${img.name}`}
                        className="mr-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-error hover:text-white"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <TrashIcon />
                      </button>
                    </m.li>
                  ))}
                </ul>
                <div className="flex w-full shrink-0 gap-2 [&>button]:w-[calc(40%-8px)]">
                  <div className="flex w-3/5 items-center gap-2 *:w-1/2">
                    <ImageFormatSelectInput onChange={handleFormatChange} value={target.format} />
                    <ImageQualitySelectInput
                      disabled={!isLossy}
                      onChange={(value) =>
                        dispatch({
                          type: 'SET_TARGET',
                          payload: { ...target, quality: value },
                        })
                      }
                      value={target.quality.toString()}
                    />
                  </div>
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
              <div aria-live="polite" className="flex w-full grow flex-col items-center justify-center gap-6">
                <NotoEmoji emoji="robot" size={120} />
                <div className="w-full desktop:w-8/10">
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
                <div className="flex w-full flex-col gap-4 desktop:w-8/10">
                  <Button
                    block
                    icon={<DownloadIcon />}
                    onClick={handleRedownload}
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
    </div>
  )
}
