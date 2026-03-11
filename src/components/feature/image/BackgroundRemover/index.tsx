import { useCallback, useEffect, useReducer, useRef } from 'react'

import { Button, Dialog, DownloadIcon, NotoEmoji, RefreshIcon, Tabs, UploadInput } from '@/components/common'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useToast } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import { applyBackground, removeBackground } from '@/utils/background-removal'

import { BackgroundRemoverError } from './Error'
import { BackgroundRemoverProcessing } from './Processing'
import { BackgroundRemoverResult } from './Result'

type BgOption = 'custom' | 'transparent' | 'white'

const TABS_VALUES = {
  DOWNLOAD: 'download',
  IMPORT: 'import',
  PROCESSING: 'processing',
} as const

const toolEntry = TOOL_REGISTRY_MAP['background-remover']

type State = {
  bgOption: BgOption
  customColor: string
  dialogOpen: boolean
  displayUrl: string
  downloading: boolean
  error: boolean
  processing: boolean
  progress: number
  resultUrl: string
  sourcePreview: string
  tabValue: string
}

type Action =
  | { type: 'SET_BG_OPTION'; payload: BgOption }
  | { type: 'SET_CUSTOM_COLOR'; payload: string }
  | { type: 'SET_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_DISPLAY_URL'; payload: string }
  | { type: 'SET_DOWNLOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_RESULT_URL'; payload: string }
  | { type: 'SET_SOURCE_PREVIEW'; payload: string }
  | { type: 'SET_TAB_VALUE'; payload: string }
  | { type: 'START_UPLOAD'; payload: { sourcePreview: string } }
  | { type: 'UPLOAD_SUCCESS'; payload: { resultUrl: string; displayUrl: string } }
  | { type: 'UPLOAD_FAILURE' }
  | { type: 'CONFIRM'; payload: { tabValue: string } }
  | { type: 'RESET' }

const initialState: State = {
  bgOption: 'transparent',
  customColor: '#ff0000',
  dialogOpen: false,
  displayUrl: '',
  downloading: false,
  error: false,
  processing: false,
  progress: 0,
  resultUrl: '',
  sourcePreview: '',
  tabValue: TABS_VALUES.IMPORT,
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_BG_OPTION':
      return { ...state, bgOption: action.payload }
    case 'SET_CUSTOM_COLOR':
      return { ...state, customColor: action.payload }
    case 'SET_DIALOG_OPEN':
      return { ...state, dialogOpen: action.payload }
    case 'SET_DISPLAY_URL':
      return { ...state, displayUrl: action.payload }
    case 'SET_DOWNLOADING':
      return { ...state, downloading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload }
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload }
    case 'SET_RESULT_URL':
      return { ...state, resultUrl: action.payload }
    case 'SET_SOURCE_PREVIEW':
      return { ...state, sourcePreview: action.payload }
    case 'SET_TAB_VALUE':
      return { ...state, tabValue: action.payload }
    case 'START_UPLOAD':
      return {
        ...state,
        error: false,
        dialogOpen: true,
        tabValue: TABS_VALUES.PROCESSING,
        progress: 0,
        sourcePreview: action.payload.sourcePreview,
      }
    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        resultUrl: action.payload.resultUrl,
        displayUrl: action.payload.displayUrl,
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
    displayUrl,
    downloading,
    error,
    processing,
    progress,
    resultUrl,
    sourcePreview,
    tabValue,
  } = state
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
      dispatch({ type: 'SET_DISPLAY_URL', payload: '' })

      if (option === 'transparent') {
        const url = URL.createObjectURL(blob)
        dispatch({ type: 'SET_DISPLAY_URL', payload: url })
        return
      }
      try {
        const bgColor = option === 'white' ? '#ffffff' : color
        const composited = await applyBackground(blob, bgColor)
        const url = URL.createObjectURL(composited)
        dispatch({ type: 'SET_DISPLAY_URL', payload: url })
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
        const url = URL.createObjectURL(file)
        dispatch({ type: 'START_UPLOAD', payload: { sourcePreview: url } })

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
        resultBlobRef.current = result

        const resultObjUrl = URL.createObjectURL(result)
        dispatch({ type: 'UPLOAD_SUCCESS', payload: { resultUrl: resultObjUrl, displayUrl: resultObjUrl } })
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
    if (!displayUrl) return
    const anchor = downloadAnchorRef.current
    if (!anchor) return

    anchor.href = displayUrl
    anchor.download = 'background-removed.png'

    confirmedRef.current = true
    dispatch({ type: 'CONFIRM', payload: { tabValue: TABS_VALUES.DOWNLOAD } })
  }, [displayUrl])

  const handleReset = useCallback(() => {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (displayUrl && displayUrl !== resultUrl) URL.revokeObjectURL(displayUrl)
    resultBlobRef.current = null
    dispatch({ type: 'RESET' })
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
        <a aria-hidden="true" className="hidden" download href="about:blank" ref={downloadAnchorRef} tabIndex={-1} />
      </div>

      <Dialog
        injected={{
          open: dialogOpen,
          setOpen: (open: boolean) => dispatch({ type: 'SET_DIALOG_OPEN', payload: open }),
        }}
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
          {processing && <BackgroundRemoverProcessing downloading={downloading} progress={progress} />}

          {/* Error state */}
          {!processing && error && <BackgroundRemoverError onReset={handleReset} />}

          {/* Done state - before/after */}
          {!processing && !error && displayUrl && (
            <BackgroundRemoverResult
              bgOption={bgOption}
              customColor={customColor}
              displayUrl={displayUrl}
              onBgChange={handleBgChange}
              onColorChange={handleColorChange}
              onConfirm={handleConfirm}
              sourcePreview={sourcePreview}
            />
          )}
        </div>
      </Dialog>
    </>
  )
}
