import type { FileProcessorShellProps } from '@/types'

import { BatchFileProcessor } from './BatchFileProcessor'
import { DerivedFileProcessor } from './DerivedFileProcessor'
import { SingleFileProcessor } from './SingleFileProcessor'

/**
 * The shell for the **File Processor** layout type (ADR-0027, ADR-0028):
 * upload → process → download. The tile is a plain button; the dialog opens
 * on an upload area that fills the work area until a file is added. Then:
 * controls → status slot → input pane (source / queue, with Process or
 * "Choose another" under it) → output pane (Download at its bottom).
 * Closing the dialog returns to the upload area.
 *
 * `multiple` picks batch mode: a queue with a Process button and one `Blob`
 * out per file. Otherwise one file goes in, and `output` names what comes out:
 * `file` (default) — one `Blob`, live preview, Download; `assets` — many files
 * from the one image, a Download per card and Download ZIP; `text` — copyable
 * text blocks.
 * See CONTEXT.md → "File processor shell".
 */
export function FileProcessorShell<TControls extends object>(props: FileProcessorShellProps<TControls>) {
  if (props.multiple) return <BatchFileProcessor {...props} />
  if (props.output === 'assets' || props.output === 'text') return <DerivedFileProcessor<TControls> {...props} />
  return <SingleFileProcessor<TControls> {...props} />
}
