import { closestCenter, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useState } from 'react'

import type { DndContextProps, SortableContextProps, UseSortableItemsResult } from '@/types'

/**
 * Sortable item bag — the hook seam that owns a re-orderable array of items
 * for "N files in, single result out" Tools (inverse-shape sibling of
 * `useBatchAssetPipeline`, which is "1 file in, N results out"). Today's
 * adopters: `ImageToPdf`, `CombinePdf`.
 *
 * Owns:
 *
 *  - Items state (`addItems`, `removeItem`, `updateItem`, `reset`). The
 *    duplicate-write tax of `setItems(prev => prev.map(i => i.id === id ? {
 *    ...i, ...partial } : i))` is absorbed in `updateItem`.
 *  - Skipped-files tracking (`skipped`, `rejectFiles`). REPLACE by default;
 *    pass a functional updater for cumulative/append-with-dedupe flows from
 *    inside an async callback (mirrors React `setState`).
 *  - The dnd-kit envelope (`dndContextProps`, `sortableContextProps`). Spread
 *    onto `<DndContext>` and `<SortableContext>` at the call site. The
 *    companion `<SortableCard>` component owns the per-card chrome.
 *
 * Does NOT validate MIME / extension — the caller filters and routes the
 * accepted set to `addItems` and the rejected names to `rejectFiles`.
 *
 * Does NOT own the result pipeline. Each consumer adopts the tool
 * computation pipeline over `items` separately.
 *
 * See CONTEXT.md → "Sortable item bag".
 */
export function useSortableItems<T extends { id: string }>(initial: Array<T> = []): UseSortableItemsResult<T> {
  const [items, setItems] = useState<Array<T>>(initial)
  const [skipped, setSkipped] = useState<Array<string>>([])

  const addItems = useCallback((next: Array<T>) => {
    setItems((prev) => [...prev, ...next])
  }, [])

  const rejectFiles = useCallback((next: Array<string> | ((prev: Array<string>) => Array<string>)) => {
    // React's setState accepts either form; we forward through unchanged so
    // adopters can use the functional form for cumulative/append-with-dedupe
    // flows from inside an async callback.
    setSkipped(next)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateItem = useCallback((id: string, partial: Partial<T>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...partial } : i)))
  }, [])

  const reset = useCallback(() => {
    setItems([])
    setSkipped([])
  }, [])

  // Sensors must live in the hook body — they cannot be memoized inside the
  // return value (calling `useSensors` from a useMemo would break the hook
  // call order).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Functional update reads the freshest items without rebuilding
  // `dndContextProps` on every items change (keeps sensor identity stable).
  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setItems((current) => {
      const oldIndex = current.findIndex((i) => i.id === active.id)
      const newIndex = current.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }, [])

  const dndContextProps: DndContextProps = useMemo(
    () => ({
      collisionDetection: closestCenter,
      onDragEnd,
      sensors,
    }),
    [onDragEnd, sensors],
  )

  const sortableContextProps: SortableContextProps = useMemo(
    () => ({
      items: items.map((i) => i.id),
      strategy: rectSortingStrategy,
    }),
    [items],
  )

  return {
    addItems,
    dndContextProps,
    items,
    rejectFiles,
    removeItem,
    reset,
    skipped,
    sortableContextProps,
    updateItem,
  }
}
