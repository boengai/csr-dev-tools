import { type CSSProperties, useCallback, useRef } from 'react'

import { FileProcessorShell } from '@/components/common/file-processor'
import { IMAGE_FILE_NOUN, TOOL_REGISTRY_MAP } from '@/constants'
import type { BackgroundRemoverPaneProps, BgControls, ToolComponentProps, ToolComputeContext } from '@/types'
import { applyBackground, removeBackground } from '@/utils'

import { BackgroundRemoverProcessing } from './Processing'
import { BackgroundRemoverResult } from './Result'

const toolEntry = TOOL_REGISTRY_MAP['background-remover']

const INITIAL_CONTROLS: BgControls = { bgOption: 'transparent', customColor: '#ff0000' }

const TRANSPARENT_CHECKERBOARD: CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
  backgroundSize: '16px 16px',
}

export const BackgroundRemover = ({ autoOpen, onAfterClose }: ToolComponentProps) => {
  const strippedCacheRef = useRef<{ file: File; stripped: Blob } | null>(null)

  const process = useCallback(
    async (file: File, { bgOption: bg, customColor: c }: BgControls, { signal }: ToolComputeContext) => {
      let stripped = strippedCacheRef.current?.file === file ? strippedCacheRef.current.stripped : null
      if (!stripped) {
        // Not cancelled mid-inference: the model run is the expensive part and
        // its output is cached for the next run on the same file.
        stripped = await removeBackground(file)
        strippedCacheRef.current = { file, stripped }
      }
      if (bg === 'transparent') return stripped
      signal.throwIfAborted()
      const bgColor = bg === 'white' ? '#ffffff' : c
      return applyBackground(stripped, bgColor, signal)
    },
    [],
  )

  return (
    <FileProcessorShell<BgControls>
      accept="image/png,image/jpeg,image/webp"
      autoOpen={autoOpen}
      description={toolEntry?.description}
      errorLabel="Background removal failed. Try a different image."
      getDownloadFilename={() => 'background-removed.png'}
      initialControls={INITIAL_CONTROLS}
      noun={IMAGE_FILE_NOUN}
      onAfterClose={() => {
        // The shell is back on the upload area; drop the cut-out of the old file with it.
        strippedCacheRef.current = null
        onAfterClose?.()
      }}
      process={process}
      rejectToastLabel="Please select an image file (PNG, JPG, or WEBP)"
      renderControls={({ controls, setControls }) => (
        <BackgroundRemoverResult
          bgOption={controls.bgOption}
          customColor={controls.customColor}
          onBgChange={(v) => setControls({ bgOption: v })}
          onColorChange={(v) => setControls({ customColor: v })}
        />
      )}
      renderResult={({ controls, pending, resultUrl }) => {
        if (pending) return <BackgroundRemoverProcessing downloading={false} progress={0} />
        if (!resultUrl) return null
        return (
          <BackgroundRemoverPane caption="Result">
            <picture
              className="flex size-full grow flex-col items-center justify-center gap-4 rounded tablet:max-h-full tablet:overflow-y-auto"
              style={controls.bgOption === 'transparent' ? TRANSPARENT_CHECKERBOARD : undefined}
            >
              <img alt="result" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={resultUrl} />
            </picture>
          </BackgroundRemoverPane>
        )
      }}
      renderSource={({ sourceUrl }) => (
        <BackgroundRemoverPane caption="Original">
          <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
            <img alt="original" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={sourceUrl} />
          </picture>
        </BackgroundRemoverPane>
      )}
      title="Background Remover"
      triggerLabel="Remove Background"
      uploadLabel="Select image to remove background"
    />
  )
}

const BackgroundRemoverPane = ({ caption, children }: BackgroundRemoverPaneProps) => (
  <div
    aria-live="polite"
    className="bg-grid-texture flex grow flex-col items-center justify-center gap-4 bg-black p-4 tablet:min-h-0"
  >
    <p className="shrink-0 text-body-sm font-medium text-gray-300">{caption}</p>
    {children}
  </div>
)
