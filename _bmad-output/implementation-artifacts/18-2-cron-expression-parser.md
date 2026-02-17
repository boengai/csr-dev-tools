---
story: 18.2
title: Cron Expression Parser
status: done
epic: 18
---

# Story 18.2: Cron Expression Parser

## Tool Metadata
- **Key:** `cron-expression-parser`
- **Name:** Cron Parser
- **Category:** Time
- **Emoji:** ⏰
- **Route:** `/tools/cron-expression-parser`
- **SEO Title:** Cron Expression Parser - CSR Dev Tools
- **SEO Description:** Parse cron expressions into human-readable descriptions and preview the next scheduled run times.

## Acceptance Criteria

**Given** the user enters a valid 5-field cron expression
**When** the value is entered
**Then** a human-readable description is displayed and the next 10 run times (UTC) are shown

**Given** the user clicks a preset button (e.g. "Every 5 minutes", "Weekdays at 9 AM")
**When** clicked
**Then** the expression field is populated and results are displayed

**Given** an invalid expression (wrong field count, out-of-range values, invalid range)
**When** entered
**Then** an error message is shown indicating which field is invalid

**Given** the expression uses step values (e.g. `*/15`)
**When** processed
**Then** the correct expanded values are used for description and scheduling

**Given** the expression uses comma-separated values
**When** processed
**Then** all specified values are included

## Implementation Checklist
1. [x] Create `src/utils/cron-parser.ts` with `parseCron()`, `CronParseResult`, `CRON_PRESETS`
2. [x] Create `src/utils/cron-parser.spec.ts` — 10 tests
3. [x] Create `src/components/feature/time/CronExpressionParser.tsx` — inline (no dialog)
4. [x] Register in `TOOL_REGISTRY`
5. [x] Add `'cron-expression-parser'` to `ToolRegistryKey` union
6. [x] Export from `src/utils/index.ts`

## Previous Story Intelligence (from 18.1)
- Inline tools (no dialog) work well for simple input→output patterns
- Preset buttons add significant UX value for expression-based tools

## File List
| File | Action |
|------|--------|
| `src/utils/cron-parser.ts` | NEW |
| `src/utils/cron-parser.spec.ts` | NEW |
| `src/components/feature/time/CronExpressionParser.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |

## Unit Tests
- 10 tests, all passing
- Covers: every minute, daily midnight, weekdays, step values, specific months, invalid field count, invalid values, invalid ranges, next run count, comma-separated values
