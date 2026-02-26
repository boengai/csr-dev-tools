import type { InputHTMLAttributes, ReactElement, RefAttributes, TextareaHTMLAttributes } from 'react'

import type { ButtonProps } from './button'

export type CheckboxInputProps = {
  'aria-label'?: string
  checked: boolean
  className?: string
  disabled?: boolean
  name?: string
  onBlur?: () => void
  onChange?: (checked: boolean) => void
}

export type ColorInputProps = {
  className?: string
  disabled?: boolean
  name?: string
  onBlur?: () => void
  onChange?: (value: string) => void
  size?: 'full' | 'swatch'
  value: string
}

export type RadioGroupInputProps = Omit<BaseInputProps, 'onEnter' | 'placeholder'> & {
  options: Array<{
    disabled?: boolean
    label: string
    value: string
  }>
}

export type RangeInputProps = Omit<BaseInputProps, 'onEnter' | 'placeholder'> & {
  max: number
  min: number
  step?: number
}

export type SelectInputProps = Omit<BaseInputProps, 'onEnter'> &
  Partial<InputVariants> & {
    options: Array<{
      disabled?: boolean
      label: string
      value: string
    }>
  }

export type TextAreaInputProps = BaseInputProps &
  Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'autoCorrect' | 'readOnly' | 'rows'> &
  Partial<InputVariants>

export type TextInputProps = BaseInputProps &
  Pick<InputHTMLAttributes<HTMLInputElement>, 'autoFocus' | 'autoCorrect' | 'inputMode' | 'onKeyDown' | 'onClick'> &
  RefAttributes<HTMLInputElement> &
  Partial<InputVariants> & {
    suffix?: ReactElement
    type: 'date' | 'number' | 'text' | 'time'
  }

export type UploadInputProps = Omit<BaseInputProps, 'onChange' | 'onEnter' | 'placeholder' | 'value'> & {
  accept: string
  button?: Pick<ButtonProps, 'block' | 'children'>
  multiple?: boolean
  onChange?: (value: Array<File>) => void
}

export type InputVariants = {
  block: boolean
  size: 'compact' | 'default'
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
