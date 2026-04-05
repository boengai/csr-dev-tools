import type { CronFieldConfig } from '@/utils'

export type FieldEditorProps = {
  config: CronFieldConfig
  fieldIndex: number
  label: string
  max: number
  min: number
  onChange: (config: CronFieldConfig) => void
}
