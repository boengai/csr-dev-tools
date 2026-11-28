import type { ToolRegistryKey } from '../../src/types/constants/tool-registry'

/**
 * The Dioxus spec filter (docs/ux/parity.md): which Tools and journeys the
 * Dioxus run holds to parity. A `port` PR adds its Tool's key to `PORTED`, and
 * its spec files and test titles to `JOURNEYS`. It is the one part of the
 * Dioxus run a `port` PR may change: `playwright.dioxus.config.ts`, which
 * holds the CSP project and the fixture's alias, is a gate file.
 */
export const PORTED: Array<ToolRegistryKey> = []

export const JOURNEYS: { grep?: RegExp; testMatch: Array<string> } = { testMatch: [] }
