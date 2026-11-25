import type { ReactNode } from 'react'

import type { OutputField } from '@/types/components/common/output/fieldList'
import type { ToolComputeContext } from '@/types/hooks/computation'

/** How the shell renders the result. Closed set — there is no free-form output slot (ADR-0027). */
export type TransformerOutputKind = 'fields' | 'image' | 'markup' | 'text'

/** One row of a `fields` output — a [[Field list]] row. */
export type TransformerField = OutputField

/**
 * An `image` output: a preview plus a Download button at the bottom of the
 * output pane. A Tool that also offers a text form (QR code's SVG) sets
 * `imageCopyLabel` on the shell and returns that text as `copy`.
 */
export type TransformerImage = {
  alt: string
  /** The text form copied by the shell's `imageCopyLabel` button. */
  copy?: string
  filename: string
  /** Data URL or blob URL. */
  src: string
}

/**
 * A file the output can be saved as, shown as an icon button in the output
 * label beside Copy (SVG Viewer's SVG, Mermaid's SVG and PNG). Disabled while
 * the output is empty. A failed build toasts — it is an action's outcome.
 */
export type TransformerDownload = {
  /** Builds the file on click; may be slow (SVG → PNG). */
  file: () => Blob | Promise<Blob>
  filename: string
  /** Names the button: "Download <label>". */
  label: string
}

/** The keys of `I`, other than `source`, that hold a string. */
export type TransformerStringField<I> = Exclude<
  Extract<{ [P in keyof I]: I[P] extends string ? P : never }[keyof I], string>,
  'source'
>

/**
 * A second required source input (JSON Schema Validator's schema), stacked
 * under the first in the input pane. Blank leaves the placeholder showing,
 * like a blank source; Reset clears it with the source.
 */
export type TransformerSecondSource<I> = {
  field: TransformerStringField<I>
  kind?: TransformerSourceKind
  label: string
  placeholder: string
}

/** A one-click fix for the current error, applied to the input bag (Mermaid's Auto-fix). */
export type TransformerErrorAction<I> = {
  label: string
  patch: Partial<I>
}

/**
 * What `compute` returns for each output kind. The empty value of each kind
 * (`''`, `[]`, `null`) is the empty state: the shell shows the placeholder.
 * - `text`: shown in a code block, Copy in the label.
 * - `fields`: a label/value list, Copy on each row.
 * - `image`: a preview, Download at the bottom.
 * - `markup`: HTML or SVG, sanitised by the shell before rendering; Copy
 *   in the label copies the sanitised markup — what is shown.
 */
export type TransformerOutputByKind = {
  fields: Array<TransformerField>
  image: TransformerImage | null
  markup: string
  text: string
}

export type TransformerOutput<K extends TransformerOutputKind> = TransformerOutputByKind[K]

/**
 * Render-prop context the shell passes to a Tool's `renderControls`.
 * Tools build their per-Tool top-of-dialog control row (mode/dialect select,
 * indent select, size-savings stat) using this context.
 */
export type TransformerShellControlsCtx<I, K extends TransformerOutputKind = 'text'> = {
  inputs: I
  result: TransformerOutput<K>
  /** Debounced (300 ms) — for text boxes in the controls row (a key, a root name). */
  setFields: (partial: Partial<I>) => void
  /** Recomputes at once — for selects and toggles. */
  setFieldsImmediate: (partial: Partial<I>) => void
}

/**
 * Text input is saved per Tool under `storageKey`. Pass `persistInput={false}`
 * instead when the input is sensitive (a secret key): nothing is written or
 * restored.
 */
export type TransformerShellPersistence =
  | { persistInput?: true; storageKey: string }
  | { persistInput: false; storageKey?: never }

export type TransformerShellProps<
  I extends { source: string },
  K extends TransformerOutputKind = 'text',
> = TransformerShellPersistence &
  TransformerShellOutputKindProp<K> & {
    autoOpen?: boolean
    /**
     * Fields merged into the reset alongside `source: ''`. Reset keeps the
     * controls by default; list a control here when it must not outlive the
     * dialog (a secret key).
     */
    clearOnReset?: Partial<I>
    /**
     * `fields` only: puts a Copy button in the result label that copies this
     * string built from all the rows (JSONPath's matches as one JSON array).
     */
    copyAll?: (result: TransformerOutput<K>) => string
    compute: (input: I, context: ToolComputeContext) => Promise<TransformerOutput<K>> | TransformerOutput<K>
    description?: string
    /** Files the output can be saved as, as icon buttons in the output label. */
    downloads?: (result: TransformerOutput<K>) => Array<TransformerDownload>
    /**
     * A one-click fix offered beside the error in the status slot. Return
     * `null` when there is none for this error.
     */
    errorAction?: (error: unknown, inputs: I) => TransformerErrorAction<I> | null
    /**
     * Status-slot text: always show this exact string when compute rejects.
     * Pick this when the underlying library throws implementation-leaking
     * errors (CSS/HTML/SQL/JS WASM facades).
     */
    errorLabel?: string
    /**
     * Status-slot text when the rejection is not an `Error` with a message.
     * Without `errorLabel`, an `Error`'s own message is shown verbatim — the
     * path for user-facing messages from the [[Parse-error narrator]].
     */
    errorFallback?: string
    /**
     * `image` only: the image also has a text form (`TransformerImage.copy`).
     * Copy (named by this label) and Download then both sit in the output
     * label, Download as an icon button (docs/ux → Buttons).
     */
    imageCopyLabel?: string
    initial: Required<I>
    /** Background behind `markup` output (default `'dark'`); `'light'` for SVG drawn in dark ink. */
    markupBackground?: 'dark' | 'light'
    /**
     * Non-fatal messages about a valid result, shown in the [[Tool status
     * slot]]. Hidden while there is an error. Input errors are not notices —
     * let `compute` reject and the shell shows them.
     */
    notices?: (result: TransformerOutput<K>) => Array<string>
    onAfterClose?: () => void
    /**
     * Called once after mount; a non-null result is applied over the restored
     * input — a handoff from another Tool (DB Diagram → Mermaid). A function
     * so a consuming read runs exactly once, even under StrictMode.
     */
    prefill?: () => Partial<I> | null
    renderControls?: (ctx: TransformerShellControlsCtx<I, K>) => ReactNode
    /**
     * Display label for the result pane (also used as the Copy / Download
     * button's accessible label). Defaults to `'Result'`. Pass a function when
     * it depends on the controls (`'SHA-256 Hash'`).
     */
    resultLabel?: string | ((inputs: I) => string)
    /** The empty state, phrased as an instruction ("Paste JSON to …"). */
    resultPlaceholder: string
    secondSource?: TransformerSecondSource<I>
    /** Source input control (default `'code'`): CodeMirror, plain textarea, or one-line text. */
    sourceKind?: TransformerSourceKind
    sourceLabel: string
    sourcePlaceholder: string
    title: string
    triggerLabel: string
  }

/**
 * Output kind (default `'text'`); `compute` returns the matching shape.
 * Required for every kind but `text`, so `<TransformerShell<I, 'fields'>>`
 * cannot silently render an array as text.
 */
export type TransformerShellOutputKindProp<K extends TransformerOutputKind> = [K] extends ['text']
  ? { outputKind?: 'text' }
  : { outputKind: K }

export type TransformerSourceKind = 'code' | 'text' | 'textarea'

export type TransformerOutputPaneProps<K extends TransformerOutputKind> = {
  /** `fields` only: the label's copy-all value (see `TransformerShellProps.copyAll`). */
  copyAll?: (result: TransformerOutput<K>) => string
  downloads?: Array<TransformerDownload>
  imageCopyLabel?: string
  kind: K
  label: string
  markupBackground?: 'dark' | 'light'
  placeholder: string
  value: TransformerOutput<K>
}

export type TransformerPaneLabelProps = {
  /** Names the Copy button when it copies something other than `label` (QR code's SVG). */
  copyLabel?: string
  /** When set, a Copy button for this value sits in the label. */
  copyValue?: string
  /** Icon buttons after Copy; disabled while `downloadsDisabled`. */
  downloads?: Array<TransformerDownload>
  downloadsDisabled?: boolean
  label: string
}

export type TransformerDownloadButtonProps = {
  disabled: boolean
  download: TransformerDownload
}

export type TransformerPlaceholderProps = { text: string }

export type TransformerMarkupOutputProps = {
  background: 'dark' | 'light'
  /** Already sanitised by the pane. */
  safeMarkup: string
}

export type TransformerImageOutputProps = {
  image: TransformerImage | null
  label: string
  placeholder: string
}
