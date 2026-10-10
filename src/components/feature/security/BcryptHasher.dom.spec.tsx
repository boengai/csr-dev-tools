/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/hooks'
import { WorkerAbortError } from '@/wasm/worker-bridge'

const mocks = vi.hoisted(() => ({
  cancelBcrypt: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}))

vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>()
  return { ...actual, ...mocks }
})

const { BcryptHasher } = await import('./BcryptHasher')

const errorToasts = () =>
  useToast
    .getState()
    .items.filter((t) => t.type === 'error')
    .map((t) => t.label)

beforeEach(() => {
  useToast.setState({ items: [] })
  mocks.cancelBcrypt.mockReset().mockResolvedValue(undefined)
  mocks.hashPassword.mockReset()
  mocks.verifyPassword.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('BcryptHasher', () => {
  it('masks passwords by default with a show/hide toggle', () => {
    render(<BcryptHasher autoOpen />)

    const input = screen.getByLabelText('Password to hash')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('offers a Cancel button while hashing that terminates the worker without an error toast', async () => {
    let rejectHash: (err: Error) => void = () => {}
    mocks.hashPassword.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectHash = reject
        }),
    )
    mocks.cancelBcrypt.mockImplementation(async () => rejectHash(new WorkerAbortError('cancel')))

    render(<BcryptHasher autoOpen />)
    fireEvent.change(screen.getByLabelText('Password to hash'), { target: { value: 'pw' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hash Password' }))
    })

    const cancel = screen.getByRole('button', { name: 'Cancel' })
    await act(async () => {
      fireEvent.click(cancel)
    })

    expect(mocks.cancelBcrypt).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hash Password' })).toBeEnabled()
    expect(errorToasts()).toEqual([])
  })

  it('still toasts genuine hashing failures', async () => {
    mocks.hashPassword.mockRejectedValue(new Error('wasm exploded'))

    render(<BcryptHasher autoOpen />)
    fireEvent.change(screen.getByLabelText('Password to hash'), { target: { value: 'pw' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hash Password' }))
    })

    expect(errorToasts()).toEqual(['Hashing failed. Please try again.'])
  })

  it('terminates the worker when the dialog content unmounts', () => {
    const { unmount } = render(<BcryptHasher autoOpen />)
    mocks.cancelBcrypt.mockClear()
    unmount()
    expect(mocks.cancelBcrypt).toHaveBeenCalledTimes(1)
  })

  it('labels the Verify tab inputs and masks its password', async () => {
    render(<BcryptHasher autoOpen />)
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('tab', { name: 'Verify' }))
    })

    expect(screen.getByLabelText('Bcrypt hash to verify')).toBeInTheDocument()
    expect(screen.getByLabelText('Password to verify')).toHaveAttribute('type', 'password')
  })
})
