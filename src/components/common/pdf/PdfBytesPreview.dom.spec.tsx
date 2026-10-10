/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PdfBytesPreview } from './PdfBytesPreview'

const destroySpy = vi.fn(() => Promise.resolve())

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => ({
    destroy: destroySpy,
    promise: Promise.resolve({
      destroy: destroySpy,
      getPage: () =>
        Promise.resolve({
          getViewport: () => ({ height: 10, width: 10 }),
          render: () => ({ promise: Promise.resolve() }),
        }),
      numPages: 2,
    }),
  }),
}))

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker.js' }))

const BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46])

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAAA')
})

afterEach(() => {
  vi.restoreAllMocks()
  destroySpy.mockClear()
})

describe('PdfBytesPreview', () => {
  it('renders the first PDF under StrictMode (double-invoked effect)', async () => {
    render(
      <StrictMode>
        <PdfBytesPreview bytes={BYTES} />
      </StrictMode>,
    )

    expect(await screen.findByAltText('Page 1')).toBeInTheDocument()
    expect(screen.getByAltText('Page 2')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Rendering…')).toBeNull())
  })

  it('destroys the pdf.js document after rendering', async () => {
    render(<PdfBytesPreview bytes={BYTES} />)

    await screen.findByAltText('Page 1')
    await waitFor(() => expect(destroySpy).toHaveBeenCalled())
  })

  it('renders nothing for empty bytes', () => {
    const { container } = render(<PdfBytesPreview bytes={new Uint8Array(0)} />)
    expect(container).toBeEmptyDOMElement()
  })
})
