import { render, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { TextDiffChecker } from '@/components/feature/text/TextDiffChecker'

const STORAGE_KEY = 'csr-dev-tools-text-diff'

beforeAll(() => {
  // CodeMirror measures text ranges; jsdom has no layout.
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () => new DOMRect()
})

beforeEach(() => {
  localStorage.clear()
})

describe('ComparatorShell — damaged saved input', () => {
  it('keeps the good side, and opening it writes nothing', async () => {
    const stored = JSON.stringify({ modified: 7, original: 'keepme' })
    localStorage.setItem(STORAGE_KEY, stored)
    const { unmount } = render(<TextDiffChecker autoOpen />)

    await waitFor(() =>
      expect(document.querySelector('[data-slot="tool-output"] [data-state="removed"]')?.textContent).toContain(
        'keepme',
      ),
    )
    // A pending write is flushed on unmount.
    unmount()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(stored)
  })
})
