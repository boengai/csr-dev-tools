export const generateUuid = (): string => {
  return crypto.randomUUID()
}

export const generateBulkUuids = (count: number): Array<string> => {
  const clampedCount = Math.max(1, Math.min(100, Math.floor(count) || 1))
  const uuids = Array<string>(clampedCount)
  for (let i = 0; i < clampedCount; i++) {
    uuids[i] = crypto.randomUUID()
  }
  return uuids
}
