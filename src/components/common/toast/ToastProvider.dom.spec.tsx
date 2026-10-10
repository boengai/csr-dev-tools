/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks'

import { ToastProvider } from './ToastProvider'

beforeEach(() => {
  vi.useFakeTimers()
  useToast.setState({ items: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastProvider', () => {
  it('removes a toast from the store once its duration elapses', () => {
    render(<ToastProvider />)

    act(() => {
      useToast.getState().showSuccess('Copied')
    })
    expect(screen.getByText('Copied')).toBeInTheDocument()
    expect(useToast.getState().items).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(useToast.getState().items).toHaveLength(0)
  })

  it('renders two toasts minted in the same tick under distinct keys', () => {
    render(<ToastProvider />)

    act(() => {
      useToast.getState().showSuccess('one')
      useToast.getState().showSuccess('two')
    })

    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })
})
