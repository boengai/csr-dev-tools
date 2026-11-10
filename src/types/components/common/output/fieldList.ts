/**
 * One row of a [[Field list]]. `copy: false` drops the row's Copy button
 * (a word count, a description). `copyValue` copies something other than
 * what is shown (the raw JSON behind an annotated JWT payload, a bare date).
 */
export type OutputField = {
  copy?: boolean
  copyValue?: string
  label: string
  value: string
}

export type FieldListProps = {
  fields: Array<OutputField>
}
