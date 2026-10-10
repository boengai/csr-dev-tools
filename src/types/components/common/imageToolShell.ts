import type { ReactNode } from 'react'

import type { ToolComputeContext } from '@/types/hooks/computation'

export type ImageToolShellPreviewContext<TControls> = {
  controls: TControls
  source: File
  sourceUrl: string
  result: Blob | null
  resultUrl: string | null
  pending: boolean
  error: unknown | null
  recompute: () => void
  setControls: (partial: Partial<TControls>) => void
}

export type ImageToolShellControlsContext<TControls> = {
  controls: TControls
  pending: boolean
  recompute: () => void
  setControls: (partial: Partial<TControls>) => void
}

export type ImageToolShellDownloadContext<TControls> = {
  controls: TControls
  sourceName: string
  result: Blob
}

export type ImageToolShellProps<TControls extends object> = {
  description?: string
  onAfterClose?: () => void
  title: string

  accept: string
  uploadLabel: string
  onRejectInvalidFile?: (file: File) => void

  initialControls: TControls
  /**
   * Produce the result Blob. `context.signal` aborts when a newer
   * file/controls change supersedes this run, or on unmount — check it
   * between expensive steps (decode, draw, encode) to skip stale work.
   */
  process: (file: File, controls: TControls, context: ToolComputeContext) => Promise<Blob | null>

  renderControls: (ctx: ImageToolShellControlsContext<TControls>) => ReactNode
  renderPreview: (ctx: ImageToolShellPreviewContext<TControls>) => ReactNode

  getDownloadFilename: (ctx: ImageToolShellDownloadContext<TControls>) => string
}

/** Internal pipeline input of `<ImageToolShell>`: the source file plus the shell-owned controls bag. */
export type ImageToolPipelineInput<TControls> = {
  controls: TControls
  file: File | null
}
