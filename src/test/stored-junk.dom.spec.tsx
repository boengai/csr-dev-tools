/**
 * No stored value may crash a tool, and opening a tool writes nothing. Every
 * tool is opened with junk under every key it reads, then with junk in every
 * field of its bag. A new tool is covered by being in the registry.
 */
import { act, cleanup, render } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TOOL_REGISTRY } from '@/constants'
import type { ToolRegistryEntry } from '@/types'
import { isRecord } from '@/utils/restore-json'

// `__proto__` also trips a lookup table that is not checked with `Object.hasOwn`.
const JUNK: Array<unknown> = [null, 42, 'zzz', '__proto__', [null, 7, 'zzz', '__proto__', {}], { toString: 1 }]

const inEveryField = (initial: unknown, junk: unknown): unknown =>
  isRecord(initial) ? Object.fromEntries(Object.keys(initial).map((field) => [field, junk])) : junk

const initials = vi.hoisted(() => new Map<string, unknown>())
vi.mock('@/hooks/persist/jsonStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/persist/jsonStorage')>()
  return {
    ...actual,
    readJsonStorage: (key: string, initial: unknown) => {
      initials.set(key, initial)
      return actual.readJsonStorage(key, initial)
    },
  }
})

globalThis.ResizeObserver ??= class {
  disconnect() {}
  observe() {}
  unobserve() {}
}
// CodeMirror measures text ranges; jsdom has no layout.
Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
Range.prototype.getBoundingClientRect ??= () => new DOMRect()

const getItem = vi.spyOn(Storage.prototype, 'getItem')
const setItem = vi.spyOn(Storage.prototype, 'setItem')

afterEach(() => {
  cleanup()
  initials.clear()
  vi.clearAllMocks()
})

const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 10)))

const open = async (Tool: ToolRegistryEntry['component']) => {
  const { container } = render(
    <Suspense fallback={<i data-loading="" />}>
      <Tool autoOpen />
    </Suspense>,
  )
  // Inside `act`, React skips the 300 ms it holds a fallback on screen.
  while (container.querySelector('[data-loading]')) await tick()
  // Past the first run and its render.
  await tick()
  expect(document.body.textContent?.trim()).not.toBe('')
  cleanup()
}

describe('stored junk', () => {
  it.each(TOOL_REGISTRY.map(({ component, key }) => [key, component] as const))(
    '%s opens and writes nothing',
    async (_key, Tool) => {
      getItem.mockReturnValue(null)
      await open(Tool)
      if (getItem.mock.calls.length === 0) return
      const defaults = new Map(initials)

      for (const junk of JUNK) {
        for (const damage of [() => junk, (key: string) => inEveryField(defaults.get(key), junk)]) {
          // A handoff is raw text, and consuming one is meant to save it.
          getItem.mockImplementation((key) => (key.includes('-handoff-') ? null : JSON.stringify(damage(key))))
          await open(Tool)
        }
      }
      expect(setItem).not.toHaveBeenCalled()
    },
    60_000,
  )
})
