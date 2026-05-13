export type BaseField = {
  base: number
  label: string
  name: string
  placeholder: string
}

export type BaseInput = { fromBase: number; fromName: string; val: string }

export type BaseResult = { error: string; values: Record<string, string> | null }
