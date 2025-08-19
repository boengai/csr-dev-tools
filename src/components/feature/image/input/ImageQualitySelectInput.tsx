import type { SelectInputProps } from '@/types'

import { SelectInput } from '@/components/common'

export const ImageQualitySelectInput = (props: Pick<SelectInputProps, 'disabled' | 'onChange' | 'value'>) => {
  const options: SelectInputProps['options'] = Array.from({ length: 20 }, (_: unknown, i: number) => ({
    label: `${(i + 1) * 5}% Qual.`,
    value: (((i + 1) * 5) / 100).toString(),
  }))

  return <SelectInput {...props} name="quality" options={options} placeholder="Select image quality" />
}
