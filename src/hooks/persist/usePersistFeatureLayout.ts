import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistFeatureLayout } from '@/types'

import { migrateLayoutValue } from '@/utils'

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
            return { ...state, value: migrateLayoutValue(state.value) }
          }
          return persistedState as UsePersistFeatureLayout
        },
        name: 'feature_layout',
        version: 1,
      },
    ),
  )
