const FALLBACK = 'Conversion failed — please check your input'

export const formatParseError = (msg: string | null | undefined, label: string): string =>
  msg ? `Invalid ${label}: ${msg}` : FALLBACK
