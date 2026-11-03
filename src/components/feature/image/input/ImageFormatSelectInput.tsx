import { useMemo } from 'react'

import { SelectInput } from '@/components/common'
import { IMAGE_LABEL, IMAGE_VALUE } from '@/constants'
import type { ImageFormatSelectInputProps } from '@/types'
import { detectEncodableImageFormats } from '@/utils/image'

export const ImageFormatSelectInput = ({ includeOriginal, ...props }: ImageFormatSelectInputProps) => {
  const options = useMemo(() => {
    const formats = detectEncodableImageFormats().map((format) => ({
      label: IMAGE_LABEL[format],
      value: IMAGE_VALUE[format],
    }))
    return includeOriginal ? [{ label: 'Keep original format', value: 'original' }, ...formats] : formats
  }, [includeOriginal])

  return (
    <SelectInput
      {...props}
      aria-label="Image format"
      name="format"
      options={options}
      placeholder="Select image format"
    />
  )
}
