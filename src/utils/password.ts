import type { PasswordOptions } from '@/types/utils/password'

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'
const DIGIT_CHARS = '0123456789'
const SYMBOL_CHARS = "!@#$%^&*()-_=+[]{}|;:',./<>?~`"
export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  digits: true,
  length: 16,
  lowercase: true,
  symbols: true,
  uppercase: true,
}

const randomIndex = (max: number): number => {
  // Rejection sampling: discard values in the unrepresentative tail of 2^32
  // so every index in [0, max) is equally likely. Plain `% max` introduces
  // bias when max does not divide 2^32.
  const limit = Math.floor(0x1_0000_0000 / max) * max
  const array = new Uint32Array(1)
  let value: number
  do {
    crypto.getRandomValues(array)
    value = array[0]! // one-element buffer
  } while (value >= limit)
  return value % max
}

const fisherYatesShuffle = (arr: Array<string>): Array<string> => {
  for (let i = arr.length - 1; i > 0; i--) {
    // i is in [1, length) and j in [0, i], so both slots exist.
    const j = randomIndex(i + 1)
    const swapped = arr[i]!
    arr[i] = arr[j]!
    arr[j] = swapped
  }
  return arr
}

export const generatePassword = (options: PasswordOptions): string => {
  const length = Number.isNaN(options.length) ? 16 : Math.max(8, Math.min(128, Math.floor(options.length)))

  const enabledSets: Array<string> = []
  if (options.uppercase) enabledSets.push(UPPERCASE_CHARS)
  if (options.lowercase) enabledSets.push(LOWERCASE_CHARS)
  if (options.digits) enabledSets.push(DIGIT_CHARS)
  if (options.symbols) enabledSets.push(SYMBOL_CHARS)

  if (enabledSets.length === 0) {
    enabledSets.push(LOWERCASE_CHARS)
  }

  const chars: Array<string> = []

  for (const set of enabledSets) {
    chars.push(set.charAt(randomIndex(set.length)))
  }

  const pool = enabledSets.join('')
  for (let i = chars.length; i < length; i++) {
    chars.push(pool.charAt(randomIndex(pool.length)))
  }

  return fisherYatesShuffle(chars).join('')
}

export type { PasswordOptions } from '@/types/utils/password'
