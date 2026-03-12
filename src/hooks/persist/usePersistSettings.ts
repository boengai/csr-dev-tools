import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistSettings } from '@/types'

export const usePersistSettings: UseBoundStore<StoreApi<UsePersistSettings>> = create<UsePersistSettings>()(
  persist<UsePersistSettings>(
    (set) => ({
      setSetting: (key, value) =>
        set((state) => ({
          value: { ...state.value, [key]: value },
        })),
      value: {
        showBackgroundAnimation: false,
      },
    }),
    {
      name: 'settings',
    },
  ),
)
