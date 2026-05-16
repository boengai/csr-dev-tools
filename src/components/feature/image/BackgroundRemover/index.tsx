import { useCallback, useRef, useState } from 'react'

import { ImageToolShell } from '@/components/common/image-tool'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { BgOption, ToolComponentProps } from '@/types'
import { applyBackground, removeBackground } from '@/utils'

import { BackgroundRemoverError } from './Error'
import { BackgroundRemoverProcessing } from './Processing'
import { BackgroundRemoverResult } from './Result'

const toolEntry = TOOL_REGISTRY_MAP['background-remover']

type BgControls = {
  bgOption: BgOption
  customColor: string
}

export const BackgroundRemover = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [bgOption, setBgOption] = useState<BgOption>('transparent')
  const [customColor, setCustomColor] = useState('#ff0000')
  const strippedCacheRef = useRef<{ file: File; stripped: Blob } | null>(null)
  const { toast } = useToast()

  const process = useCallback(async (file: File, { bgOption: bg, customColor: c }: BgControls) => {
    let stripped = strippedCacheRef.current?.file === file ? strippedCacheRef.current.stripped : null
    if (!stripped) {
      stripped = await removeBackground(file)
      strippedCacheRef.current = { file, stripped }
    }
    if (bg === 'transparent') return stripped
    const bgColor = bg === 'white' ? '#ffffff' : c
    return applyBackground(stripped, bgColor)
  }, [])

  return (
    <ImageToolShell<BgControls>
      accept="image/png,image/jpeg,image/webp"
      controls={{ bgOption, customColor }}
      description={toolEntry?.description}
      getDownloadFilename={() => 'background-removed.png'}
      onAfterDialogClose={onAfterDialogClose}
      onRejectInvalidFile={() =>
        toast({
          action: 'add',
          item: { label: 'Please select an image file (PNG, JPG, or WEBP)', type: 'error' },
        })
      }
      process={process}
      renderControls={({ recompute }) => (
        <BackgroundRemoverResult
          bgOption={bgOption}
          customColor={customColor}
          onBgChange={(v) => {
            setBgOption(v)
            recompute()
          }}
          onColorChange={(v) => {
            setCustomColor(v)
            if (bgOption === 'custom') recompute()
          }}
        />
      )}
      renderPreview={({ error, pending, resultUrl, sourceUrl }) => {
        if (pending) return <BackgroundRemoverProcessing downloading={false} progress={0} />
        if (error) return <BackgroundRemoverError onReset={() => (strippedCacheRef.current = null)} />
        if (!resultUrl) return null
        return (
          <div
            aria-live="polite"
            className="bg-grid-texture flex flex-col items-center justify-center gap-6 bg-black tablet:min-h-0 tablet:grow tablet:flex-row"
          >
            <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
              <p className="shrink-0 text-body-sm font-medium text-gray-300">Original</p>
              <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
                <img alt="original" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={sourceUrl} />
              </picture>
            </div>
            <div className="tablet:border-t-none h-1 w-full border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-1 tablet:border-l-2" />
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
                <img alt="result" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={resultUrl} />
              </picture>
            </div>
          </div>
        )
      }}
      title="Background Remover"
      uploadLabel="Select image to remove background"
    />
  )
}
