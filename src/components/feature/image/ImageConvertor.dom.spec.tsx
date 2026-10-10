/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nth } from '@/test/nth'
import { downloadBlob } from '@/utils/download'
import { convertImageFormat } from '@/utils/image'
import { buildZipBlob } from '@/utils/zip'

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

const upload = (files: Array<File>) => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
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
  vi.mocked(convertImageFormat).mockResolvedValue('data:image/webp;base64,AAAA')
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((type = 'image/png') => `data:${type};base64,`)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('ImageConvertor', () => {
  it('converts without artificial delays', async () => {
    render(<ImageConvertor />)
    upload([png('a.png')])
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    await settle()

    expect(downloadBlob).toHaveBeenCalledOnce()
  })

  it('keeps both outputs when two inputs share a base name', async () => {
    render(<ImageConvertor />)
    upload([png('a.png', 'one'), png('a.png', 'two!')])
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }))
    await settle()

    expect(buildZipBlob).toHaveBeenCalledOnce()
    const names = Object.keys(nth(vi.mocked(buildZipBlob).mock.calls, 0)[0])
    expect(names).toHaveLength(2)
    expect(new Set(names).size).toBe(2)
  })

  it('does not download after unmounting mid-run', async () => {
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
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
