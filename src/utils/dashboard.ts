import { TOOL_ROUTES } from '@/constants/tool-routes'
import type { ToolRegistryKey } from '@/types'

import { isRecord } from './restore-json'

const RENAMED_KEYS = new Map<unknown, ToolRegistryKey>([
  ['BASE64_ENCODER', 'base64-codec'],
  ['COLOR_CONVERTER', 'color-converter'],
  ['IMAGE_CONVERTOR', 'image-converter'],
  ['IMAGE_RESIZER', 'image-resizer'],
  ['PX_TO_REM', 'px-to-rem'],
  ['UNIX_TIMESTAMP', 'unix-timestamp'],
  ['base64-encoder', 'base64-codec'],
  ['toml-to-json-converter', 'json-to-toml-converter'],
  ['xml-to-json-converter', 'json-to-xml-converter'],
])

/**
 * Migrates a stored layout of version 1 or older to current registry keys.
 * - Feature keys (e.g., BASE64_ENCODER) and renamed registry keys → current registry keys
 * - Current registry keys → preserved as-is
 * - Unknown or non-text keys and null positions → null
 * - Anything but an object → an empty layout
 */
export const migrateLayoutValue = (value: unknown): Record<number, ToolRegistryKey | null> => {
  const migrated: Record<number, ToolRegistryKey | null> = {}
  for (const [position, stored] of Object.entries(isRecord(value) ? value : {})) {
    const current = RENAMED_KEYS.get(stored) ?? stored
    migrated[Number(position)] = TOOL_ROUTES.find(({ key }) => key === current)?.key ?? null
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
