/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvFileConverter } from './EnvFileConverter'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('EnvFileConverter — warnings render as inline banner, not toast', () => {
  it('renders the warning text inline when source contains a malformed line', async () => {
    // Seed the per-mode source key that BidirectionalConverter.openDialog reads
    // when the user clicks a mode button.
    localStorage.setItem(
      'csr-dev-tools-env-to-json-source',
      JSON.stringify('GOOD=1\nMALFORMED_NO_EQ\nALSO_GOOD=2'),
    )

    render(<EnvFileConverter />)

    // The mode button on the closed tile — opening triggers setFieldsImmediate
    // with the seeded source, which routes through the compute pipeline.
    fireEvent.click(screen.getByRole('button', { name: '.env → JSON' }))

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    const statusEl = screen.getAllByRole('status').find((el) => el.textContent?.includes('Line 2: malformed'))
    expect(statusEl).toBeTruthy()
  })

  it('does NOT render the banner when input is well-formed (no warnings)', async () => {
    localStorage.setItem(
      'csr-dev-tools-env-to-json-source',
      JSON.stringify('GOOD=1\nALSO_GOOD=2'),
    )

    render(<EnvFileConverter />)

    fireEvent.click(screen.getByRole('button', { name: '.env → JSON' }))

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    const statusEls = screen.queryAllByRole('status')
    const malformedBanner = statusEls.find((el) => el.textContent?.includes('Line'))
    expect(malformedBanner).toBeUndefined()
  })
})
