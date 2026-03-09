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
