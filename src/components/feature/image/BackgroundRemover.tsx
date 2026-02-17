import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, CopyButton, Dialog, DownloadIcon, RefreshIcon, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import { applyBackground, removeBackground } from '@/utils/background-removal'

type ProcessingState = 'done' | 'downloading-model' | 'error' | 'idle' | 'processing'
type BgOption = 'custom' | 'transparent' | 'white'

const toolEntry = TOOL_REGISTRY_MAP['background-remover']

export const BackgroundRemover = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)
  const [state, setState] = useState<ProcessingState>('idle')
  const [progress, setProgress] = useState(0)
  const [sourcePreview, setSourcePreview] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [displayUrl, setDisplayUrl] = useState('')
  const [bgOption, setBgOption] = useState<BgOption>('transparent')
  const [customColor, setCustomColor] = useState('#ff0000')
  const { toast } = useToast()
  const resultBlobRef = useRef<Blob | null>(null)

  const updateDisplay = useCallback(
    async (option: BgOption, color: string, blob: Blob | null) => {
      if (!blob) return

      // Revoke previous display URL if it differs from the result URL (composited URLs)
      setDisplayUrl((prev) => {
        if (prev && prev !== resultUrl) URL.revokeObjectURL(prev)
        return prev
      })

      if (option === 'transparent') {
        const url = URL.createObjectURL(blob)
        setDisplayUrl(url)
        return
      }
      try {
        const bgColor = option === 'white' ? '#ffffff' : color
        const composited = await applyBackground(blob, bgColor)
        const url = URL.createObjectURL(composited)
        setDisplayUrl(url)
      } catch {
        toast({ action: 'add', item: { label: 'Failed to apply background color', type: 'error' } })
      }
    },
    [toast, resultUrl],
  )

  const handleUpload = useCallback(
    async (files: Array<File>) => {
      const file = files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast({ action: 'add', item: { label: 'Please select an image file (PNG, JPG, or WEBP)', type: 'error' } })
        return
      }

      try {
        setDialogOpen(true)
        setProgress(0)

        const url = URL.createObjectURL(file)
        setSourcePreview(url)

        let receivedProgress = false
        const onProgress = (p: number) => {
          if (!receivedProgress) {
            receivedProgress = true
            setState('downloading-model')
          }
          setProgress(p)
          if (p >= 100) setState('processing')
        }

        setState('processing')
        const result = await removeBackground(file, onProgress)
        resultBlobRef.current = result
        // blob stored in ref

        const resultObjUrl = URL.createObjectURL(result)
        setResultUrl(resultObjUrl)
        setDisplayUrl(resultObjUrl)
        setBgOption('transparent')
        setState('done')
        toast({ action: 'add', item: { label: 'Background removed successfully', type: 'success' } })
      } catch {
        setState('error')
        toast({ action: 'add', item: { label: 'Failed to remove background. Try a different image.', type: 'error' } })
      }
    },
    [toast],
  )

  const handleBgChange = useCallback(
    (option: BgOption) => {
      setBgOption(option)
      void updateDisplay(option, customColor, resultBlobRef.current)
    },
    [customColor, updateDisplay],
  )

  const handleColorChange = useCallback(
    (color: string) => {
      setCustomColor(color)
      if (bgOption === 'custom') {
        void updateDisplay('custom', color, resultBlobRef.current)
      }
    },
    [bgOption, updateDisplay],
  )

  const handleDownload = useCallback(() => {
    if (!displayUrl) return
    const a = document.createElement('a')
    a.href = displayUrl
    a.download = 'background-removed.png'
    a.click()
  }, [displayUrl])

  const handleReset = useCallback(() => {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (displayUrl && displayUrl !== resultUrl) URL.revokeObjectURL(displayUrl)
    setSourcePreview('')
    // ref cleared in handleReset
    resultBlobRef.current = null
    setResultUrl('')
    setDisplayUrl('')
    setState('idle')
    setProgress(0)
    setBgOption('transparent')
  }, [sourcePreview, resultUrl, displayUrl])

  useEffect(() => {
    return () => {
      if (sourcePreview) URL.revokeObjectURL(sourcePreview)
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [sourcePreview, resultUrl])

  const [dataUrlForCopy, setDataUrlForCopy] = useState('')

  // Convert current display blob to a data URL for the copy button
  useEffect(() => {
    if (!displayUrl) {
      setDataUrlForCopy('')
      return
    }
    // Read the blob from the object URL to produce a real data URL
    const controller = new AbortController()
    void fetch(displayUrl, { signal: controller.signal })
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (!controller.signal.aborted && typeof reader.result === 'string') {
            setDataUrlForCopy(reader.result)
          }
        }
        reader.readAsDataURL(blob)
      })
      .catch(() => {
        /* aborted or failed — ignore */
      })
    return () => controller.abort()
  }, [displayUrl])

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}
        <div className="w-full desktop:w-8/10">
          <UploadInput
            accept="image/png,image/jpeg,image/webp"
            button={{ block: true, children: 'Select image to remove background' }}
            multiple={false}
            name="background-remover-source"
            onChange={handleUpload}
          />
        </div>
      </div>

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          handleReset()
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Background Remover"
      >
        <div className="flex grow flex-col gap-6 overflow-y-auto">
          {/* Downloading model state */}
          {state === 'downloading-model' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-body-sm text-gray-300">Downloading AI model...</p>
              <div className="h-2 w-64 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-body-xs text-gray-500">{Math.round(progress)}%</p>
            </div>
          )}

          {/* Processing state */}
          {state === 'processing' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="size-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
              <p className="text-body-sm text-gray-400">Removing background...</p>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-body-sm text-red-400">Processing failed. Try a different image.</p>
              <Button icon={<RefreshIcon />} onClick={handleReset} size="small">
                Try Again
              </Button>
            </div>
          )}

          {/* Done state - before/after */}
          {state === 'done' && (
            <>
              <div className="flex flex-col gap-6 tablet:flex-row">
                {/* Original */}
                <div className="flex flex-1 flex-col items-center gap-2">
                  <p className="text-body-sm font-medium text-gray-300">Original</p>
                  {sourcePreview && (
                    <img
                      alt="original"
                      className="max-h-64 max-w-full rounded border border-gray-800 object-contain"
                      src={sourcePreview}
                    />
                  )}
                </div>

                {/* Result */}
                <div className="flex flex-1 flex-col items-center gap-2">
                  <p className="text-body-sm font-medium text-gray-300">Result</p>
                  {displayUrl && (
                    <div
                      className="inline-flex rounded border border-gray-800"
                      style={
                        bgOption === 'transparent'
                          ? {
                              backgroundImage:
                                'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
                              backgroundSize: '16px 16px',
                            }
                          : undefined
                      }
                    >
                      <img
                        alt="result"
                        className="max-h-64 max-w-full object-contain"
                        src={displayUrl}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Background selector */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-body-sm text-gray-400">Background:</span>
                <label className="flex cursor-pointer items-center gap-1.5 text-body-sm text-gray-300">
                  <input
                    checked={bgOption === 'transparent'}
                    name="bg-option"
                    onChange={() => handleBgChange('transparent')}
                    type="radio"
                  />
                  Transparent
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-body-sm text-gray-300">
                  <input
                    checked={bgOption === 'white'}
                    name="bg-option"
                    onChange={() => handleBgChange('white')}
                    type="radio"
                  />
                  White
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-body-sm text-gray-300">
                  <input
                    checked={bgOption === 'custom'}
                    name="bg-option"
                    onChange={() => handleBgChange('custom')}
                    type="radio"
                  />
                  Custom
                </label>
                {bgOption === 'custom' && (
                  <input
                    className="size-8 cursor-pointer rounded border border-gray-700"
                    onChange={(e) => handleColorChange(e.target.value)}
                    type="color"
                    value={customColor}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Button icon={<DownloadIcon />} onClick={handleDownload} variant="primary">
                  Download PNG
                </Button>
                {dataUrlForCopy && <CopyButton label="data URL" value={dataUrlForCopy} />}
                <Button icon={<RefreshIcon />} onClick={handleReset} size="small">
                  New Image
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  )
}
