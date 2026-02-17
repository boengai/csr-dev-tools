import { useCallback, useEffect, useRef, useState } from 'react'

import type { ToolComponentProps } from '@/types'

import { Button, Dialog, DownloadIcon, NotoEmoji, RefreshIcon, Tabs, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import { applyBackground, removeBackground } from '@/utils/background-removal'

type BgOption = 'custom' | 'transparent' | 'white'

const TABS_VALUES = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
} as const

const toolEntry = TOOL_REGISTRY_MAP['background-remover']

export const BackgroundRemover = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [tabValue, setTabValue] = useState<string>(TABS_VALUES.IMPORT)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sourcePreview, setSourcePreview] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [displayUrl, setDisplayUrl] = useState('')
  const [bgOption, setBgOption] = useState<BgOption>('transparent')
  const [customColor, setCustomColor] = useState('#ff0000')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(false)
  const { toast } = useToast()
  const resultBlobRef = useRef<Blob | null>(null)
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null)
  // Track whether dialog was closed via Confirm (so onAfterClose doesn't reset)
  const confirmedRef = useRef(false)
  // Track resultUrl in a ref for stable closure in updateDisplay
  const resultUrlRef = useRef(resultUrl)
  resultUrlRef.current = resultUrl

  const updateDisplay = useCallback(
    async (option: BgOption, color: string, blob: Blob | null) => {
      if (!blob) return

      // Revoke previous composited display URL (use ref for stable comparison)
      setDisplayUrl((prev) => {
        if (prev && prev !== resultUrlRef.current) URL.revokeObjectURL(prev)
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
    [toast],
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
        setError(false)
        setDialogOpen(true)
        setTabValue(TABS_VALUES.PROCESSING)
        setProgress(0)

        const url = URL.createObjectURL(file)
        setSourcePreview(url)

        let receivedProgress = false
        const onProgress = (p: number) => {
          if (!receivedProgress) {
            receivedProgress = true
            setDownloading(true)
          }
          setProgress(p)
          if (p >= 100) setDownloading(false)
        }

        setProcessing(true)
        const result = await removeBackground(file, onProgress)
        resultBlobRef.current = result

        const resultObjUrl = URL.createObjectURL(result)
        setResultUrl(resultObjUrl)
        setDisplayUrl(resultObjUrl)
        setBgOption('transparent')
        setProcessing(false)
        setDownloading(false)
        toast({ action: 'add', item: { label: 'Background removed successfully', type: 'success' } })
      } catch {
        setProcessing(false)
        setDownloading(false)
        setError(true)
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

  const handleConfirm = useCallback(() => {
    if (!displayUrl) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return

    anchor.href = displayUrl
    anchor.download = 'background-removed.png'

    confirmedRef.current = true
    setTabValue(TABS_VALUES.DOWNLOAD)
    setDialogOpen(false)
  }, [displayUrl])

  const handleReset = useCallback(() => {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (displayUrl && displayUrl !== resultUrl) URL.revokeObjectURL(displayUrl)
    setSourcePreview('')
    resultBlobRef.current = null
    setResultUrl('')
    setDisplayUrl('')
    setProcessing(false)
    setDownloading(false)
    setError(false)
    setProgress(0)
    setBgOption('transparent')
    setTabValue(TABS_VALUES.IMPORT)
    // Clear download anchor to prevent stale URL access
    const anchor = downloadAnchorRef.current
    if (anchor) {
      anchor.href = ''
      anchor.download = ''
    }
  }, [sourcePreview, resultUrl, displayUrl])

  // Track URLs in refs for unmount-only cleanup
  const sourcePreviewCleanupRef = useRef(sourcePreview)
  sourcePreviewCleanupRef.current = sourcePreview
  const resultUrlCleanupRef = useRef(resultUrl)
  resultUrlCleanupRef.current = resultUrl

  // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount-only cleanup using refs
  useEffect(() => {
    return () => {
      if (sourcePreviewCleanupRef.current) URL.revokeObjectURL(sourcePreviewCleanupRef.current)
      if (resultUrlCleanupRef.current) URL.revokeObjectURL(resultUrlCleanupRef.current)
    }
  }, [])

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-500">{toolEntry.description}</p>}

        <Tabs
          injected={{
            setValue: setTabValue,
            value: tabValue,
          }}
          items={[
            {
              content: (
                <div className="flex w-full grow flex-col items-center justify-center gap-4">
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
                  <div className="flex w-full flex-col gap-4 desktop:w-8/10">
                    <Button
                      block
                      icon={<DownloadIcon />}
                      onClick={() => {
                        const anchor = downloadAnchorRef.current
                        if (!anchor?.href || anchor.href === window.location.href) {
                          toast({
                            action: 'add',
                            item: { label: 'Download not available. Please try again.', type: 'error' },
                          })
                          return
                        }
                        anchor.click()
                        toast({ action: 'add', item: { label: 'Downloaded background-removed.png', type: 'success' } })
                      }}
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

      <Dialog
        injected={{ open: dialogOpen, setOpen: setDialogOpen }}
        onAfterClose={() => {
          // Only reset if user dismissed (not confirmed)
          if (confirmedRef.current) {
            confirmedRef.current = false
          } else {
            handleReset()
          }
          onAfterDialogClose?.()
        }}
        size="screen"
        title="Background Remover"
      >
        <div className="flex grow flex-col gap-4 tablet:min-h-0">
          {/* Loading states */}
          {processing && (
            <div aria-live="polite" className="flex grow flex-col items-center justify-center gap-3">
              <NotoEmoji emoji="robot" size={120} />
              {downloading ? (
                <>
                  <p className="text-body-sm text-gray-300">Downloading AI model...</p>
                  <div className="h-2 w-64 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-body-xs text-gray-500">{Math.round(progress)}%</p>
                </>
              ) : (
                <p className="text-body-sm text-gray-400">Removing background...</p>
              )}
            </div>
          )}

          {/* Error state */}
          {!processing && error && (
            <div aria-live="assertive" className="flex grow flex-col items-center justify-center gap-3">
              <NotoEmoji emoji="bomb" size={120} />
              <p className="text-red-400 text-body-sm">Processing failed. Try a different image.</p>
              <Button icon={<RefreshIcon />} onClick={handleReset} size="small">
                Try Again
              </Button>
            </div>
          )}

          {/* Done state - before/after */}
          {!processing && !error && displayUrl && (
            <>
              <div
                aria-live="polite"
                className="bg-grid-texture flex flex-col items-center justify-center gap-6 bg-black tablet:min-h-0 tablet:grow tablet:flex-row"
              >
                {/* Original */}
                <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
                  <p className="shrink-0 text-body-sm font-medium text-gray-300">Original</p>
                  {sourcePreview && (
                    <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
                      <img
                        alt="original"
                        className="w-full max-w-full tablet:max-h-full tablet:w-auto"
                        src={sourcePreview}
                      />
                    </picture>
                  )}
                </div>

                <div className="tablet:border-t-none h-1 w-full border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-1 tablet:border-l-2" />

                {/* Result */}
                <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
                  <p className="shrink-0 text-body-sm font-medium text-gray-300">Result</p>
                  <picture
                    className="flex size-full grow flex-col items-center justify-center gap-4 rounded tablet:max-h-full tablet:overflow-y-auto"
                    style={
                      bgOption === 'transparent'
                        ? {
                            backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
                            backgroundSize: '16px 16px',
                          }
                        : undefined
                    }
                  >
                    <img alt="result" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={displayUrl} />
                  </picture>
                </div>
              </div>

              {/* Controls at bottom */}
              <div className="flex w-full shrink-0 flex-col items-center gap-4">
                <div className="flex flex-wrap items-center justify-center gap-4">
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
                  <input
                    className="size-8 cursor-pointer rounded border border-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={bgOption !== 'custom'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    type="color"
                    value={customColor}
                  />
                </div>
                <div className="w-full desktop:w-2/5">
                  <Button block onClick={handleConfirm} variant="primary">
                    Confirm
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  )
}
