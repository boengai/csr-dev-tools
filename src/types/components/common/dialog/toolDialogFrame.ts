import type { ReactNode } from 'react'

import type { ToolDialogSize } from './toolDialogShell'

export type ToolDialogFrameTrigger = {
  /**
   * Optional callback fired synchronously BEFORE the dialog opens. Use this to
   * seed Tool state from the trigger's intent (e.g. set `mode: 'encrypt'` from
   * the Encrypt button). Side effects scheduled here apply during the same
   * React event as the dialog open.
   */
  onOpen?: () => void
  label: string
}

export type ToolDialogFrameProps = {
  /** Tile description shown above the trigger area. Skip if the Tool needs custom tile content. */
  description?: string
  /** One or more trigger buttons. Stacked vertically, full-width. */
  triggers: Array<ToolDialogFrameTrigger>

  title: string
  size?: ToolDialogSize

  onReset?: () => void

  autoOpen?: boolean
  onAfterClose?: () => void

  children: ReactNode
}
