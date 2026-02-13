import type { FeatureKey, ToolRegistryKey } from '@/types/constants'

export type UsePersistFeatureLayout = {
  setter: (position: number, payload: FeatureKey | ToolRegistryKey | null) => void
  value: Record<number, FeatureKey | ToolRegistryKey | null>
}
