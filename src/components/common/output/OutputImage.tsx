import type { OutputImageProps } from '@/types'

/** An output pane's image preview, scaled down to fit (Transformer and Generator `image`). */
export const OutputImage = ({ alt, src }: OutputImageProps) => (
  <div className="flex min-h-24 grow items-center justify-center overflow-auto rounded-sm border border-gray-800 bg-gray-950 p-4">
    <img alt={alt} className="max-h-full max-w-full object-contain" src={src} />
  </div>
)
