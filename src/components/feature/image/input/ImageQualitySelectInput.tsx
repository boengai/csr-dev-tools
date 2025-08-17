import type { SelectInputProps } from '@/types'

import { SelectInput } from '@/components/common'

export const ImageQualitySelectInput = (props: Pick<SelectInputProps, 'disabled' | 'onChange' | 'value'>) => {
  return (
    <SelectInput
      {...props}
      name="quality"
      options={Array.from({ length: 20 }, (_: unknown, i: number) => ({
        label: `${(i + 1) * 5}% Qual.`,
        value: ((i + 1) / 5).toString(),
      }))}
      placeholder="Select image quality"
    />
  )
}
