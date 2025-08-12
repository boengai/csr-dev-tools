import type { SelectInputProps } from '@/types'

import { SelectInput } from '@/components/common'

export const ImageFormatSelectInput = (props: Pick<SelectInputProps, 'onChange' | 'value'>) => {
  return (
    <SelectInput
      {...props}
      name="format"
      options={[
        { label: 'PNG', value: 'image/png' },
        { label: 'JPEG', value: 'image/jpeg' },
        { label: 'WebP', value: 'image/webp' },
      ]}
      placeholder="Select image format"
    />
  )
}
