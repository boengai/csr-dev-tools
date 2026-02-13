import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ToolRegistryKey, UsePersistFeatureLayout } from '@/types'

const FEATURE_KEY_TO_REGISTRY_KEY: Record<string, ToolRegistryKey> = {
  BASE64_ENCODER: 'base64-encoder',
  COLOR_CONVERTER: 'color-converter',
  IMAGE_CONVERTOR: 'image-converter',
  IMAGE_RESIZER: 'image-resizer',
  PX_TO_REM: 'px-to-rem',
  UNIX_TIMESTAMP: 'unix-timestamp',
}

const REGISTRY_KEY_SET = new Set<string>(Object.values(FEATURE_KEY_TO_REGISTRY_KEY))

const migrateValue = (value: Record<number, string | null>): Record<number, ToolRegistryKey | null> => {
  const migrated: Record<number, ToolRegistryKey | null> = {}
  for (const [position, key] of Object.entries(value)) {
    if (key !== null && key in FEATURE_KEY_TO_REGISTRY_KEY) {
      migrated[Number(position)] = FEATURE_KEY_TO_REGISTRY_KEY[key]
    } else if (key !== null && REGISTRY_KEY_SET.has(key)) {
      migrated[Number(position)] = key as ToolRegistryKey
    } else {
      migrated[Number(position)] = null
    }
  }
  return migrated
}

export const usePersistFeatureLayout: UseBoundStore<StoreApi<UsePersistFeatureLayout>> =
  create<UsePersistFeatureLayout>()(
    persist<UsePersistFeatureLayout>(
      (set) => ({
        setter: (position, payload) =>
          set((state) => ({
            value: { ...state.value, [position]: payload },
          })),
        value: {
          0: 'image-converter',
          1: 'unix-timestamp',
          2: 'base64-encoder',
          3: 'color-converter',
          4: 'image-resizer',
          5: 'px-to-rem',
        },
      }),
      {
        migrate: (persistedState, version) => {
          if (version === 0) {
            const state = persistedState as UsePersistFeatureLayout
            return { ...state, value: migrateValue(state.value) }
          }
          return persistedState as UsePersistFeatureLayout
        },
        name: 'feature_layout',
        version: 1,
      },
    ),
  )
