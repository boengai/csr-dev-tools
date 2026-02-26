import type { FieldFormProps, InputControllerProps } from '@/types'

import { tv } from '@/utils'

import { RangeInput, SelectInput, TextAreaInput, TextInput, UploadInput } from '../input'

const fieldsetStyles = tv({
  base: 'flex w-full flex-col gap-1',
  variants: {
    grow: {
      true: 'min-h-0 grow',
      false: '',
    },
  },
})

const InputController = (props: InputControllerProps) => {
  switch (props.type) {
    case 'number':
      return <TextInput {...props} type="number" />
    case 'range':
      return <RangeInput {...props} />
    case 'select':
      return <SelectInput {...{ ...props, type: undefined }} />
    case 'textarea':
      return <TextAreaInput {...{ ...props, type: undefined }} />
    case 'upload':
      return <UploadInput {...{ ...props, type: undefined }} />
    default:
      return <TextInput {...props} type="text" />
  }
}

export const FieldForm = ({ label, ...props }: FieldFormProps) => {
  return (
    <fieldset className={fieldsetStyles({ grow: props.type === 'textarea' })}>
      {label && <label className="min-h-8 shrink-0 pl-2 text-gray-100">{label}</label>}
      <InputController {...props} />
    </fieldset>
  )
}
