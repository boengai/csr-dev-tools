import { useCallback, useEffect, useRef, useState } from 'react'

import type { ImageProcessingResult } from '@/types'

import { Button, DownloadIcon, FieldForm, ProgressBar, UploadInput } from '@/components/common'
import { COMPRESSIBLE_FORMATS, TOOL_REGISTRY_MAP } from '@/constants'
import { useDebounceCallback, useToast } from '@/hooks'
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

type OriginalInfo = {
  height: number
  name: string
  size: number
  width: number
}

export const ImageCompressor = () => {
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sessionRef = useRef(0)

  const [source, setSource] = useState<File | null>(null)
  const [originalInfo, setOriginalInfo] = useState<OriginalInfo | null>(null)
  const [quality, setQuality] = useState(80)
  const [compressed, setCompressed] = useState<ImageProcessingResult | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  const { toast } = useToast()

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

      const currentSession = ++sessionRef.current

      try {
        const result = await processImage(file, { quality: q / 100, strategy: 'stretch' })
        if (currentSession !== sessionRef.current) return null
        setCompressed(result)
        return result
      } catch {
        if (currentSession !== sessionRef.current) return null
        toast({ action: 'add', item: { label: 'Compression failed — try a different image', type: 'error' } })
        return null
      } finally {
        if (currentSession === sessionRef.current) {
          clearTimeout(progressTimerRef.current)
          setShowProgress(false)
          setProcessing(false)
        }
      }
    },
    [toast],
  )

  const debouncedCompress = useDebounceCallback(compress, 300)

  const handleInputChange = async (values: Array<File>) => {
    const file = values[0]
    if (!file) return

    // H1 fix: clear stale state on format rejection
    if (!COMPRESSIBLE_FORMATS.has(file.type)) {
      toast({ action: 'add', item: { label: 'Image compression supports JPEG and WebP formats', type: 'error' } })
      setSource(null)
      setCompressed(null)
      setOriginalInfo(null)
      return
    }

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
      {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

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

      <a className="hidden" download="" href="" ref={downloadAnchorRef} />
    </div>
  )
}
