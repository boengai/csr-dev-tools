import type { EscapeMode } from '@/types'

export type EscapeDirection = 'escape' | 'unescape'

export type EscapeInput = { direction: EscapeDirection; mode: EscapeMode; source: string }
