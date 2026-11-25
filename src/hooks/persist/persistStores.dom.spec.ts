import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mutate, StoreApi } from 'zustand'

import { usePersistFeatureLayout, usePersistSettings } from './index'

const JUNK = [null, 42, 'x', [], {}]

// Wrapped because `it.each` titles a bare `[]` row "undefined".
const junkAtVersions = (...versions: Array<number>) =>
  [
    ...JUNK,
    ...versions.flatMap((version) => [
      ...JUNK.map((state) => ({ state, version })),
      ...JUNK.map((value) => ({ state: { value }, version })),
    ]),
  ].map((stored) => ({ stored }))

const rehydrateFrom = async <State>(store: StoreApi<State>, key: string, stored: unknown) => {
  store.setState(store.getInitialState(), true)
  localStorage.setItem(key, JSON.stringify(stored))
  const setItem = vi.spyOn(Storage.prototype, 'setItem')
  // The exported store types leave `persist` out.
  await (store as Mutate<StoreApi<State>, [['zustand/persist', State]]>).persist.rehydrate()
  return setItem
}

const rehydrateLayout = (stored: unknown) => rehydrateFrom(usePersistFeatureLayout, 'feature_layout', stored)

const rehydrateSettings = (stored: unknown) => rehydrateFrom(usePersistSettings, 'settings', stored)

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('usePersistFeatureLayout', () => {
  it.each(junkAtVersions(1, 2))('keeps the defaults when $stored is stored', async ({ stored }) => {
    await rehydrateLayout(stored)
    expect(usePersistFeatureLayout.getState()).toEqual(usePersistFeatureLayout.getInitialState())
  })

  it('keeps closed, unknown and extra slots and fills damaged or missing ones from the defaults', async () => {
    const { setter, value } = usePersistFeatureLayout.getInitialState()
    const setItem = await rehydrateLayout({
      state: { setter: 5, value: { 0: null, 1: 'gone-tool', 2: 7, 9: 'later' } },
      version: 2,
    })
    expect(usePersistFeatureLayout.getState()).toEqual({
      setter,
      value: { ...value, 0: null, 1: 'gone-tool', 9: 'later' },
    })
    expect(setItem).not.toHaveBeenCalled()
  })

  it('keeps every widget of a version 1 default layout and writes it as version 2', async () => {
    await rehydrateLayout({
      state: {
        value: {
          0: 'json-formatter',
          1: 'uuid-generator',
          2: 'base64-encoder',
          3: 'jwt-decoder',
          4: 'unix-timestamp',
          5: 'regex-tester',
        },
      },
      version: 1,
    })
    const value = {
      0: 'json-formatter',
      1: 'uuid-generator',
      2: 'base64-codec',
      3: 'jwt-decoder',
      4: 'unix-timestamp',
      5: 'regex-tester',
    }
    expect(usePersistFeatureLayout.getState().value).toEqual(value)
    expect(JSON.parse(localStorage.getItem('feature_layout') ?? '')).toEqual({ state: { value }, version: 2 })
  })

  it('keeps closed slots and clears damaged ones in a version 1 layout', async () => {
    const { value } = usePersistFeatureLayout.getInitialState()
    await rehydrateLayout({
      state: { value: { 0: { toString: 1 }, 1: null, 2: 'gone-tool', 3: 'BASE64_ENCODER' } },
      version: 1,
    })
    expect(usePersistFeatureLayout.getState().value).toEqual({ ...value, 0: null, 1: null, 2: null, 3: 'base64-codec' })
  })
})

describe('usePersistSettings', () => {
  it.each(junkAtVersions(0))('keeps the defaults when $stored is stored', async ({ stored }) => {
    await rehydrateSettings(stored)
    expect(usePersistSettings.getState()).toEqual(usePersistSettings.getInitialState())
  })

  it('restores the saved setting beside a damaged action', async () => {
    const { setSetting } = usePersistSettings.getInitialState()
    const setItem = await rehydrateSettings({
      state: { setSetting: 5, value: { later: 1, showBackgroundAnimation: true } },
      version: 0,
    })
    expect(usePersistSettings.getState()).toEqual({ setSetting, value: { later: 1, showBackgroundAnimation: true } })
    expect(setItem).not.toHaveBeenCalled()
  })
})
