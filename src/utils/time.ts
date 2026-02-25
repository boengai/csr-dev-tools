/**
 * Get the number of days in a month
 * @param year - The year
 * @param month - The month
 * @returns The number of days in the month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(Number(year), Number(month), 0).getDate()
}

/**
 * Format an ISO date string as a human-readable relative time
 */
export const formatRelativeTime = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
