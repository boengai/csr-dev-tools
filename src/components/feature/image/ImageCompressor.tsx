import { useEffect, useState } from 'react'

import { Button, DownloadIcon, FieldForm, ProgressBar, UploadInput } from '@/components/common'
import { COMPRESSIBLE_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useTimeoutRef, useToast, useToolFields } from '@/hooks'
import type { CompressInput, ImageProcessingResult, OriginalInfo } from '@/types'
import { downloadDataUrl, formatFileSize, processImage, tv } from '@/utils'

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

const INITIAL_INPUT: CompressInput = { file: null, quality: 80 }

const PROGRESS_THRESHOLD_MS = 300

export const ImageCompressor = () => {
  const { showError, showSuccess } = useToast()
  const progressTimer = useTimeoutRef()
  const [showProgress, setShowProgress] = useState(false)

  const {
    inputs: { file, quality },
    isPending,
    result: compressed,
    setFields,
    setFieldsImmediate,
  } = useToolFields<CompressInput, ImageProcessingResult | null>({
    compute: async ({ file: f, quality: q }) => {
      if (!f) return null
      return await processImage(f, { quality: q / 100, strategy: 'stretch' })
    },
    debounceMs: 300,
    initial: INITIAL_INPUT,
    initialResult: null,
    isEmpty: ({ file: f }) => !f,
    onError: () => showError('Compression failed — try a different image'),
  })

  // Show the progress bar only when compute outlasts a 300ms threshold —
  // pipeline-driven, no dispatch-from-inside-compute.
  useEffect(() => {
    if (isPending) {
      progressTimer.schedule(() => setShowProgress(true), PROGRESS_THRESHOLD_MS)
    } else {
      progressTimer.cancel()
      setShowProgress(false)
    }
  }, [isPending, progressTimer])

  // `originalInfo` derives from file + compressed; no separate state needed.
  // Width/height come from the result once it resolves; before then they're 0,
  // matching the pre-migration "originalInfo.width === 0" gate the JSX checks.
  const originalInfo: OriginalInfo | null = file
    ? {
        height: compressed?.height ?? 0,
        name: file.name,
        size: file.size,
        width: compressed?.width ?? 0,
      }
    : null

  const handleInputChange = (values: Array<File>) => {
    const f = values[0]
    if (!f) return

    if (!COMPRESSIBLE_FORMATS.has(f.type)) {
      showError('Image compression supports JPEG and WebP formats')
      setFieldsImmediate({ file: null })
      return
    }

    // Upload click is not part of a keystroke stream → immediate.
    setFieldsImmediate({ file: f })
  }

  const handleQualityChange = (newQuality: number) => {
    // Quality slider drag is keystroke-like → debounced.
    setFields({ quality: newQuality })
  }

  const handleDownload = () => {
    if (!compressed?.dataUrl || !file) return
    const ext = file.type === 'image/webp' ? 'webp' : 'jpg'
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const filename = `compressed-${baseName}.${ext}`
    downloadDataUrl(compressed.dataUrl, filename)
    showSuccess(`Downloaded ${filename}`)
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

      {file && (
        <div className={processingWrapperStyles({ disabled: isPending })}>
          <FieldForm
            disabled={isPending}
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

      {compressed && originalInfo && !isPending && (
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

      {compressed && !isPending && (
        <div className="w-full desktop:w-8/10">
          <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
            Download
          </Button>
        </div>
      )}
    </div>
  )
}
