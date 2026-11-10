import { type DragEvent, useState } from 'react'

import { useBlobUrl } from '@/hooks/useBlobUrl'
import type {
  FileProcessorComparePaneProps,
  FileProcessorCompareProps,
  FileProcessorNoun,
  FileProcessorThumbnailProps,
  FileProcessorUploadAreaProps,
  FileProcessorWorkAreaProps,
} from '@/types'

import { UploadIcon } from '../icon'
import { UploadInput } from '../input/UploadInput'

export const DEFAULT_NOUN: FileProcessorNoun = { one: 'file', other: 'files' }

/** ZIP name for a "Download ZIP" of either mode: the Tool's stem plus a timestamp. */
export const mintZipName = (prefix: string) => `csr-dev-tools_${prefix}_${Date.now()}.zip`

export const countLabel = (count: number, noun: FileProcessorNoun) => `${count} ${count === 1 ? noun.one : noun.other}`

const withArticle = (word: string) => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`

/**
 * The empty state of a File Processor: fills the work area until a file is
 * added. Takes a pick or a drop; the caller validates both (a drop bypasses
 * `accept`).
 */
export const FileUploadArea = ({ accept, label, multiple, name, noun, onFiles }: FileProcessorUploadAreaProps) => {
  const [dragging, setDragging] = useState(false)

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    // Moving onto a child fires dragleave on the parent; only a real exit counts.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer?.files ?? [])
    if (files.length === 0) return
    onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    // A drop target for pointer users; the picker button inside is the keyboard path.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <section
      aria-label="Upload area"
      className={`flex min-h-60 grow flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed p-6 transition-colors ${
        dragging ? 'border-primary bg-gray-800/50' : 'border-gray-700'
      }`}
      data-slot="upload-area"
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span aria-hidden="true" className="text-gray-500">
        <UploadIcon size={32} />
      </span>
      <p className="text-center text-body-sm text-gray-400">
        Drop {multiple ? noun.other : withArticle(noun.one)} here, or
      </p>
      <div className="w-full tablet:w-96">
        <UploadInput
          accept={accept}
          button={{ block: true, children: label }}
          multiple={multiple}
          name={name}
          onChange={onFiles}
        />
      </div>
    </section>
  )
}

const INPUT_PANE = {
  rail: 'flex shrink-0 flex-col gap-2 tablet:min-h-0 tablet:w-72',
  split: 'flex min-w-0 flex-col gap-2 tablet:min-h-0 tablet:flex-1',
} as const

/**
 * The fixed work area of both modes: input pane (source / queue) first —
 * left on tablet+, above on mobile — with its footer (Process, add more),
 * then the output pane with Download at its bottom.
 */
export const FileProcessorWorkArea = ({
  input,
  inputFooter,
  output,
  outputFooter,
  variant,
}: FileProcessorWorkAreaProps) => (
  <div className="flex grow flex-col gap-4 tablet:min-h-0 tablet:flex-row">
    <div className={INPUT_PANE[variant]} data-slot="tool-input">
      <div className="flex grow flex-col gap-2 tablet:min-h-0">{input}</div>
      {inputFooter && <div className="shrink-0">{inputFooter}</div>}
    </div>
    <div className="flex min-w-0 flex-col gap-2 tablet:min-h-0 tablet:flex-1" data-slot="tool-output">
      <div className="flex grow flex-col tablet:min-h-0">{output}</div>
      {outputFooter && <div className="shrink-0">{outputFooter}</div>}
    </div>
  </div>
)

export const FileThumbnail = ({ alt, blob, variant }: FileProcessorThumbnailProps) => {
  const url = useBlobUrl(blob)
  if (variant === 'row') {
    return url ? (
      <img alt={alt} className="size-15 shrink-0 rounded-sm object-cover" src={url} />
    ) : (
      <div className="size-15 shrink-0 rounded-sm bg-gray-800" />
    )
  }
  if (variant === 'asset') {
    return url ? <img alt={alt} className="max-h-16 max-w-16 object-contain" src={url} /> : null
  }
  return url ? <img alt={alt} className="max-h-[30vh] max-w-full object-contain tablet:max-h-full" src={url} /> : null
}

const ComparePane = ({ altText, pane }: FileProcessorComparePaneProps) => (
  <figure className="flex min-h-0 min-w-0 flex-1 flex-col items-center gap-3 p-4">
    <figcaption className="shrink-0 text-body-sm font-medium text-gray-300">{pane.caption}</figcaption>
    <div className="flex min-h-0 w-full grow items-center justify-center">
      {pane.blob ? (
        <div
          className={`flex size-full items-center justify-center transition-opacity ${pane.stale ? 'opacity-50' : ''}`}
        >
          <FileThumbnail alt={altText} blob={pane.blob} variant="preview" />
        </div>
      ) : (
        pane.status
      )}
    </div>
    {pane.details && <span className="shrink-0 text-center text-body-xs text-gray-500">{pane.details}</span>}
  </figure>
)

/** The big side-by-side comparison: Original ┊ Result, filling the output pane on tablet+. */
export const FileCompare = ({ busy, label, original, result }: FileProcessorCompareProps) => (
  <section
    aria-busy={busy}
    aria-label={label}
    className="bg-grid-texture flex shrink-0 flex-col rounded-sm bg-black tablet:min-h-0 tablet:min-w-0 tablet:shrink tablet:grow tablet:flex-row"
  >
    <ComparePane altText="original" pane={original} />
    <div className="h-0 w-full shrink-0 border-t-2 border-dashed border-gray-700 tablet:h-full tablet:w-0 tablet:border-t-0 tablet:border-l-2" />
    <ComparePane altText="result" pane={result} />
  </section>
)
