import type { SelectInputProps } from '@/types'

import { SelectInput } from '@/components/common'

export const ImageQualitySelectInput = (props: Pick<SelectInputProps, 'onChange' | 'value'>) => {
  return (
    <SelectInput
      {...props}
      name="quality"
      options={Array.from({ length: 10 }, (_: unknown, i: number) => ({
        label: `${(i + 1) * 10}% Qual.`,
        value: ((i + 1) / 10).toString(),
      }))}
      placeholder="Select image quality"
    />
  )
}
