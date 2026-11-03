import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadBlob } from '@/utils/download'
import { convertImageFormat } from '@/utils/image'

import { ImageConvertor } from './ImageConvertor'

vi.mock('@/utils/image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/image')>()),
  convertImageFormat: vi.fn(),
}))
vi.mock('@/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/file')>()),
  parseDataUrlToBlob: vi.fn(async () => new Blob(['x'])),
}))
vi.mock('@/utils/zip', () => ({ buildZipBlob: vi.fn(async () => new Blob(['zip'])) }))
vi.mock('@/utils/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/download')>()),
  downloadBlob: vi.fn(),
}))

const png = (name: string, body = 'x') => new File([body], name, { type: 'image/png' })

const ORIG_CREATE = URL.createObjectURL
const ORIG_REVOKE = URL.revokeObjectURL

const upload = (files: Array<File>) => {
  const input = document.querySelector('input[name="images"]') as HTMLInputElement
  fireEvent.change(input, { target: { files } })
}

// Flush microtasks only — no timer advancement.
const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.mocked(convertImageFormat).mockResolvedValue('data:image/webp;base64,AAAA')
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((type = 'image/png') => `data:${type};base64,`)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  URL.createObjectURL = ORIG_CREATE
  URL.revokeObjectURL = ORIG_REVOKE
})

describe('ImageConvertor', () => {
  it('converts without artificial delays and offers a per-file download', async () => {
    render(<ImageConvertor />)
    upload([png('a.png')])
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    await settle()

    expect(convertImageFormat).toHaveBeenCalledWith(expect.any(File), 'image/webp', { quality: 0.8 })
    fireEvent.click(screen.getByRole('button', { name: /^Download csr-dev-tools_a_\d+\.webp$/ }))
    expect(downloadBlob).toHaveBeenCalledOnce()
  })

  it('converts every queued image', async () => {
    render(<ImageConvertor />)
    upload([png('a.png'), png('b.png')])
    fireEvent.click(screen.getByRole('button', { name: 'Convert 2 images' }))
    await settle()

    expect(convertImageFormat).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Download ZIP' })).toBeInTheDocument()
  })

  it('does not show results after unmounting mid-run', async () => {
    let finish: (v: string) => void = () => {}
    vi.mocked(convertImageFormat).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const { unmount } = render(<ImageConvertor />)
    upload([png('a.png')])
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    await act(async () => {
      await vi.runAllTimersAsync()
    })
    expect(convertImageFormat).toHaveBeenCalledOnce()

    unmount()
    finish('data:image/webp;base64,AAAA')
    await settle()

    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
