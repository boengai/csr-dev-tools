import type { FeatureKey, ToolRegistryKey } from '@/types/constants'

export type UsePersistFeatureLayout = {
  setter: (position: number, payload: FeatureKey | ToolRegistryKey | null) => void
  value: Record<number, FeatureKey | ToolRegistryKey | null>
}

export type UsePersistSettings = {
  setSetting: <K extends keyof UsePersistSettingsValue>(key: K, value: UsePersistSettingsValue[K]) => void
  value: UsePersistSettingsValue
}

export type UsePersistSettingsValue = {
  showBackgroundAnimation: boolean
}

export type DebouncedJsonWrite<T> = {
  /** Write any pending value now and cancel the timer. Idempotent. */
  flush: () => void
  /** Queue `value` for a trailing-debounced write (replaces any pending value). */
  schedule: (value: T) => void
  /** Write `value` immediately (cancels any pending write). */
  writeNow: (value: T) => void
}
