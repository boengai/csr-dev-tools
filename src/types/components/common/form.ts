import type { ReactNode } from 'react'

import type { SelectInputProps, TextAreaInputProps, TextInputProps, UploadInputProps } from './input'

export type FieldFormProps = InputControllerProps & {
  label: ReactNode
}

export type InputControllerProps =
  | NumberInputForm
  | SelectInputForm
  | TextAreaInputForm
  | TextInputForm
  | UploadInputForm

type NumberInputForm = Omit<TextInputProps, 'type'> & {
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
