import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks'

import { PlaceholderImageGenerator } from './PlaceholderImageGenerator'

const flush = async (ms = 1) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const width = () => document.querySelector<HTMLInputElement>('input[name="placeholder-width"]')!

beforeEach(() => {
  localStorage.clear()
  useToast.setState({ items: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PlaceholderImageGenerator', () => {
  it('previews the image live, with PNG and SVG downloads under it', async () => {
    render(<PlaceholderImageGenerator autoOpen />)
    await flush()
    expect(screen.getByRole('img').getAttribute('alt')).toBe(
      'Placeholder preview: 800x600, background #cccccc, text #666666',
    )
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Download SVG' })).toBeTruthy()

    fireEvent.change(width(), { target: { value: '400' } })
    await flush(300)
    expect(screen.getByRole('img').getAttribute('alt')).toContain('400x600')
  })

  it('shows bad dimensions in the status slot, hides the preview and does not toast', async () => {
    render(<PlaceholderImageGenerator autoOpen />)
    await flush()

    fireEvent.change(width(), { target: { value: '5000' } })
    await flush(300)
    expect(screen.getByRole('alert').textContent).toBe('Maximum dimension is 4096x4096')
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Download PNG' })).toBeNull()

    fireEvent.change(width(), { target: { value: '' } })
    await flush(300)
    expect(screen.getByRole('alert').textContent).toMatch(/valid dimensions/)
    expect(useToast.getState().items).toEqual([])
  })

  it('keeps a half-typed hex out of the image until it parses', async () => {
    render(<PlaceholderImageGenerator autoOpen />)
    await flush()
    const hex = screen.getByRole('textbox', { name: 'Background hex value' })

    fireEvent.change(hex, { target: { value: '#ff' } })
    await flush(300)
    expect(hex).toHaveValue('#ff')
    expect(screen.getByRole('img').getAttribute('alt')).toContain('background #cccccc')

    fireEvent.change(hex, { target: { value: '#f00' } })
    await flush(300)
    expect(screen.getByRole('img').getAttribute('alt')).toContain('background #ff0000')
  })
})
