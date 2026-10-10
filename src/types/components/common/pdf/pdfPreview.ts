export type DownloadPdfButtonProps = {
  bytes: Uint8Array
  /**
   * Slug interpolated into the download filename at click time:
   * `csr-dev-tools_<filenameSlug>_<timestamp>.pdf`. The timestamp is minted
   * in the click handler, not during render.
   */
  filenameSlug: string
}

export type PdfBytesPreviewProps = { bytes: Uint8Array }

/** Render output tagged with the buffer it came from, so `isRendering` derives as `rendered.bytes !== bytes`. */
export type PdfBytesPreviewRendered = {
  bytes: Uint8Array
  error: string | null
  pages: Array<string>
}
