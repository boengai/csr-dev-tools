/** Image Compressor's controls bag: JPEG/WebP quality, 1–100. */
export type CompressControls = { quality: number }

export type CompressSourceProps = { source: File; sourceUrl: string }

export type CompressResultProps = {
  pending: boolean
  result: Blob | null
  resultUrl: string | null
  source: File
}
