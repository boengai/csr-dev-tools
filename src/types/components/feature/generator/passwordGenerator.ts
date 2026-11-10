import type { PasswordOptions } from '@/types/utils/password'

export type PasswordCharSet = keyof Pick<PasswordOptions, 'digits' | 'lowercase' | 'symbols' | 'uppercase'>

export type PasswordGeneratorOptions = PasswordOptions & {
  count: number
}
