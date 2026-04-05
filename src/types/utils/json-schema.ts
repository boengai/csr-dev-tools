export type ValidationError = {
  keyword: string
  message: string
  path: string
}

export type ValidationResult = {
  errors: Array<ValidationError> | null
  valid: boolean
}
