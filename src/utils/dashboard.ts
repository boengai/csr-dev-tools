import type { ToolRegistryKey } from '@/types'

const FEATURE_KEY_TO_REGISTRY_KEY: Record<string, ToolRegistryKey> = {
  BASE64_ENCODER: 'base64-encoder',
  COLOR_CONVERTER: 'color-converter',
  IMAGE_CONVERTOR: 'image-converter',
  IMAGE_RESIZER: 'image-resizer',
  PX_TO_REM: 'px-to-rem',
  UNIX_TIMESTAMP: 'unix-timestamp',
}

const REGISTRY_KEY_SET = new Set<string>(Object.values(FEATURE_KEY_TO_REGISTRY_KEY))

/**
 * Migrates layout values from old feature keys to new registry keys.
 * - Old feature keys (e.g., BASE64_ENCODER) → new registry keys (e.g., 'base64-encoder')
 * - Already-valid registry keys → preserved as-is
 * - Unknown keys → cleared to null
 * - Null positions → preserved as null
 */
export const migrateLayoutValue = (value: Record<number, string | null>): Record<number, ToolRegistryKey | null> => {
  const migrated: Record<number, ToolRegistryKey | null> = {}
  for (const [position, key] of Object.entries(value)) {
    if (key !== null && Object.hasOwn(FEATURE_KEY_TO_REGISTRY_KEY, key)) {
      migrated[Number(position)] = FEATURE_KEY_TO_REGISTRY_KEY[key]
    } else if (key !== null && REGISTRY_KEY_SET.has(key)) {
      migrated[Number(position)] = key as ToolRegistryKey
    } else {
      migrated[Number(position)] = null
    }
  }
  return migrated
}

/**
 * Validates a layout value for integrity:
 * - All position keys are valid non-negative integers
 * - All tool keys must be valid ToolRegistryKey or null
 * - No duplicate tool keys across positions
 */
export const isValidLayoutValue = (value: Record<number, string | null>, validKeys: Set<string>): boolean => {
  const seen = new Set<string>()
  for (const [position, key] of Object.entries(value)) {
    const posNum = Number(position)
    if (!Number.isInteger(posNum) || posNum < 0) return false
    if (key === null) continue
    if (!validKeys.has(key)) return false
    if (seen.has(key)) return false
    seen.add(key)
  }
  return true
}
