export type OutputDisplayEntry = {
  key: string
  value: string
}

export type OutputDisplayProps = Partial<OutputDisplayVariants> & {
  emptyText?: string
  entries?: Array<OutputDisplayEntry>
  label?: string
  value?: string
}

export type OutputDisplayVariant = 'code' | 'single' | 'table'

export type OutputDisplayVariants = {
  variant: OutputDisplayVariant
}
