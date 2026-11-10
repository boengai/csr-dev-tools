import { RangeInput } from '@/components/common'
import { FileProcessorShell } from '@/components/common/file-processor'
import { IMAGE_FILE_NOUN, TOOL_REGISTRY_MAP } from '@/constants'
import type {
  FileProcessorAsset,
  FileProcessorAssetsResult,
  FileProcessorDerivedInput,
  SplashControls,
  SplashScreenResult,
  SplashSourcePreviewProps,
  ToolComponentProps,
} from '@/types'
import { generateAllAssets } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['splash-screen-generator']
const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'

const INITIAL_CONTROLS: SplashControls = { backgroundColor: '#ffffff', imageScale: '50' }

const splashAsset = (splash: SplashScreenResult): FileProcessorAsset => {
  const { device, orientation } = splash
  const [width, height] = orientation === 'portrait' ? [device.width, device.height] : [device.height, device.width]
  return {
    blob: splash.blob,
    caption: device.name,
    details: [`${width}x${height}`, orientation],
    name: splash.fileName,
    zipPath: `ios-splash/${splash.fileName}`,
  }
}

const process = async ({
  controls,
  image,
  report,
}: FileProcessorDerivedInput<SplashControls>): Promise<FileProcessorAssetsResult> => {
  const output = await generateAllAssets(image, controls.backgroundColor, Number(controls.imageScale) / 100, report)
  const splashFor = (category: 'ipad' | 'iphone') =>
    output.splashScreens.filter((s) => s.device.category === category).map(splashAsset)
  return {
    assetGroups: [
      { assets: splashFor('iphone'), label: 'iPhone splash' },
      { assets: splashFor('ipad'), label: 'iPad splash' },
      {
        assets: output.icons.map((icon) => ({
          blob: icon.blob,
          caption: `${icon.size}x${icon.size}`,
          details: icon.maskable ? ['maskable'] : undefined,
          name: icon.fileName,
          zipPath: `${icon.maskable ? 'icons/maskable' : 'icons'}/${icon.fileName}`,
        })),
        label: 'Android icons',
      },
    ],
    textOutputs: [
      { label: 'iOS meta tags', value: output.metaTags, zipPath: 'apple-splash-meta.html' },
      { label: 'Manifest icons JSON', value: output.manifestJson, zipPath: 'manifest-icons.json' },
    ],
  }
}

const computeSafeZoneBorder = (backgroundColor: string): string => {
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'
}

export const SplashScreenGenerator = ({ autoOpen, onAfterClose }: ToolComponentProps) => (
  <FileProcessorShell<SplashControls>
    accept={ACCEPT}
    actionLabel="Generate All Assets"
    autoOpen={autoOpen}
    description={toolEntry?.description}
    errorLabel="Could not generate assets from this image"
    initialControls={INITIAL_CONTROLS}
    noun={IMAGE_FILE_NOUN}
    onAfterClose={onAfterClose}
    output="assets"
    pendingLabel="Generating"
    placeholder="Set the background and scale, then press Generate All Assets"
    process={process}
    rejectToastLabel="Please select an image file"
    renderControls={({ controls, setControls }) => (
      <div className="flex shrink-0 flex-wrap items-end gap-6">
        <div className="flex items-center gap-2">
          <label className="text-body-sm text-gray-300" htmlFor="bg-color">
            Background Color
          </label>
          <input
            className="h-8 w-12 cursor-pointer rounded border border-gray-700 bg-transparent"
            id="bg-color"
            onChange={(e) => setControls({ backgroundColor: e.target.value })}
            type="color"
            value={controls.backgroundColor}
          />
          <span className="text-body-xs text-gray-500">{controls.backgroundColor}</span>
        </div>
        <div className="flex min-w-60 flex-col gap-1">
          <label className="text-body-sm text-gray-300" htmlFor="image-scale">
            Image Scale ({controls.imageScale}%)
          </label>
          <RangeInput
            aria-label="Image scale"
            id="image-scale"
            max={100}
            min={10}
            name="image-scale"
            onChange={(imageScale) => setControls({ imageScale })}
            step={5}
            value={controls.imageScale}
          />
          <span className="text-body-xs text-gray-500">80% aligns with maskable safe zone</span>
        </div>
      </div>
    )}
    renderSource={({ controls, image, sourceUrl }) => (
      <SplashSourcePreview
        backgroundColor={controls.backgroundColor}
        image={image}
        imageScale={controls.imageScale}
        sourceUrl={sourceUrl}
      />
    )}
    title="Splash Screen Generator"
    triggerLabel="Generate Splash Screens"
    uploadLabel="Select image to generate splash screens"
    // The picker offers ACCEPT; a drop of any other image type is still read (ADR-0016).
    validate={(file) => file.type.startsWith('image/')}
    zipPrefix="splash-screen-assets"
  />
)

/** Live preview of the controls on the source: maskable icon, portrait and landscape splash. */
const SplashSourcePreview = ({ backgroundColor, image, imageScale, sourceUrl }: SplashSourcePreviewProps) => {
  const scaled = { height: `${imageScale}%`, width: `${imageScale}%` }
  const tooSmall = image.naturalWidth < 512 || image.naturalHeight < 512
  return (
    <div className="flex grow flex-col items-center justify-center gap-3 p-4">
      <div className="flex flex-row items-end gap-3">
        <div className="flex flex-col items-center gap-1">
          <div
            className="relative flex size-24 items-center justify-center overflow-hidden rounded border border-gray-800"
            style={{ backgroundColor }}
          >
            <img alt="maskable icon" className="object-contain" src={sourceUrl} style={scaled} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="rounded-full border-2 border-dashed"
                style={{ borderColor: computeSafeZoneBorder(backgroundColor), height: '80%', width: '80%' }}
              />
            </div>
          </div>
          <span className="text-body-xs text-gray-500">Icon</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div
            className="relative flex items-center justify-center overflow-hidden rounded border border-gray-800"
            style={{ backgroundColor, height: 128, width: 59 }}
          >
            <img alt="portrait splash" className="object-contain" src={sourceUrl} style={scaled} />
          </div>
          <span className="text-body-xs text-gray-500">Portrait</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div
            className="relative flex items-center justify-center overflow-hidden rounded border border-gray-800"
            style={{ backgroundColor, height: 59, width: 128 }}
          >
            <img alt="landscape splash" className="object-contain" src={sourceUrl} style={scaled} />
          </div>
          <span className="text-body-xs text-gray-500">Landscape</span>
        </div>
      </div>
      <span className="text-body-xs text-gray-500">Dashed circle = maskable safe zone (80%)</span>
      {tooSmall && (
        <span className="text-body-xs text-warning">Source is smaller than 512x512 — quality may suffer</span>
      )}
    </div>
  )
}
