import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import type { ReactNode } from 'react'

export type SortableCardContextValue = {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}

export type SortableCardProps = {
  /** Stable id used by dnd-kit. Must match the id given to `useSortableItems`. */
  id: string
  /** Card body — `<SortableCard.Handle>` plus any Tool-owned metadata and extras. */
  children: ReactNode
  /** Optional remove handler. When provided, the top-right × badge renders (shown on hover / keyboard focus). */
  onRemove?: () => void
  /** aria-label for the remove button. Required when `onRemove` is provided. */
  removeLabel?: string
}

export type SortableCardHandleProps = {
  /** Drag-area interior — typically the `<img>` thumbnail. */
  children: ReactNode
}
