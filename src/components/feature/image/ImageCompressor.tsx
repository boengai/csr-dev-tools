import { useCallback, useEffect, useRef, useState } from 'react'

import type { ImageProcessingResult } from '@/types'

import { Button, DownloadIcon, UploadInput } from '@/components/common'
import { ProgressBar } from '@/components/common/progress-bar/ProgressBar'
import { COMPRESSIBLE_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToolError, useToast } from '@/hooks'
import { formatFileSize, processImage } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-compressor']

type OriginalInfo = {
  height: number
  name: string
  size: number
  width: number
}

export const ImageCompressor = () => {
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [source, setSource] = useState<File | null>(null)
  const [originalInfo, setOriginalInfo] = useState<OriginalInfo | null>(null)
  const [quality, setQuality] = useState(80)
  const [compressed, setCompressed] = useState<ImageProcessingResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  const { toast } = useToast()
  const { clearError, error, setError } = useToolError()

  // M3 fix: cleanup progress timer on unmount
  useEffect(() => {
    return () => {
      clearTimeout(progressTimerRef.current)
    }
  }, [])

  const compress = useCallback(
    async (file: File, q: number) => {
      setProcessing(true)
      progressTimerRef.current = setTimeout(() => setShowProgress(true), 300)

      try {
        const result = await processImage(file, { quality: q / 100, strategy: 'stretch' })
        clearError()
        setCompressed(result)
        return result
      } catch {
        setError('Compression failed — try a different image')
        return null
      } finally {
        clearTimeout(progressTimerRef.current)
        setShowProgress(false)
        setProcessing(false)
      }
    },
    [clearError, setError],
  )

  const debouncedCompress = useDebounceCallback(compress, 300)

  const handleInputChange = async (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    // H1 fix: clear stale state on format rejection
    if (!COMPRESSIBLE_FORMATS.has(file.type)) {
      setError('Image compression supports JPEG and WebP formats')
      setSource(null)
      setCompressed(null)
      setOriginalInfo(null)
      return
    }

    clearError()
    setSource(file)
    setCompressed(null)
    setOriginalInfo({ height: 0, name: file.name, size: file.size, width: 0 })

    // M1 fix: single processImage call — get dimensions AND compressed result
    const result = await compress(file, quality)
    if (result) {
      setOriginalInfo({ height: result.height, name: file.name, size: file.size, width: result.width })
    }
  }

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality)
    if (source) {
      debouncedCompress(source, newQuality)
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
    toast({ action: 'add', item: { label: `Downloaded compressed-${baseName}.${ext}`, type: 'success' } })
  }

  const compressionRatio =
    originalInfo && compressed ? Math.round((1 - compressed.size / originalInfo.size) * 100) : null

  return (
    <div className="flex w-full grow flex-col gap-4">
      {toolEntry?.description && <p className="text-body-xs shrink-0 text-gray-500">{toolEntry.description}</p>}

      <div className="desktop:w-8/10 w-full">
        <UploadInput
          accept="image/jpeg,image/webp"
          button={{ block: true, children: 'Select JPEG or WebP image' }}
          multiple={false}
          name="image-compressor"
          onChange={handleInputChange}
        />
      </div>

      {error != null && (
        <p className="text-error text-body-sm shrink-0" role="alert">
          {error}
        </p>
      )}

      {originalInfo && originalInfo.width > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-body-sm text-gray-300">
            {originalInfo.name} — {originalInfo.width}x{originalInfo.height} — {formatFileSize(originalInfo.size)}
          </p>
        </div>
      )}

      {/* M2 fix: dim slider during processing */}
      {source && (
        <div className={`flex flex-col gap-2 ${processing ? 'pointer-events-none opacity-70' : ''}`}>
          <label className="text-body-sm text-gray-300" htmlFor="quality-slider">
            Quality: {quality}%
          </label>
          <input
            className="accent-primary w-full"
            disabled={processing}
            id="quality-slider"
            max={100}
            min={1}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            type="range"
            value={quality}
          />
        </div>
      )}

      {showProgress && <ProgressBar value={50} />}

      {compressed && originalInfo && !processing && (
        <div className="flex flex-col gap-2">
          <p className="text-body-sm text-gray-300">
            {formatFileSize(originalInfo.size)} → {formatFileSize(compressed.size)}
            {compressionRatio != null && compressionRatio > 0 ? (
              <span className="text-success ml-2">{compressionRatio}% smaller</span>
            ) : (
              <span className="text-warning ml-2">No reduction</span>
            )}
          </p>
        </div>
      )}

      {compressed && !processing && (
        <div className="desktop:w-8/10 w-full">
          <Button block icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
            Download
          </Button>
        </div>
      )}

      <a className="hidden" download="" href="" ref={downloadAnchorRef} />
    </div>
  )
}
