import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { TimezoneConverter } from './TimezoneConverter'

const STORAGE_KEY = 'csr-dev-tools-timezone-converter'
const FAVORITES_KEY = 'csr-dev-tools-timezone-favorites'

const targets = () => screen.getAllByRole('button', { name: /^Remove (?!.* from favorites$)/ }).map((b) => b.ariaLabel)

beforeEach(() => {
  localStorage.clear()
})

describe('TimezoneConverter — saved input', () => {
  it('keeps the readable zones and favorites of an old, damaged bag, and opening it writes nothing', () => {
    const bag = JSON.stringify({
      dateInput: '2026-01-01',
      sourceTz: 'Asia/Tokyo',
      targetTzIds: ['UTC', 7],
      timeInput: '10:00',
    })
    const favorites = JSON.stringify(['UTC', 7])
    localStorage.setItem(STORAGE_KEY, bag)
    localStorage.setItem(FAVORITES_KEY, favorites)
    const { unmount } = render(<TimezoneConverter autoOpen />)

    expect(targets()).toEqual(['Remove UTC'])
    expect(screen.getByRole('button', { name: 'Remove UTC from favorites' })).toBeTruthy()
    expect(screen.getByText(/^Tokyo \(/)).toBeTruthy()

    // A pending write is flushed on unmount.
    unmount()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(bag)
    expect(localStorage.getItem(FAVORITES_KEY)).toBe(favorites)
  })
})
