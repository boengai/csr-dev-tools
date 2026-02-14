import type { ReactNode } from 'react'

import type { RangeInputProps, SelectInputProps, TextAreaInputProps, TextInputProps, UploadInputProps } from './input'

export type FieldFormProps = InputControllerProps & {
  label: ReactNode
}

export type InputControllerProps =
  | NumberInputForm
  | RangeInputForm
  | SelectInputForm
  | TextAreaInputForm
  | TextInputForm
  | UploadInputForm

type RangeInputForm = RangeInputProps & {
  type: 'range'
}

type NumberInputForm = Omit<TextInputProps, 'type'> & {
  max?: number
  min?: number
  type: 'number'
}

type SelectInputForm = SelectInputProps & {
  type: 'select'
}

type TextAreaInputForm = Omit<TextAreaInputProps, 'type'> & {
  type: 'textarea'
}

type TextInputForm = Omit<TextInputProps, 'type'> & {
  type: 'text'
}

type UploadInputForm = UploadInputProps & {
  type: 'upload'
}
