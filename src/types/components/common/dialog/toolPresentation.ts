import type { ReactNode } from 'react'

/**
 * How a [[Tool dialog frame]] presents its Tool (ADR-0029).
 * - `dialog` (default): a tile on the dashboard opens the Tool in a dialog.
 * - `page`: the Tool's own route renders it inline, with no tile. The page
 *   owns the close control; the frame registers its reset with the page so
 *   closing the page clears the input like closing the dialog does.
 */
export type ToolPresentation =
  | { kind: 'dialog' }
  | { kind: 'page'; registerReset: (reset: (() => void) | undefined) => void }

export type ToolPresentationProviderProps = {
  children: ReactNode
  value: ToolPresentation
}
