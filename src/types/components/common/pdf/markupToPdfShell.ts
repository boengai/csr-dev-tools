import type { CompileResultDto } from '@/types/wasm/pdf'

export type MarkupToPdfShellProps = {
  autoOpen?: boolean
  /**
   * Source-to-PDF compile function. Today's adopters route through Typst
   * via `src/wasm/pdf.ts` (`compileHtmlToPdf` / `compileMarkdownToPdf`).
   */
  compute: (source: string) => Promise<CompileResultDto> | CompileResultDto
  description?: string
  /**
   * Slug interpolated into the download filename:
   * `csr-dev-tools_<filenameSlug>_<timestamp>.pdf`. Keeps Tool-side filename
   * concerns out of every adopter.
   */
  filenameSlug: string
  /** Form field `name` for the source CodeMirror input. */
  inputName: string
  onAfterClose?: () => void
  /** Placeholder shown in the empty source pane. */
  placeholder: string
  /** Display label on the source pane (e.g. "HTML Input"). */
  sourceLabel: string
  /**
   * localStorage key for input persistence. Required — see CONTEXT.md →
   * "Markup to PDF shell" for the persistence-by-default rationale.
   */
  storageKey: string
  title: string
  /** Dialog trigger button label (e.g. "Convert"). */
  triggerLabel: string
}
