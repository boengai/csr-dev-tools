import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistFeatureLayout } from '@/types'
import { migrateLayoutValue } from '@/utils'
import { restoreJson } from '@/utils/restore-json'

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
          2: 'base64-codec',
          3: 'jwt-decoder',
          4: 'unix-timestamp',
          5: 'regex-tester',
        },
      }),
      {
        // `restoreJson` per slot: a closed widget is saved as `null`, which no default shows.
        merge: (stored, current) => {
          const { value } = restoreJson(stored, { value: {} })
          const slots = Object.entries(value).filter(([, key]) => key === null || typeof key === 'string')
          return { ...current, value: { ...current.value, ...Object.fromEntries(slots) } }
        },
        migrate: (persistedState, version) => {
          if (version <= 1) {
            const state = persistedState as UsePersistFeatureLayout
            return { ...state, value: migrateLayoutValue(state.value) }
          }
          return persistedState as UsePersistFeatureLayout
        },
        name: 'feature_layout',
        version: 2,
      },
    ),
  )
