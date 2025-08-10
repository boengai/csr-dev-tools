import type { InputHTMLAttributes, ReactElement } from 'react'

import type { ButtonProps } from './button'

export type SelectInputProps = BaseInputProps & {
  options: Array<{
    disabled?: boolean
    label: string
    value: string
  }>
}

export type TextInputProps = BaseInputProps &
  Pick<InputHTMLAttributes<HTMLInputElement>, 'autoCorrect' | 'inputMode'> & {
    suffix?: ReactElement
    type: 'number' | 'text'
  }

export type UploadInputProps = Omit<BaseInputProps, 'onChange' | 'placeholder' | 'value'> & {
  accept: string
  button?: Pick<ButtonProps, 'block' | 'children'>
  multiple?: boolean
  onChange: (value: Array<File>) => void
}

type BaseInputProps = {
  disabled?: boolean
  name: string
  onBlur?: () => void
  onChange: (value: string) => void
  placeholder?: string
  value?: string
}
