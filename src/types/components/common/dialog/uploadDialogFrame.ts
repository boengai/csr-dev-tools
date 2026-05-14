import type { ReactNode } from 'react'

import type { ToolDialogSize } from './toolDialogShell'

export type UploadDialogFrameProps = {
  /** Tile description shown above the upload button. */
  description?: string

  /** Accept attribute for the underlying file input (e.g. 'image/*'). */
  accept: string
  /** Allow selecting multiple files (default false). */
  multiple?: boolean
  /** Tile button label (e.g. 'Select image to generate favicons'). */
  buttonLabel: string
  /** Name attribute on the underlying UploadInput. */
  uploadInputName: string

  /**
   * Fires when files are selected. Receives the files plus an `openDialog`
   * callback the caller invokes when ready (typically after async processing
   * is far enough along that the dialog body has something to show). Return
   * early — and skip `openDialog()` — to keep the dialog closed (e.g. on a
   * validation rejection).
   */
  onUpload: (files: Array<File>, openDialog: () => void) => Promise<void> | void

  title: string
  size?: ToolDialogSize

  onReset?: () => void
  onAfterClose?: () => void

  children: ReactNode
}
