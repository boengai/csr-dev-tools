import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistAppLayout } from '@/types'

import { APP_KEY } from '@/constants'

export const usePersistAppLayout: UseBoundStore<StoreApi<UsePersistAppLayout>> = create<UsePersistAppLayout>()(
  persist<UsePersistAppLayout>(
    (set: StoreApi<UsePersistAppLayout>['setState']) => ({
      setter: (
        position: Parameters<UsePersistAppLayout['setter']>[0],
        payload: Parameters<UsePersistAppLayout['setter']>[1],
      ) =>
        set((state: UsePersistAppLayout) => ({
          value: { ...state.value, [position]: payload },
        })),
      value: {
        0: APP_KEY.IMAGE_CONVERTOR,
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
      },
    }),
    { name: 'app_layout' },
  ),
)
