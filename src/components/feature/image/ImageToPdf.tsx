import { useMemo, useState } from 'react'

import { UploadInput } from '@/components/common/input/UploadInput'
import { ToolDialogFrame } from '@/components/common/dialog/ToolDialogFrame'
import { TOOL_REGISTRY_MAP } from '@/constants'
import { useBlobUrl } from '@/hooks'
import type { ToolComponentProps } from '@/types'
import type { ImageToPdfResult } from '@/utils'
import { imagesToPdf } from '@/utils'

const toolEntry = TOOL_REGISTRY_MAP['image-to-pdf']

const EMPTY_RESULT: ImageToPdfResult = {
  pdf: new Uint8Array(0),
  pageCount: 0,
  skipped: [],
}

export const ImageToPdf = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  const [result, setResult] = useState<ImageToPdfResult>(EMPTY_RESULT)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: Array<File>) => {
    setError(null)
    if (files.length === 0) {
      setResult(EMPTY_RESULT)
      return
    }
    setIsBusy(true)
    try {
      const out = await imagesToPdf(files)
      setResult(out)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate PDF')
      setResult(EMPTY_RESULT)
    } finally {
      setIsBusy(false)
    }
  }

  const reset = () => {
    setResult(EMPTY_RESULT)
    setError(null)
  }

  return (
    <ToolDialogFrame
      autoOpen={autoOpen}
      description={toolEntry?.description}
      onAfterClose={onAfterDialogClose}
      onReset={reset}
      title="Image to PDF"
      triggers={[{ label: 'Convert' }]}
    >
      <div className="flex w-full grow flex-col gap-4">
        <UploadInput
          accept="image/png,image/jpeg"
          button={{ block: true, children: 'Select PNG or JPEG images' }}
          multiple
          name="image-to-pdf-upload"
          onChange={handleFiles}
          disabled={isBusy}
        />
        {error !== null && (
          <p className="text-body-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {result.skipped.length > 0 && (
          <p className="text-body-xs text-yellow-400">
            Skipped {result.skipped.length} unsupported file{result.skipped.length === 1 ? '' : 's'}:{' '}
            {result.skipped.join(', ')}
          </p>
        )}
        <ResultPane result={result} isBusy={isBusy} />
      </div>
    </ToolDialogFrame>
  )
}

type ResultPaneProps = { result: ImageToPdfResult; isBusy: boolean }

const ResultPane = ({ result, isBusy }: ResultPaneProps) => {
  if (isBusy) {
    return (
      <div className="grid min-h-[100px] place-items-center rounded-lg border-2 border-gray-900 bg-gray-950 p-4 text-body-xs text-gray-500">
        Generating PDF…
      </div>
    )
  }
  if (result.pageCount === 0) {
    return (
      <div
        aria-label="Empty result"
        className="grid min-h-[100px] place-items-center rounded-lg border-2 border-gray-900 bg-gray-950 p-4 text-body-xs text-gray-500"
      >
        Choose images to start.
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between rounded-lg border-2 border-gray-900 bg-gray-950 p-4">
      <span className="text-body-xs text-gray-300">
        {result.pageCount} page{result.pageCount === 1 ? '' : 's'} generated
      </span>
      <DownloadPdfButton bytes={result.pdf} />
    </div>
  )
}

type DownloadPdfButtonProps = { bytes: Uint8Array }

const DownloadPdfButton = ({ bytes }: DownloadPdfButtonProps) => {
  const blob = useMemo(() => {
    if (bytes.byteLength === 0) return null
    return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
  }, [bytes])

  const href = useBlobUrl(blob)

  if (href === null) {
    return (
      <button
        className="rounded-md bg-gray-800 px-3 py-1 text-body-xs font-medium text-gray-500"
        disabled
        type="button"
      >
        Download PDF
      </button>
    )
  }

  return (
    <a
      className="rounded-md bg-blue-600 px-3 py-1 text-body-xs font-medium text-white hover:bg-blue-500"
      download="images.pdf"
      href={href}
    >
      Download PDF
    </a>
  )
}
