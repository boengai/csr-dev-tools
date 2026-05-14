import type { ReactNode } from 'react'

export type ImageToolShellPhase = 'import' | 'processing' | 'done' | 'error'

export type ImageToolShellPreviewContext = {
  source: File
  sourceUrl: string
  result: Blob | null
  resultUrl: string | null
  pending: boolean
  error: unknown | null
  recompute: () => void
}

export type ImageToolShellControlsContext = {
  pending: boolean
  recompute: () => void
}

export type ImageToolShellDownloadContext = {
  sourceName: string
  result: Blob
}

export type ImageToolShellProps<TControls> = {
  description?: string
  onAfterDialogClose?: () => void
  title: string

  accept: string
  uploadLabel: string
  onRejectInvalidFile?: (file: File) => void

  controls: TControls
  process: (file: File, controls: TControls) => Promise<Blob | null>

  renderControls: (ctx: ImageToolShellControlsContext) => ReactNode
  renderPreview: (ctx: ImageToolShellPreviewContext) => ReactNode

  getDownloadFilename: (ctx: ImageToolShellDownloadContext) => string
}
