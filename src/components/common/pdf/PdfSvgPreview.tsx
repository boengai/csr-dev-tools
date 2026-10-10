import type { PdfSvgPreviewProps } from '@/types'

export const PdfSvgPreview = ({ pages }: PdfSvgPreviewProps) => {
  if (pages.length === 0) {
    return (
      <div
        aria-label="Empty preview"
        className="grid min-h-[300px] grow place-items-center rounded-lg border-2 border-gray-900 bg-gray-950 p-4 text-body-xs text-gray-500"
      >
        Start typing to see a preview.
      </div>
    )
  }

  return (
    <div className="grow space-y-3 overflow-auto rounded-lg border-2 border-gray-900 bg-white p-4">
      {pages.map((svg, i) => (
        // SVG comes from our own Rust WASM (Typst output); never user-supplied HTML.
        <div
          aria-label={`Page ${i + 1}`}
          className="mx-auto w-full max-w-full [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          key={i}
        />
      ))}
    </div>
  )
}
