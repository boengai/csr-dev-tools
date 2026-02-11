import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistFeatureLayout } from '@/types'

export const usePersistFeatureLayout: UseBoundStore<StoreApi<UsePersistFeatureLayout>> =
  create<UsePersistFeatureLayout>()(
    persist<UsePersistFeatureLayout>(
      (set) => ({
        setter: (position, payload) =>
          set((state) => ({
            value: { ...state.value, [position]: payload },
          })),
        value: {
          0: 'IMAGE_CONVERTOR',
          1: 'UNIX_TIMESTAMP',
          2: 'BASE64_ENCODER',
          3: 'COLOR_CONVERTER',
          4: 'IMAGE_RESIZER',
          5: 'PX_TO_REM',
        },
      }),
      { name: 'feature_layout' },
    ),
  )
