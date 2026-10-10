import { useSyncExternalStore } from 'react'

import { useDiagram } from '@/components/feature/data/db-diagram/DiagramContext'

const MESSAGES = {
  full: 'Browser storage is full — recent changes are not saved. Delete old diagrams or use Export → JSON.',
  unavailable: 'Browser storage is unavailable — changes are not being saved. Use Export → JSON to keep your work.',
} as const

// Persistent (not a toast): autosave retries on every edit, so a toast would
// repeat every few seconds while the condition lasts.
export const StorageStatusIndicator = () => {
  const { editor } = useDiagram()
  const status = useSyncExternalStore(
    (listener) => editor.subscribeToIndex(listener),
    () => editor.getStorageStatus(),
    () => editor.getStorageStatus(),
  )

  if (status === 'ok') return null

  return (
    <p
      className="text-xs ml-auto max-w-md rounded border border-error/40 bg-error/10 px-2 py-1 text-error"
      data-testid="diagram-storage-status"
      role="alert"
    >
      {MESSAGES[status]}
    </p>
  )
}
