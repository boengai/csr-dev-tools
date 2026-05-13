import { useCallback, useMemo, useReducer, useRef } from 'react'

import { Button, DownloadIcon, NotoEmoji, RefreshIcon, Tabs, ToolDialogShell, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks/useBlobUrl'
import { useToast } from '@/hooks'
import type { BackgroundRemoverAction, BackgroundRemoverState, BgOption, ToolComponentProps } from '@/types'
import { applyBackground, removeBackground } from '@/utils'
import { downloadBlob } from '@/utils/download'

import { BackgroundRemoverError } from './Error'
import { BackgroundRemoverProcessing } from './Processing'
import { BackgroundRemoverResult } from './Result'

const TABS_VALUES = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
} as const

const toolEntry = TOOL_REGISTRY_MAP['background-remover']
const initialState: BackgroundRemoverState = {
  bgOption: 'transparent',
  customColor: '#ff0000',
  dialogOpen: false,
  displayBlob: null,
  downloading: false,
  error: false,
  processing: false,
  progress: 0,
  resultBlob: null,
  sourceBlob: null,
  tabValue: TABS_VALUES.IMPORT,
}

const reducer = (state: BackgroundRemoverState, action: BackgroundRemoverAction): BackgroundRemoverState => {
  switch (action.type) {
    case 'SET_BG_OPTION':
      return { ...state, bgOption: action.payload }
    case 'SET_CUSTOM_COLOR':
      return { ...state, customColor: action.payload }
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_DISPLAY_BLOB':
      return { ...state, displayBlob: action.payload }
    case 'SET_DOWNLOADING':
      return { ...state, downloading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload }
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }
    case 'SET_RESULT_BLOB':
      return { ...state, resultBlob: action.payload }
    case 'SET_SOURCE_BLOB':
      return { ...state, sourceBlob: action.payload }
    case 'SET_TAB_VALUE':
      return { ...state, tabValue: action.payload }
    case 'START_UPLOAD':
      return {
        ...state,
        error: false,
        dialogOpen: true,
        tabValue: TABS_VALUES.PROCESSING,
        progress: 0,
        sourceBlob: action.payload.sourceBlob,
      }
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        resultBlob: action.payload.resultBlob,
        displayBlob: action.payload.displayBlob,
        bgOption: 'transparent',
        processing: false,
        downloading: false,
      }
    case 'UPLOAD_FAILURE':
      return { ...state, processing: false, downloading: false, error: true }
    case 'CONFIRM':
      return { ...state, tabValue: action.payload.tabValue, dialogOpen: false }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

export const BackgroundRemover = ({ onAfterDialogClose }: ToolComponentProps) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {
    bgOption,
    customColor,
    dialogOpen,
    displayBlob,
    downloading,
    error,
    processing,
    progress,
    resultBlob,
    sourceBlob,
    tabValue,
  } = state
  const { toast } = useToast()
  // Track whether dialog was closed via Confirm (so onAfterClose doesn't reset)
  const confirmedRef = useRef(false)

  // Derive render-bound URLs — useBlobUrl owns lifecycle (auto-revoke)
  const sourcePreviewUrl = useBlobUrl(sourceBlob)
  const displayUrl = useBlobUrl(displayBlob)

  // resultBlob ref for stable closure in updateDisplay
  const resultBlobRef = useRef<Blob | null>(null)
  resultBlobRef.current = resultBlob

  const updateDisplay = useCallback(
    async (option: BgOption, color: string, blob: Blob | null) => {
      if (!blob) return

      dispatch({ type: 'SET_DISPLAY_BLOB', payload: null })

      if (option === 'transparent') {
        dispatch({ type: 'SET_DISPLAY_BLOB', payload: blob })
        return
      }
      try {
        const bgColor = option === 'white' ? '#ffffff' : color
        const composited = await applyBackground(blob, bgColor)
        dispatch({ type: 'SET_DISPLAY_BLOB', payload: composited })
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
        dispatch({ type: 'START_UPLOAD', payload: { sourceBlob: file } })

        let receivedProgress = false
        const onProgress = (p: number) => {
          if (!receivedProgress) {
            receivedProgress = true
            dispatch({ type: 'SET_DOWNLOADING', payload: true })
          }
          dispatch({ type: 'SET_PROGRESS', payload: p })
          if (p >= 100) dispatch({ type: 'SET_DOWNLOADING', payload: false })
        }

        dispatch({ type: 'SET_PROCESSING', payload: true })
        const result = await removeBackground(file, onProgress)

        dispatch({ type: 'UPLOAD_SUCCESS', payload: { resultBlob: result, displayBlob: result } })
        toast({ action: 'add', item: { label: 'Background removed successfully', type: 'success' } })
      } catch {
        dispatch({ type: 'UPLOAD_FAILURE' })
        toast({ action: 'add', item: { label: 'Failed to remove background. Try a different image.', type: 'error' } })
      }
    },
    [toast],
  )

  const handleBgChange = useCallback(
    (option: BgOption) => {
      dispatch({ type: 'SET_BG_OPTION', payload: option })
      void updateDisplay(option, customColor, resultBlobRef.current)
    },
    [customColor, updateDisplay],
  )

  const handleColorChange = useCallback(
    (color: string) => {
      dispatch({ type: 'SET_CUSTOM_COLOR', payload: color })
      if (bgOption === 'custom') {
        void updateDisplay('custom', color, resultBlobRef.current)
      }
    },
    [bgOption, updateDisplay],
  )

  const handleConfirm = useCallback(() => {
    if (!displayBlob) return
    confirmedRef.current = true
    dispatch({ type: 'CONFIRM', payload: { tabValue: TABS_VALUES.DOWNLOAD } })
  }, [displayBlob])

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // Called by ToolDialogShell's onReset unconditionally; we short-circuit when
  // the user already confirmed (so their downloaded result isn't destroyed).
  const handleReset = useCallback(() => {
    if (confirmedRef.current) {
      confirmedRef.current = false
      return
    }
    resetState()
  }, [resetState])

  // displayUrl is null until useBlobUrl resolves — treat falsy as "not ready"
  const displayReady = useMemo(() => Boolean(displayUrl), [displayUrl])

  return (
    <>
      <div className="flex w-full grow flex-col gap-4">
        {toolEntry?.description && <p className="shrink-0 text-body-xs text-gray-400">{toolEntry.description}</p>}

        <Tabs
          injected={{
            setValue: (val: string) => dispatch({ type: 'SET_TAB_VALUE', payload: val }),
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
                        if (!displayBlob) {
                          toast({
                            action: 'add',
                            item: { label: 'Download not available. Please try again.', type: 'error' },
                          })
                          return
                        }
                        downloadBlob(displayBlob, 'background-removed.png')
                        toast({ action: 'add', item: { label: 'Downloaded background-removed.png', type: 'success' } })
                      }}
                      variant="primary"
                    >
                      Download
                    </Button>
                    <Button block icon={<RefreshIcon />} onClick={resetState}>
                      Start Over
                    </Button>
                  </div>
                </div>
              ),
              value: TABS_VALUES.DOWNLOAD,
            },
          ]}
        />
      </div>

      <ToolDialogShell
        open={dialogOpen}
        onOpenChange={(open) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open })}
        onAfterDialogClose={onAfterDialogClose}
        onReset={handleReset}
        title="Background Remover"
        size="screen"
      >
        <div className="flex grow flex-col gap-4 tablet:min-h-0">
          {/* Loading states */}
          {processing && <BackgroundRemoverProcessing downloading={downloading} progress={progress} />}

          {/* Error state */}
          {!processing && error && <BackgroundRemoverError onReset={resetState} />}

          {/* Done state - before/after */}
          {!processing && !error && displayReady && (
            <BackgroundRemoverResult
              bgOption={bgOption}
              customColor={customColor}
              displayUrl={displayUrl ?? ''}
              onBgChange={handleBgChange}
              onColorChange={handleColorChange}
              onConfirm={handleConfirm}
              sourcePreview={sourcePreviewUrl ?? ''}
            />
          )}
        </div>
      </ToolDialogShell>
    </>
  )
}
