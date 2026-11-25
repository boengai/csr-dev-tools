import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistSettings } from '@/types'
import { restoreJson } from '@/utils/restore-json'

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
      merge: restoreJson,
      name: 'settings',
    },
  ),
)
