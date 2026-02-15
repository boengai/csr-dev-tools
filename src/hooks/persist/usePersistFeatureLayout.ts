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
          0: 'json-formatter',
          1: 'uuid-generator',
          2: 'base64-encoder',
          3: 'jwt-decoder',
          4: 'unix-timestamp',
          5: 'regex-tester',
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
