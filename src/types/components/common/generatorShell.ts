import type { ReactNode } from 'react'

import type { OutputField } from '@/types/components/common/output/fieldList'
import type { ToolComputeContext } from '@/types/hooks/computation'

/** One named text block of a `files` output (e.g. an RSA public key). */
export type GeneratorFile = {
  /** Download filename, e.g. `public.pem`. */
  filename: string
  /** Block heading; also names its Copy and Download buttons. */
  label: string
  /** Download MIME type. Defaults to `text/plain`. */
  mimeType?: string
  value: string
}

/** One row of a `fields` output — a [[Field list]] row (same shape as `TransformerField`). */
export type GeneratorField = OutputField

/**
 * One Download button under an `image` output. The file is built only when
 * the button is clicked (a PNG needs a canvas), so a slow or failing encode
 * never holds up the preview.
 */
export type GeneratorImageDownload = {
  /** Builds the file on click. A rejection toasts as a failed download. */
  blob: () => Blob | Promise<Blob>
  filename: string
  /** Button text, e.g. `Download PNG`. */
  label: string
}

/** An `image` output: a preview, with its Download buttons at the bottom of the pane. */
export type GeneratorImage = {
  alt: string
  downloads: Array<GeneratorImageDownload>
  /** Data URL or blob URL of the preview. */
  src: string
}

/** One colour of a `swatches` output. Clicking the swatch copies `value`. */
export type GeneratorSwatch = {
  /** CSS colour the swatch is filled with. */
  color: string
  /** Shown on hover / focus, one per line (hex, rgb, hsl). */
  details: Array<string>
  value: string
}

/** A `swatches` output: clickable colour swatches, plus Copy all in the label. */
export type GeneratorSwatches = {
  /** What the label's Copy copies (e.g. the palette as CSS custom properties). */
  copyAll: string
  swatches: Array<GeneratorSwatch>
}

/** What `compute` returns, per output kind. */
export type GeneratorResults = {
  /** Label/value rows, Copy per row. */
  fields: Array<GeneratorField>
  /** Named text blocks, each with Copy in its label and Download at the pane bottom. */
  files: Array<GeneratorFile>
  /** A preview with Download buttons at the bottom of the pane. */
  image: GeneratorImage
  /** One value per row: Copy all in the label, Copy per row. */
  list: Array<string>
  /** Colour swatches that copy on click; Copy all in the label. */
  swatches: GeneratorSwatches
  /** One text value with Copy in the label. */
  text: string
}

export type GeneratorOutputKind = keyof GeneratorResults

/** How the shell renders each output kind. */
export type GeneratorOutputs = {
  fields: {
    kind: 'fields'
    /** Names the pane (`Cron expression`). */
    label: string
    placeholder: string
  }
  files: {
    kind: 'files'
    /** Shown while there is no output (generating, or an error). */
    placeholder: string
  }
  image: {
    kind: 'image'
    /** Names the pane (`Preview`). */
    label: string
    placeholder: string
  }
  list: {
    /** One value, for the per-row Copy (`Copy UUID 2`). */
    itemLabel: string
    kind: 'list'
    /** All values, for the label and Copy all (`UUIDs`). */
    label: string
    placeholder: string
  }
  swatches: {
    /** Names the label's Copy all (`Copy palette as CSS`). */
    copyAllLabel: string
    kind: 'swatches'
    /** One swatch, for its Copy (`Copy color #3b82f6`). */
    itemLabel: string
    label: string
    placeholder: string
  }
  text: {
    kind: 'text'
    label: string
    placeholder: string
  }
}

/**
 * When the shell runs `compute`.
 * - `random`: on open, on every option change, and on the Generate button /
 *   ⌘/Ctrl+Enter. `slow` adds a busy state (spinner + elapsed time) that
 *   disables the button while it runs.
 * - `live`: same options ⇒ same output. On open and on every option change;
 *   no button.
 */
export type GeneratorRun = { generateLabel: string; mode: 'random'; slow?: boolean } | { mode: 'live' }

/** Render-prop context for the options pane. */
export type GeneratorOptionsCtx<O> = {
  options: O
  /** Toggles, selects, sliders: regenerates now. */
  setOptions: (partial: Partial<O>) => void
  /** Typed text: regenerates once typing pauses (300 ms), not per keystroke. */
  setOptionsDebounced: (partial: Partial<O>) => void
}

export type GeneratorShellProps<O extends object, K extends GeneratorOutputKind> = {
  autoOpen?: boolean
  /** Rejections show in the status slot (the `Error`'s message, else `errorFallback`); the output clears. */
  compute: (options: O, context: ToolComputeContext) => Promise<GeneratorResults[K]> | GeneratorResults[K]
  description?: string
  errorFallback?: string
  initial: Required<O>
  /** Messages about a valid result, shown in the status slot; the output stays. */
  notices?: (result: GeneratorResults[K]) => Array<string>
  onAfterClose?: () => void
  output: GeneratorOutputs[K]
  renderOptions: (ctx: GeneratorOptionsCtx<O>) => ReactNode
  run: GeneratorRun
  /** Persists the options bag (never the output). */
  storageKey?: string
  title: string
  triggerLabel: string
}

/** Mounted inside the dialog body, so it exists only while the dialog is open. */
export type GeneratorOnOpenProps = {
  onOpen: () => void
}

/**
 * The output pane's input, discriminated on `kind` so each branch gets its
 * matching spec and value. `value` is `null` while there is nothing to show
 * (generating a slow result, an error, or the dialog was closed).
 */
export type GeneratorOutputView = {
  [K in GeneratorOutputKind]: { kind: K; output: GeneratorOutputs[K]; value: GeneratorResults[K] | null }
}[GeneratorOutputKind]

/**
 * The pipeline's result inside the shell: the Tool's value stamped with the
 * run that produced it, so a result from before the dialog last closed is
 * never shown (the shell clears the output on close).
 */
export type GeneratorStampedResult<R> = { run: number; value: R | null }

export type GeneratorListOutputProps = {
  itemLabel: string
  label: string
  placeholder: string
  values: Array<string>
}

export type GeneratorPlaceholderProps = { text: string }

export type GeneratorFieldsOutputProps = {
  fields: Array<GeneratorField> | null
  label: string
  placeholder: string
}

export type GeneratorImageOutputProps = {
  image: GeneratorImage | null
  label: string
  placeholder: string
}

export type GeneratorSwatchesOutputProps = {
  copyAllLabel: string
  itemLabel: string
  label: string
  placeholder: string
  value: GeneratorSwatches | null
}

export type GeneratorFilesOutputProps = {
  files: Array<GeneratorFile> | null
  placeholder: string
}
