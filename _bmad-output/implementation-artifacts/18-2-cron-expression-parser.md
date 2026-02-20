---
story: 18.2
title: Cron Expression Parser
status: done
epic: 18
---

# Story 18.2: Cron Expression Parser

Status: done

## Story

As a **user**,
I want **to enter a cron expression and see a human-readable description plus the next scheduled run times**,
So that **I can understand and verify cron schedules without memorizing the syntax**.

**Epic:** Epic 18 — Developer Productivity Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (useToolError, CopyButton — complete)
**Story Key:** 18-2-cron-expression-parser

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Cron Expression Parser tool registered in `TOOL_REGISTRY` under the Time category
**When** the user navigates to it (via sidebar, command palette, or `/tools/cron-expression-parser` route)
**Then** it renders inline with a text input and preset buttons
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Parse Cron Expression with Debounce

**Given** the text input
**When** the user types a cron expression (standard 5-field format: minute hour day-of-month month day-of-week)
**Then** the expression is parsed after a 300ms debounce
**And** a human-readable description is displayed
**And** the next N scheduled run times are displayed in UTC

### AC3: Preset Expressions

**Given** the preset buttons below the input
**When** the user clicks a preset (e.g., "Every minute", "Daily at midnight", "Weekdays at 9 AM")
**Then** the expression input is populated with the preset value
**And** the result updates immediately (no debounce — direct call to `parseCron`)

### AC4: Error Display for Invalid Expressions

**Given** an invalid cron expression is entered
**When** the parse result contains an error
**Then** the error message is displayed with `role="alert"` in red text
**And** the error describes which field is invalid (e.g., "Invalid minute field: '60'")

### AC5: Copy Description

**Given** a valid parse result with description
**When** the user clicks `CopyButton` next to the description
**Then** the human-readable description is copied to clipboard

### AC6: Next Runs Display

**Given** a valid cron expression
**When** the parse result is displayed
**Then** the next 10 run times are shown in UTC format (`YYYY-MM-DD HH:MM`)
**And** each run time is displayed in monospace font

### AC7: Unit Tests Cover Parsing Logic

**Given** unit tests in `src/utils/cron-parser.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: every minute, daily at midnight, weekday ranges, step values, specific months, invalid field count, invalid values, invalid ranges, next run count, and comma-separated values

## Tasks / Subtasks

- [x] Task 1: Create cron parser utility functions (AC: #2, #4, #6, #7)
  - [x] 1.1 Create `src/utils/cron-parser.ts` with `parseCron(expression: string, nextCount?: number): CronParseResult`
  - [x] 1.2 Define `CronParseResult` type with `valid`, `description`, `error`, `nextRuns` fields
  - [x] 1.3 Define `CronField` type and `FIELDS` array for minute/hour/dom/month/dow with min/max/names
  - [x] 1.4 Implement `parseField(field, meta)` — parse individual cron field segments (wildcards, ranges, steps, comma-separated values)
  - [x] 1.5 Implement `describeField(values, meta)` — convert parsed values to human-readable labels
  - [x] 1.6 Implement `describeCron(parsed)` — assemble full human-readable description from all 5 fields
  - [x] 1.7 Implement `getNextRuns(parsed, count)` — iterate forward from current time to find next matching minutes (max 525600 iterations = 1 year)
  - [x] 1.8 Validate 5-field format, return descriptive error for invalid fields
  - [x] 1.9 Define `CronPreset` type and export `CRON_PRESETS` array with 8 common presets
  - [x] 1.10 Export `parseCron`, `CronParseResult`, `CronPreset`, `CRON_PRESETS`

- [x] Task 2: Write unit tests for cron parser (AC: #7)
  - [x] 2.1 Create `src/utils/cron-parser.spec.ts`
  - [x] 2.2 Test every minute (`* * * * *`) — valid, description contains "Every minute"
  - [x] 2.3 Test daily at midnight (`0 0 * * *`) — description contains "00:00"
  - [x] 2.4 Test weekdays at 9 AM (`0 9 * * 1-5`) — description contains "09:00" and "Mon"
  - [x] 2.5 Test step values (`*/15 * * * *`) — valid, description contains "minute"
  - [x] 2.6 Test specific months (`0 0 1 1,6 *`) — description contains "Jan" and "Jun"
  - [x] 2.7 Test invalid field count (`* * *`) — error contains "Expected 5 fields"
  - [x] 2.8 Test invalid minute value (`60 * * * *`) — error contains "minute"
  - [x] 2.9 Test invalid range (`5-2 * * * *`) — error contains "minute"
  - [x] 2.10 Test requested number of next runs (10) — returns exactly 10
  - [x] 2.11 Test comma-separated values (`0 8,12,18 * * *`) — description contains all three times

- [x] Task 3: Create CronExpressionParser component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/time/CronExpressionParser.tsx` as named export
  - [x] 3.2 Render inline layout with tool description from registry
  - [x] 3.3 Add `FieldForm` type="text" for cron expression input with placeholder `* * * * *`
  - [x] 3.4 Add preset buttons row with `CRON_PRESETS` — styled as bordered pills with hover state
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay for typed input
  - [x] 3.6 Call `parseCron()` directly (no debounce) for preset button clicks
  - [x] 3.7 Display error with `role="alert"` and red text styling when `result.error` is set
  - [x] 3.8 Display description in styled card with `CopyButton`
  - [x] 3.9 Display next runs list in styled card with monospace font, UTC format

- [x] Task 4: Add to type system (AC: #1)
  - [x] 4.1 Add `'cron-expression-parser'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`

- [x] Task 5: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 5.1 Add registry entry to `TOOL_REGISTRY` array in `src/constants/tool-registry.ts` with category `'Time'`, emoji `'⏰'`, lazy-loaded component
  - [x] 5.2 Add pre-render route in `vite.config.ts` toolRoutes array

- [x] Task 6: Create barrel exports (AC: #1)
  - [x] 6.1 Create `src/components/feature/time/index.ts` with `export { CronExpressionParser } from './CronExpressionParser'`
  - [x] 6.2 Add `export * from './time'` to `src/components/feature/index.ts`
  - [x] 6.3 Add `export * from './cron-parser'` to `src/utils/index.ts`

- [x] Task 7: Verify integration (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Run `pnpm lint` — no errors
  - [x] 7.2 Run `pnpm test` — all tests pass (10 new tests)
  - [x] 7.3 Run `pnpm build` — build succeeds, tool chunk is separate

## Dev Notes

### Processing Pattern — Debounced Inline with Presets

The Cron Parser uses **inline layout** with **two trigger modes**:

| Trigger | Debounce | Method |
|---------|----------|--------|
| User typing in text input | 300ms via `useDebounceCallback` | `process(val)` |
| Preset button click | None (immediate) | `parseCron(expr, 10)` directly |

This dual-trigger pattern avoids unnecessary debounce delays when the user clicks a known-good preset expression.

### Cron Parser Architecture

The parser implements standard 5-field cron syntax (no seconds, no year):

| Field | Position | Range | Named Values |
|-------|----------|-------|-------------|
| Minute | 0 | 0-59 | — |
| Hour | 1 | 0-23 | — |
| Day of Month | 2 | 1-31 | — |
| Month | 3 | 1-12 | Jan-Dec |
| Day of Week | 4 | 0-6 | Sun-Sat |

**Supported syntax:** `*`, ranges (`1-5`), steps (`*/15`, `1-5/2`), comma-separated (`1,3,5`), and combinations.

### Next Runs Calculation

The `getNextRuns` function iterates minute-by-minute from the current time, checking each candidate against parsed field values. Max iterations capped at 525,600 (1 year of minutes) to prevent infinite loops for impossible expressions.

### Preset Expressions

8 presets exported as `CRON_PRESETS`:
- `* * * * *` — Every minute
- `*/5 * * * *` — Every 5 minutes
- `0 * * * *` — Every hour
- `0 0 * * *` — Daily at midnight
- `0 9 * * 1-5` — Weekdays at 9 AM
- `0 0 * * 0` — Weekly on Sunday
- `0 0 1 * *` — Monthly on the 1st
- `30 4 * * *` — Daily at 4:30 AM

### Previous Story Intelligence

From Story 18-1 (JSON to TypeScript):
- **`useDebounceCallback` pattern** works well for text input → live output tools
- **Toggle button styling** confirmed: `border-primary bg-primary/20 text-primary` for active state
- **Toast vs inline error:** 18-1 uses toast for parse errors; this story uses inline `role="alert"` since errors are field-specific and contextual

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 18.2] — Story requirements
- [Source: src/utils/cron-parser.ts] — Cron parser utility implementation
- [Source: src/components/feature/time/CronExpressionParser.tsx] — Component implementation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no issues encountered during implementation.

### Completion Notes List

- Created `parseCron()` with full 5-field cron parsing: wildcards, ranges, steps, comma lists, named month/dow values
- `describeCron()` generates human-readable text (e.g., "At 09:00 on Mon, Tue, Wed, Thu, Fri")
- `getNextRuns()` calculates next N run times in UTC with 525,600 iteration safety cap
- 8 preset expressions exported as `CRON_PRESETS`
- 10 unit tests covering valid expressions, error cases, and run count
- CronExpressionParser component with inline layout, debounced input, immediate preset buttons, error display with `role="alert"`, description with CopyButton, and next runs list
- Tool registered in TOOL_REGISTRY with lazy-loaded Time category entry

### File List

| Status | File | Description |
|--------|------|-------------|
| Created | `src/utils/cron-parser.ts` | CronParseResult, CronPreset, CRON_PRESETS, parseCron, parseField, describeCron, getNextRuns |
| Created | `src/utils/cron-parser.spec.ts` | 10 unit tests for cron parser |
| Created | `src/components/feature/time/CronExpressionParser.tsx` | Cron Expression Parser component with inline layout |
| Created | `src/components/feature/time/index.ts` | Time feature barrel export |
| Modified | `src/types/constants/tool-registry.ts` | Added 'cron-expression-parser' to ToolRegistryKey |
| Modified | `src/constants/tool-registry.ts` | Added cron-expression-parser registry entry |
| Modified | `src/components/feature/index.ts` | Added time barrel re-export |
| Modified | `src/utils/index.ts` | Added cron-parser barrel re-export |
| Modified | `vite.config.ts` | Added cron-expression-parser pre-render route |

## Senior Developer Review (AI)

**Reviewer:** boengai (backfill review)
**Date:** 2026-02-20
**Verdict:** Done (all issues fixed)

### Findings Fixed

| Severity | Finding | Fix Applied |
|----------|---------|-------------|
| HIGH | Missing barrel export for `CronExpressionParser` in `time/index.ts` | Added `export { CronExpressionParser }` and sorted exports |
| HIGH | Missing prerender route in `vite.config.ts` | Added `/tools/cron-expression-parser` prerender route |
| MEDIUM | `Array.includes()` in hot loop (~525k iterations) — O(n) per check vs O(1) for Set | Converted all 5 field arrays to Sets before the loop, using `.has()` instead of `.includes()` |

### Change Log

- 2026-02-20: Backfill code review — fixed hot loop performance with Set lookups, added missing barrel export and prerender route
