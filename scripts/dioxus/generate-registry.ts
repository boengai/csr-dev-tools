// Writes crates/registry/src/generated.rs from tool-routes.ts (ADR-0035 §6).
// Usage: node scripts/dioxus/generate-registry.ts
import { writeFileSync } from 'node:fs'

import { TOOL_ROUTES } from '../../src/constants/tool-routes.ts'
import { renderRegistry } from './registry.ts'

writeFileSync(new URL('../../crates/registry/src/generated.rs', import.meta.url), renderRegistry(TOOL_ROUTES))
