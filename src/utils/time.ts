/**
 * Get the number of days in a month
 * @param year - The year
 * @param month - The month
 * @returns The number of days in the month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(Number(year), Number(month), 0).getDate()
}
