import { create, type StoreApi, type UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UsePersistAppLayout } from '@/types'

import { APP } from '@/constants'

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
        0: APP.IMAGE_CONVERTOR,
        1: APP.UNIX_TIMESTAMP,
        2: APP.BASE64_ENCODER,
        3: APP.COLOR_CONVERTER,
        4: APP.IMAGE_RESIZER,
        5: APP.PX_TO_REM,
      },
    }),
    { name: 'app_layout' },
  ),
)
