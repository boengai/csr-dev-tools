export type TimezoneEntry = {
  abbreviation: string
  city: string
  id: string
  label: string
  offset: string
  offsetMinutes: number
  region: string
  searchTokens: Array<string>
}

export type ConversionResult = {
  abbreviation: string
  date: string
  offset: string
  time: string
  timezone: string
}
