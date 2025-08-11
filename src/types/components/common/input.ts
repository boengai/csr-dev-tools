import type { InputHTMLAttributes, ReactElement, TextareaHTMLAttributes } from 'react'

import type { ButtonProps } from './button'

export type SelectInputProps = Omit<BaseInputProps, 'onEnter'> & {
  options: Array<{
    disabled?: boolean
    label: string
    value: string
  }>
}

export type TextAreaInputProps = BaseInputProps &
  Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'autoCorrect' | 'rows'>

export type TextInputProps = BaseInputProps &
  Pick<InputHTMLAttributes<HTMLTextAreaElement>, 'autoCorrect' | 'inputMode'> & {
    suffix?: ReactElement
    type: 'number' | 'text'
  }

export type UploadInputProps = Omit<BaseInputProps, 'onChange' | 'onEnter' | 'placeholder' | 'value'> & {
  accept: string
  button?: Pick<ButtonProps, 'block' | 'children'>
  multiple?: boolean
  onChange?: (value: Array<File>) => void
}

type BaseInputProps = {
  disabled?: boolean
  name: string
  onBlur?: () => void
  onChange?: (value: string) => void
  onEnter?: () => void
  placeholder?: string
  value?: string
}
