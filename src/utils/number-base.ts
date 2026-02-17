const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export const convertBase = (value: string, fromBase: number, toBase: number): string => {
  if (value.trim().length === 0) throw new Error('Empty input')
  if (fromBase < 2 || fromBase > 36) throw new Error(`Invalid fromBase: ${fromBase.toString()}. Must be 2-36.`)
  if (toBase < 2 || toBase > 36) throw new Error(`Invalid toBase: ${toBase.toString()}. Must be 2-36.`)

  const cleaned = value.trim().toLowerCase()

  // Validate characters for the given base
  const validChars = DIGITS.slice(0, fromBase)
  for (const ch of cleaned) {
    if (!validChars.includes(ch)) {
      throw new Error(`Invalid character '${ch}' for base ${fromBase.toString()}`)
    }
  }

  // Use BigInt for large number support
  let decimal = 0n
  const base = BigInt(fromBase)
  for (const ch of cleaned) {
    const digit = BigInt(parseInt(ch, 36))
    decimal = decimal * base + digit
  }

  if (toBase === 10) return decimal.toString()

  let result = ''
  const targetBase = BigInt(toBase)
  let remaining = decimal

  if (remaining === 0n) return '0'

  while (remaining > 0n) {
    const digit = Number(remaining % targetBase)
    result = DIGITS[digit] + result
    remaining = remaining / targetBase
  }

  return result
}

export const isValidForBase = (value: string, base: number): boolean => {
  if (value.trim().length === 0) return true
  const validChars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base)
  return [...value.trim().toLowerCase()].every((ch) => validChars.includes(ch))
}
