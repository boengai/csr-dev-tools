import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createContext, useContext, useMemo } from 'react'

import type { SortableCardContextValue, SortableCardHandleProps, SortableCardProps } from '@/types'

const SortableCardContext = createContext<SortableCardContextValue | null>(null)

const useSortableCardContext = () => {
  const ctx = useContext(SortableCardContext)
  if (!ctx) {
    throw new Error('SortableCard.Handle must be rendered inside <SortableCard>')
  }
  return ctx
}

const SortableCardRoot = ({ children, id, onRemove, removeLabel }: SortableCardProps) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const ctx = useMemo<SortableCardContextValue>(() => ({ attributes, listeners }), [attributes, listeners])

  return (
    <SortableCardContext value={ctx}>
      <div
        className="group relative flex w-32 flex-col gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2"
        ref={setNodeRef}
        style={style}
      >
        {children}
        {onRemove && (
          // raw button: absolute-positioned 24×24 hover/focus-only circle; the
          // common <Button> always shows children with min-h-8 chrome which
          // would defeat the hover-only badge shape.
          <button
            aria-label={removeLabel}
            className="hover:bg-red-600 absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-gray-800 text-gray-300 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-white focus-visible:opacity-100"
            onClick={onRemove}
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </SortableCardContext>
  )
}

const SortableCardHandle = ({ children }: SortableCardHandleProps) => {
  const { attributes, listeners } = useSortableCardContext()
  return (
    <div className="aspect-square cursor-grab overflow-hidden rounded bg-gray-900" {...attributes} {...listeners}>
      {children}
    </div>
  )
}

/**
 * The compound component the [[Sortable item bag]] consumer Tools render to
 * wrap each item in the re-orderable grid. Owns the outer chrome, the
 * `useSortable` wiring, the drag-handle slot, and the hover-only remove
 * badge.
 *
 * Per the common-component rule, future variances must be a named prop —
 * not a `className` override.
 *
 * See CONTEXT.md → "SortableCard".
 */
export const SortableCard = Object.assign(SortableCardRoot, {
  Handle: SortableCardHandle,
})
