import type { SelectInputProps, TextInputProps, UploadInputProps } from './input'

export type FieldFormProps = InputControllerProps & {
  label: string
}

export type InputControllerProps = NumberInputForm | SelectInputForm | TextInputForm | UploadInputForm

type NumberInputForm = Omit<TextInputProps, 'type'> & {
  type: 'number'
}

type SelectInputForm = SelectInputProps & {
  type: 'select'
}

type TextInputForm = Omit<TextInputProps, 'type'> & {
  type: 'text'
}

type UploadInputForm = UploadInputProps & {
  type: 'upload'
}
