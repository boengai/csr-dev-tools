import type { SelectInputProps } from '@/types'

import { SelectInput } from '@/components/common'
import { IMAGE_LABEL, IMAGE_VALUE } from '@/constants'

export const ImageFormatSelectInput = (props: Pick<SelectInputProps, 'disabled' | 'onChange' | 'value'>) => {
  const options: SelectInputProps['options'] = [
    { label: IMAGE_LABEL['image/png'], value: IMAGE_VALUE['image/png'] },
    { label: IMAGE_LABEL['image/jpeg'], value: IMAGE_VALUE['image/jpeg'] },
    { label: IMAGE_LABEL['image/webp'], value: IMAGE_VALUE['image/webp'] },
  ]

  return <SelectInput {...props} name="format" options={options} placeholder="Select image format" />
}
