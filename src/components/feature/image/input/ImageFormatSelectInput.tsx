import { useMemo } from 'react'

import type { ImageFormat, SelectInputProps } from '@/types'

import { SelectInput } from '@/components/common'
import { IMAGE_LABEL, IMAGE_VALUE } from '@/constants'

const ALL_FORMATS: Array<ImageFormat> = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
]

const detectSupportedFormats = (): Array<ImageFormat> => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return ALL_FORMATS.filter((format) => canvas.toDataURL(format).startsWith(`data:${format}`))
}

export const ImageFormatSelectInput = (props: Pick<SelectInputProps, 'disabled' | 'onChange' | 'value'>) => {
  const options = useMemo(
    () =>
      detectSupportedFormats().map((format) => ({
        label: IMAGE_LABEL[format],
        value: IMAGE_VALUE[format],
      })),
    [],
  )

  return <SelectInput {...props} name="format" options={options} placeholder="Select image format" />
}
