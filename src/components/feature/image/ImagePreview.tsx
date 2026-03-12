import type { ImgHTMLAttributes } from 'react'

import { NotoEmoji } from '@/components/common'
import type { ImageFormat } from '@/types'
import { formatFileSize } from '@/utils'

export const EMPTY_IMAGE = 'data:,'

type ImagePreviewMetadata = {
  format?: ImageFormat
  height?: number
  size?: number
  width?: number
}

type ImagePreviewProps = Pick<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  metadata?: ImagePreviewMetadata
}

export const ImagePreview = ({ metadata, src }: ImagePreviewProps) => {
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-4 p-4 tablet:size-full tablet:max-h-full">
      {src ? (
        src === EMPTY_IMAGE ? (
          <NotoEmoji emoji="bomb" size={120} />
        ) : (
          <>
            <picture className="flex size-full grow flex-col items-center justify-center gap-4 tablet:max-h-full tablet:overflow-y-auto">
              <img alt="preview" className="w-full max-w-full tablet:max-h-full tablet:w-auto" src={src} />
            </picture>
            {metadata && (
              <ul className="flex gap-1 text-center text-body-sm text-gray-200 italic">
                {metadata.width && metadata.height && (
                  <li>
                    {metadata.width}x{metadata.height};
                  </li>
                )}
                {metadata.format && <li>{metadata.format};</li>}
                {metadata.size && <li>{formatFileSize(metadata.size)};</li>}
              </ul>
            )}
          </>
        )
      ) : (
        <NotoEmoji emoji="robot" size={120} />
      )}
    </div>
  )
}
