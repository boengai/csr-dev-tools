import type { ReactNode } from 'react'

import type {
  ColorInputProps,
  RadioGroupInputProps,
  RangeInputProps,
  SelectInputProps,
  TextAreaInputProps,
  TextInputProps,
  UploadInputProps,
} from './input'

export type FieldFormProps = InputControllerProps & {
  label: ReactNode
}

export type InputControllerProps =
  | ColorInputForm
  | DateInputForm
  | NumberInputForm
  | RadioGroupInputForm
  | RangeInputForm
  | SelectInputForm
  | TextAreaInputForm
  | TextInputForm
  | TimeInputForm
  | UploadInputForm

type ColorInputForm = ColorInputProps & {
  type: 'color'
}

type DateInputForm = Omit<TextInputProps, 'type'> & {
  type: 'date'
}

type RadioGroupInputForm = RadioGroupInputProps & {
  type: 'radio'
}

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

type TimeInputForm = Omit<TextInputProps, 'type'> & {
  type: 'time'
}

type UploadInputForm = UploadInputProps & {
  type: 'upload'
}
