import type { ButtonProps } from './button'

export type SelectInputProps = BaseInputProps & {
  items: Array<{
    label: string
    value: string
  }>
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
  onChange: (value: string) => void
  placeholder?: string
  value?: string
}
