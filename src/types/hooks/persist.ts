import type { FeatureKey } from '@/types/constants'

export type UsePersistFeatureLayout = {
  setter: (position: number, payload: FeatureKey | null) => void
  value: Record<number, FeatureKey | null>
}
