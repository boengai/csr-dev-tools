import type { CollisionDetection, DragEndEvent, SensorDescriptor, SensorOptions } from '@dnd-kit/core'
import type { SortableContextProps as DndSortableContextProps } from '@dnd-kit/sortable'

/**
 * Spreadable shape for `<DndContext>`. Owned by `useSortableItems`; the call
 * site spreads this onto the dnd-kit context provider. Keeps the sensor +
 * collision-detection + drag-end wiring at the seam so adopters can't drift.
 */
export type DndContextProps = {
  collisionDetection: CollisionDetection
  onDragEnd: (event: DragEndEvent) => void
  sensors: Array<SensorDescriptor<SensorOptions>>
}

/**
 * Spreadable shape for `<SortableContext>`. Pre-computed from the current
 * items (id list + `rectSortingStrategy`).
 */
export type SortableContextProps = Pick<DndSortableContextProps, 'items' | 'strategy'>

/**
 * Return shape for `useSortableItems`. Externally-useful for adopters that
 * want to thread the seam through a child component (e.g. extracting a
 * `<Grid>` that consumes the bag).
 */
export type UseSortableItemsResult<T extends { id: string }> = {
  /** The current items array. Order reflects user re-orders. */
  items: Array<T>
  /** File names rejected by the most recent upload batch (REPLACE semantics by default; functional updater for cumulative). */
  skipped: Array<string>
  /** Append the given pre-built items (caller mints ids). Synchronous. */
  addItems: (next: Array<T>) => void
  /**
   * Set the rejected-file-names list. Pass an array to REPLACE; pass a
   * functional updater (mirrors React `setState`) for cumulative or
   * dedupe-append flows from inside an async callback.
   */
  rejectFiles: (next: Array<string> | ((prev: Array<string>) => Array<string>)) => void
  /** Remove a single item by id. */
  removeItem: (id: string) => void
  /** Shallow-merge `partial` into the item with matching `id`. No-op if missing. */
  updateItem: (id: string, partial: Partial<T>) => void
  /** Clear items + skipped. */
  reset: () => void
  /** Spread onto `<DndContext>`. */
  dndContextProps: DndContextProps
  /** Spread onto `<SortableContext>`. */
  sortableContextProps: SortableContextProps
}
