import { type ChangeEvent, useCallback, useRef, useState } from 'react'

import {
  Button,
  CopyButton,
  DownloadIcon,
  RangeInput,
  RefreshIcon,
  Tabs,
} from '@/components/common'
import { UploadDialogFrame } from '@/components/common/dialog/UploadDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { downloadBlob } from '@/utils/download'
import {
  downloadSplashScreenZip,
  generateAllAssets,
  loadImageFromFile,
  type PwaIconResult,
  type SplashScreenGeneratorOutput,
  type SplashScreenResult,
} from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['splash-screen-generator']

export const SplashScreenGenerator = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [results, setResults] = useState<SplashScreenGeneratorOutput | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const sourcePreview = useBlobUrl(sourceFile)
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [dimensionWarning, setDimensionWarning] = useState(false)
  const [imageScale, setImageScale] = useState('50')
  const [activeTab, setActiveTab] = useState('ios-splash')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(
    async (files: Array<File>, openDialog: () => void) => {
      const file = files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast({ action: 'add', item: { label: 'Please select an image file', type: 'error' } })
        return
      }

      setSourceFile(file)
      setResults(null)

      const img = await loadImageFromFile(file)
      setSourceImage(img)
      setDimensionWarning(img.width < 512 || img.height < 512)
      openDialog()
    },
    [toast],
  )

  const handleGenerate = useCallback(async () => {
    if (!sourceImage) return

    try {
      setProcessing(true)
      setProgress({ current: 0, total: 0 })
      const scale = Number(imageScale) / 100
      const output = await generateAllAssets(sourceImage, backgroundColor, scale, (current, total) => {
        setProgress({ current, total })
      })
      setResults(output)
      toast({ action: 'add', item: { label: 'All assets generated successfully', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to generate assets', type: 'error' } })
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }, [sourceImage, backgroundColor, imageScale, toast])

  const handleDownloadAll = useCallback(async () => {
    if (!results) return
    try {
      await downloadSplashScreenZip(results)
      toast({ action: 'add', item: { label: 'Downloaded splash-screen-assets.zip', type: 'success' } })
    } catch {
      toast({ action: 'add', item: { label: 'Failed to download ZIP', type: 'error' } })
    }
  }, [results, toast])

  const handleDownloadSingle = (blob: Blob, fileName: string) => {
    downloadBlob(blob, fileName)
  }

  const resetState = () => {
    setResults(null)
    setSourceFile(null)
    setSourceImage(null)
    setProcessing(false)
    setProgress(null)
    setDimensionWarning(false)
    setImageScale('50')
    setActiveTab('ios-splash')
  }

  const handleNewUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      resetState()
      void handleUpload(Array.from(files), () => undefined)
      e.target.value = ''
    }
  }

  // Compute contrasting border color for safe zone overlay
  const safeZoneBorderColor = (() => {
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
  })()

  const iosSplashContent = results && (
    <div className="flex flex-col gap-4">
      {(['iphone', 'ipad'] as const).map((category) => {
        const devices = results.splashScreens.filter((s) => s.device.category === category)
        if (devices.length === 0) return null
        return (
          <div className="flex flex-col gap-2" key={category}>
            <p className="text-body-sm font-medium text-gray-300 capitalize">{category}s</p>
            <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-6">
              {devices.map((splash) => (
                <SplashPreviewCard
                  key={splash.fileName}
                  onDownload={() => handleDownloadSingle(splash.blob, splash.fileName)}
                  splash={splash}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  const androidIconsContent = results && (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4 tablet:grid-cols-5 desktop:grid-cols-8">
        {results.icons.map((icon) => (
          <IconPreviewCard
            icon={icon}
            key={icon.fileName}
            onDownload={() => handleDownloadSingle(icon.blob, icon.fileName)}
          />
        ))}
      </div>
    </div>
  )

  const pwaConfigContent = results && (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-body-sm font-medium text-gray-300">iOS Meta Tags</p>
          <CopyButton label="meta tags" value={results.metaTags} />
        </div>
        <pre className="max-h-64 overflow-auto rounded border border-gray-800 bg-black p-3 text-body-xs text-gray-300">
          <code>{results.metaTags}</code>
        </pre>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-body-sm font-medium text-gray-300">Manifest Icons JSON</p>
          <CopyButton label="manifest JSON" value={results.manifestJson} />
        </div>
        <pre className="max-h-64 overflow-auto rounded border border-gray-800 bg-black p-3 text-body-xs text-gray-300">
          <code>{results.manifestJson}</code>
        </pre>
      </div>
    </div>
  )

  return (
    <>
      <UploadDialogFrame
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        buttonLabel="Select image to generate splash screens"
        description={toolEntry?.description}
        onAfterClose={onAfterDialogClose}
        onReset={resetState}
        onUpload={handleUpload}
        title="Splash Screen Generator"
        uploadInputName="splash-source"
      >
        <div className="flex grow flex-col gap-6 overflow-y-auto">
          {/* Source preview + controls */}
          <div className="flex flex-col gap-4 tablet:flex-row tablet:items-start">
            {sourcePreview && (
              <div className="flex shrink-0 flex-col gap-3">
                <p className="text-body-sm font-medium text-gray-300">Preview</p>
                <div className="flex flex-row items-end gap-3">
                  {/* Maskable icon preview */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="relative flex size-24 items-center justify-center overflow-hidden rounded border border-gray-800"
                      style={{ backgroundColor }}
                    >
                      <img
                        alt="maskable icon"
                        className="object-contain"
                        src={sourcePreview}
                        style={{ height: `${imageScale}%`, width: `${imageScale}%` }}
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                          className="rounded-full border-2 border-dashed"
                          style={{ borderColor: safeZoneBorderColor, height: '80%', width: '80%' }}
                        />
                      </div>
                    </div>
                    <span className="text-body-xs text-gray-500">Icon</span>
                  </div>
                  {/* Portrait splash preview */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="relative flex items-center justify-center overflow-hidden rounded border border-gray-800"
                      style={{ backgroundColor, height: 128, width: 59 }}
                    >
                      <img
                        alt="portrait splash"
                        className="object-contain"
                        src={sourcePreview}
                        style={{ height: `${imageScale}%`, width: `${imageScale}%` }}
                      />
                    </div>
                    <span className="text-body-xs text-gray-500">Portrait</span>
                  </div>
                  {/* Landscape splash preview */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="relative flex items-center justify-center overflow-hidden rounded border border-gray-800"
                      style={{ backgroundColor, height: 59, width: 128 }}
                    >
                      <img
                        alt="landscape splash"
                        className="object-contain"
                        src={sourcePreview}
                        style={{ height: `${imageScale}%`, width: `${imageScale}%` }}
                      />
                    </div>
                    <span className="text-body-xs text-gray-500">Landscape</span>
                  </div>
                </div>
                <span className="text-body-xs text-gray-500">Dashed circle = maskable safe zone (80%)</span>
                {dimensionWarning && (
                  <span className="text-yellow-400 text-body-xs">
                    Source is smaller than 512x512 — quality may suffer
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="text-body-sm text-gray-300" htmlFor="bg-color">
                  Background Color
                </label>
                <input
                  className="h-8 w-12 cursor-pointer rounded border border-gray-700 bg-transparent"
                  id="bg-color"
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  type="color"
                  value={backgroundColor}
                />
                <span className="text-body-xs text-gray-500">{backgroundColor}</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-body-sm text-gray-300" htmlFor="image-scale">
                  Image Scale ({imageScale}%)
                </label>
                <RangeInput
                  id="image-scale"
                  max={100}
                  min={10}
                  name="image-scale"
                  onChange={setImageScale}
                  step={5}
                  value={imageScale}
                />
                <span className="text-body-xs text-gray-500">80% aligns with maskable safe zone</span>
              </div>

              <div className="flex gap-2">
                <Button disabled={processing || !sourceImage} onClick={handleGenerate} variant="primary">
                  {processing
                    ? `Generating ${progress?.current ?? 0}/${progress?.total ?? '...'}`
                    : 'Generate All Assets'}
                </Button>
                <Button icon={<RefreshIcon />} onClick={handleNewUpload} size="small">
                  Upload New
                </Button>
              </div>
            </div>
          </div>

          {/* Results tabs */}
          {results && (
            <>
              <Tabs
                injected={{ setValue: setActiveTab, value: activeTab }}
                items={[
                  {
                    content: iosSplashContent,
                    trigger: <button type="button">iOS Splash</button>,
                    value: 'ios-splash',
                  },
                  {
                    content: androidIconsContent,
                    trigger: <button type="button">Android Icons</button>,
                    value: 'android-icons',
                  },
                  {
                    content: pwaConfigContent,
                    trigger: <button type="button">PWA Config</button>,
                    value: 'pwa-config',
                  },
                ]}
              />
              <Button block icon={<DownloadIcon />} onClick={handleDownloadAll} variant="primary">
                Download All (ZIP)
              </Button>
            </>
          )}
        </div>
      </UploadDialogFrame>

      <input
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </>
  )
}

const SplashPreviewCard = ({ onDownload, splash }: { onDownload: () => void; splash: SplashScreenResult }) => (
  <button
    className="flex cursor-pointer flex-col items-center gap-1 rounded border border-gray-800 p-2 transition-colors hover:border-gray-600"
    onClick={onDownload}
    title={`Download ${splash.fileName}`}
    type="button"
  >
    <div className="bg-grid-texture flex items-center justify-center rounded p-1">
      <img alt={`${splash.device.name} ${splash.orientation}`} className="max-h-16 max-w-12" src={splash.dataUrl} />
    </div>
    <span className="text-body-xs text-gray-400">{splash.device.name}</span>
    <span className="text-body-xs text-gray-500">
      {splash.orientation === 'portrait' ? splash.device.width : splash.device.height}x
      {splash.orientation === 'portrait' ? splash.device.height : splash.device.width}
    </span>
    <span className="text-body-xs text-gray-600 capitalize">{splash.orientation}</span>
  </button>
)

const IconPreviewCard = ({ icon, onDownload }: { icon: PwaIconResult; onDownload: () => void }) => (
  <button
    className="flex cursor-pointer flex-col items-center gap-1 rounded border border-gray-800 p-2 transition-colors hover:border-gray-600"
    onClick={onDownload}
    title={`Download ${icon.fileName}`}
    type="button"
  >
    <div className="bg-grid-texture flex items-center justify-center rounded p-2">
      <img
        alt={`${icon.size}x${icon.size}`}
        height={Math.min(icon.size, 64)}
        src={icon.dataUrl}
        width={Math.min(icon.size, 64)}
      />
    </div>
    <span className="text-body-xs text-gray-400">
      {icon.size}x{icon.size}
    </span>
    {icon.maskable && <span className="text-yellow-400 text-body-xs">maskable</span>}
  </button>
)
