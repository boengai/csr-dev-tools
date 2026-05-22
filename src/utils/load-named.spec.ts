import { describe, expect, it } from 'vitest'

import { loadNamed } from './load-named'

describe('loadNamed', () => {
  it('returns a loader that resolves to { default: <named export> }', async () => {
    const module = { MyComponent: () => 'hi' }
    const loader = loadNamed(async () => module, 'MyComponent')

    const resolved = await loader()

    expect(resolved).toEqual({ default: module.MyComponent })
  })

  it('forwards the loader rejection unchanged', async () => {
    const err = new Error('boom')
    const loader = loadNamed(async () => {
      throw err
    }, 'X')

    await expect(loader()).rejects.toBe(err)
  })
})
