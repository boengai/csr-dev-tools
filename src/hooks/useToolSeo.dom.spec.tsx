/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useToolSeo } from './useToolSeo'

const BASELINE_TITLE = 'csr-dev-tools'

const getMetaContent = (selector: string): string | null =>
  document.querySelector(selector)?.getAttribute('content') ?? null

beforeEach(() => {
  document.title = BASELINE_TITLE
  document.head.innerHTML = ''
})

describe('useToolSeo', () => {
  it('sets document.title synchronously during render', () => {
    renderHook(() => useToolSeo({ description: 'desc', title: 'My Tool', url: '/tools/x' }))
    expect(document.title).toBe('My Tool')
  })

  it('writes description, og:title, og:description, og:url after the effect commits', () => {
    renderHook(() => useToolSeo({ description: 'desc', title: 'My Tool', url: '/tools/x' }))
    expect(getMetaContent('meta[name="description"]')).toBe('desc')
    expect(getMetaContent('meta[property="og:title"]')).toBe('My Tool')
    expect(getMetaContent('meta[property="og:description"]')).toBe('desc')
    expect(getMetaContent('meta[property="og:url"]')).toBe('https://csr-dev-tools.pages.dev/tools/x')
  })

  it('leaves og:url content empty when url is not provided', () => {
    renderHook(() => useToolSeo({ description: 'desc', title: 'My Tool' }))
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    expect(ogUrl).not.toBeNull()
    expect(ogUrl?.content).toBe('')
  })

  it('restores previous meta contents and document.title on unmount', () => {
    document.title = 'Original'
    const existingDesc = document.createElement('meta')
    existingDesc.setAttribute('name', 'description')
    existingDesc.setAttribute('content', 'original desc')
    document.head.appendChild(existingDesc)

    const { unmount } = renderHook(() => useToolSeo({ description: 'new desc', title: 'New Title' }))
    expect(document.title).toBe('New Title')
    expect(getMetaContent('meta[name="description"]')).toBe('new desc')

    unmount()
    expect(document.title).toBe('Original')
    expect(getMetaContent('meta[name="description"]')).toBe('original desc')
  })

  it('updates title and meta when props change', () => {
    const { rerender } = renderHook(
      ({ title, description }: { title: string; description: string }) =>
        useToolSeo({ description, title, url: '/tools/x' }),
      { initialProps: { title: 'First', description: 'desc 1' } },
    )
    rerender({ title: 'Second', description: 'desc 2' })
    expect(document.title).toBe('Second')
    expect(getMetaContent('meta[name="description"]')).toBe('desc 2')
  })

  it('reuses an existing meta tag rather than appending a duplicate', () => {
    const preExisting = document.createElement('meta')
    preExisting.setAttribute('name', 'description')
    preExisting.setAttribute('content', 'original')
    document.head.appendChild(preExisting)

    renderHook(() => useToolSeo({ description: 'new', title: 'My Tool' }))

    const descTags = document.querySelectorAll('meta[name="description"]')
    expect(descTags.length).toBe(1)
    expect(descTags[0].getAttribute('content')).toBe('new')
  })
})
