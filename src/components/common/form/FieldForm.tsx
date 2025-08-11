import type { FieldFormProps, InputControllerProps } from '@/types'

import { SelectInput, TextAreaInput, TextInput, UploadInput } from '../input'

const InputController = (props: InputControllerProps) => {
  switch (props.type) {
    case 'number':
      return <TextInput {...props} type="number" />
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
    <fieldset className="flex w-full flex-col gap-1">
      <label className="pl-2 text-gray-100">{label}</label>
      <InputController {...props} />
    </fieldset>
  )
}
