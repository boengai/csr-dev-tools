export type DateTime<T extends number | string = number> = {
  day: T
  hour: T
  minute: T
  month: T
  second: T
  year: T
}
