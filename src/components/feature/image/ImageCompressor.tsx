import { useEffect, useReducer, useRef } from 'react'

import { Button, DownloadIcon, FieldForm, ProgressBar, UploadInput } from '@/components/common'
import { COMPRESSIBLE_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useToast, useToolComputation } from '@/hooks'
import type { CompressInput, ImageCompressorAction, ImageCompressorState, ImageProcessingResult } from '@/types'
import { formatFileSize, processImage, tv } from '@/utils'

const processingWrapperStyles = tv({
  base: 'flex flex-col gap-2',
  variants: {
    disabled: {
      true: 'pointer-events-none opacity-70',
      false: '',
    },
  },
})

const toolEntry = TOOL_REGISTRY_MAP['image-compressor']
const initialState: ImageCompressorState = {
  compressed: null,
  originalInfo: null,
  processing: false,
  quality: 80,
  showProgress: false,
  source: null,
}

const reducer = (state: ImageCompressorState, action: ImageCompressorAction): ImageCompressorState => {
  switch (action.type) {
    case 'SET_COMPRESSED':
      return { ...state, compressed: action.payload }
    case 'SET_ORIGINAL_INFO':
      return { ...state, originalInfo: action.payload }
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload }
    case 'SET_QUALITY':
      return { ...state, quality: action.payload }
    case 'SET_SHOW_PROGRESS':
      return { ...state, showProgress: action.payload }
    case 'SET_SOURCE':
      return { ...state, source: action.payload }
    case 'CLEAR_ON_REJECT':
      return { ...state, source: null, compressed: null, originalInfo: null }
    case 'START_COMPRESS':
      return {
        ...state,
        source: action.payload.source,
        compressed: null,
        originalInfo: { height: 0, name: action.payload.source.name, size: action.payload.source.size, width: 0 },
      }
    case 'FINISH_COMPRESS':
      return { ...state, showProgress: false, processing: false }
    default:
      return state
  }
}

export const ImageCompressor = () => {
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [state, dispatch] = useReducer(reducer, initialState)
  const { originalInfo, processing, quality, showProgress, source } = state

  const { showError, showSuccess } = useToast()

  // M3 fix: cleanup progress timer on unmount
  useEffect(() => {
    return () => {
      clearTimeout(progressTimerRef.current)
    }
  }, [])

  const {
    result: compressed,
    setInput,
    setInputImmediate,
  } = useToolComputation<CompressInput, ImageProcessingResult | null>(
    async ({ file, quality: q }) => {
      if (!file) return null
      dispatch({ type: 'SET_PROCESSING', payload: true })
      clearTimeout(progressTimerRef.current)
      progressTimerRef.current = setTimeout(() => dispatch({ type: 'SET_SHOW_PROGRESS', payload: true }), 300)
      try {
        const result = await processImage(file, { quality: q / 100, strategy: 'stretch' })
        clearTimeout(progressTimerRef.current)
        dispatch({ type: 'FINISH_COMPRESS' })
        return result
      } catch (err) {
        clearTimeout(progressTimerRef.current)
        dispatch({ type: 'FINISH_COMPRESS' })
        throw err
      }
    },
    {
      debounceMs: 300,
      initial: null,
      isEmpty: ({ file }) => !file,
      onError: () => {
        showError('Compression failed — try a different image')
      },
    },
  )

  // Backfill originalInfo dimensions once the first compress for a given source resolves.
  useEffect(() => {
    if (compressed && source && originalInfo && originalInfo.width === 0) {
      dispatch({
        type: 'SET_ORIGINAL_INFO',
        payload: { height: compressed.height, name: source.name, size: source.size, width: compressed.width },
      })
    }
  }, [compressed, source, originalInfo])

  const handleInputChange = (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    // H1 fix: clear stale state on format rejection
    if (!COMPRESSIBLE_FORMATS.has(file.type)) {
      showError('Image compression supports JPEG and WebP formats')
      dispatch({ type: 'CLEAR_ON_REJECT' })
      setInputImmediate({ file: null, quality })
      return
    }

    dispatch({ type: 'START_COMPRESS', payload: { source: file } })
    // Upload click is not part of a keystroke stream → immediate.
    setInputImmediate({ file, quality })
  }

  const handleQualityChange = (newQuality: number) => {
    dispatch({ type: 'SET_QUALITY', payload: newQuality })
    if (source) {
      // Quality slider drag is keystroke-like → debounced.
      setInput({ file: source, quality: newQuality })
    }
  }

  const handleDownload = () => {
    if (!compressed?.dataUrl || !source) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return
    const ext = source.type === 'image/webp' ? 'webp' : 'jpg'
    const baseName = source.name.replace(/\.[^.]+$/, '')
    anchor.href = compressed.dataUrl
    anchor.download = `compressed-${baseName}.${ext}`
    anchor.click()
    showSuccess(`Downloaded compressed-${baseName}.${ext}`)
  }

  const compressionRatio =
    originalInfo && compressed ? Math.round((1 - compressed.size / originalInfo.size) * 100) : null

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

      <div className="flex grow flex-col items-center justify-center gap-2">
        <UploadInput
          accept="image/jpeg,image/webp"
          button={{ block: true, children: 'Select JPEG or WebP image' }}
          multiple={false}
          name="image-compressor"
          onChange={handleInputChange}
        />
      </div>

      {originalInfo && originalInfo.width > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-body-sm text-gray-300">
            {originalInfo.name} — {originalInfo.width}x{originalInfo.height} — {formatFileSize(originalInfo.size)}
          </p>
        </div>
      )}

      {/* M2 fix: dim slider during processing */}
      {source && (
        <div className={processingWrapperStyles({ disabled: processing })}>
          <FieldForm
            disabled={processing}
            label="Quality"
            max={100}
            min={1}
            name="quality-slider"
            onChange={(val: string) => handleQualityChange(Number(val))}
            type="range"
            value={String(quality)}
          />
        </div>
      )}

      {showProgress && <ProgressBar value={50} />}

      {compressed && originalInfo && !processing && (
        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="text-body-sm text-gray-300">
            {formatFileSize(originalInfo.size)} → {formatFileSize(compressed.size)}
            {compressionRatio != null && compressionRatio > 0 ? (
              <span className="ml-2 text-success">{compressionRatio}% smaller</span>
            ) : (
              <span className="ml-2 text-warning">No reduction</span>
            )}
          </p>
        </div>
      )}

      {compressed && !processing && (
        <div className="w-full desktop:w-8/10">
          <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
            Download
          </Button>
        </div>
      )}

      <a aria-hidden="true" className="hidden" download href="about:blank" ref={downloadAnchorRef} tabIndex={-1} />
    </div>
  )
}
