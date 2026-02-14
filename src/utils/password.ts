export const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz'
export const DIGIT_CHARS = '0123456789'
export const SYMBOL_CHARS = "!@#$%^&*()-_=+[]{}|;:',./<>?~`"

export type PasswordOptions = {
  digits: boolean
  length: number
  lowercase: boolean
  symbols: boolean
  uppercase: boolean
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  digits: true,
  length: 16,
  lowercase: true,
  symbols: true,
  uppercase: true,
}

const randomIndex = (max: number): number => {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return array[0] % max
}

const fisherYatesShuffle = (arr: Array<string>): Array<string> => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
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
    chars.push(set[randomIndex(set.length)])
  }

  const pool = enabledSets.join('')
  for (let i = chars.length; i < length; i++) {
    chars.push(pool[randomIndex(pool.length)])
  }

  return fisherYatesShuffle(chars).join('')
}
