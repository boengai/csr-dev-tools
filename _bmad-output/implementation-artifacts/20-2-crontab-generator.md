---
story: 20.2
title: Crontab Generator
status: done
epic: 20
---

# Story 20.2: Crontab Generator

Status: done

## Story

As a **user**,
I want **to visually build a cron expression by selecting minute, hour, day, month, and weekday values**,
So that **I can create correct cron schedules without memorizing the syntax**.

**Epic:** Epic 20 — Advanced Developer Tools
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 2 (CopyButton, FieldForm — complete)
**Story Key:** 20-2-crontab-generator

## Acceptance Criteria

### AC1: Tool Registered and Renders Inline

**Given** the Crontab Generator tool registered in `TOOL_REGISTRY` under the Time category
**When** the user navigates to it (via sidebar, command palette, or `/tools/crontab-generator` route)
**Then** it renders inline with visual field selectors and output
**And** the tool loads as a lazy-loaded chunk (code split)

### AC2: Five Cron Field Selectors

**Given** the tool renders
**When** the user sees the controls
**Then** five field selectors are shown: Minute (0–59), Hour (0–23), Day of Month (1–31), Month (1–12), Day of Week (0–6)
**And** each field supports: wildcard (*), specific value, range (e.g., 1-5), interval (e.g., */5), and comma-separated combinations

### AC3: Field Mode Selection

**Given** each cron field
**When** the user interacts with a field
**Then** a mode selector offers: Every (*), Specific (pick values), Range (start–end), Interval (*/N)
**And** the appropriate input controls appear for the selected mode
**And** the cron expression updates immediately on any change

### AC4: Generated Cron Expression with Copy

**Given** the configured fields
**When** any field changes
**Then** the complete cron expression string is displayed (e.g., `*/5 * * * *`)
**And** a `CopyButton` allows copying the expression
**And** a human-readable description is shown (e.g., "Every 5 minutes")

### AC5: Next 5 Run Times

**Given** a valid cron expression
**When** displayed
**Then** the next 5 scheduled run times are shown in UTC
**And** times update when the expression changes

### AC6: Sensible Default

**Given** the tool loads
**When** the page renders
**Then** all fields default to wildcard (*), producing `* * * * *` ("Every minute")
**And** next 5 run times are shown immediately

### AC7: Unit Tests Cover Expression Building

**Given** unit tests in `src/utils/crontab.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: wildcard expression, specific values, ranges, intervals, mixed fields, human-readable descriptions, next run time calculation

## Tasks / Subtasks

- [x] Task 1: Create crontab utility (AC: #4, #5, #7)
  - [x] 1.1 Create `src/utils/crontab.ts`
  - [x] 1.2 Define `CronFieldConfig` type: `{ mode: 'every' | 'specific' | 'range' | 'interval', values?: Array<number>, rangeStart?: number, rangeEnd?: number, interval?: number }`
  - [x] 1.3 Define `CrontabConfig` type: `{ minute: CronFieldConfig, hour: CronFieldConfig, dayOfMonth: CronFieldConfig, month: CronFieldConfig, dayOfWeek: CronFieldConfig }`
  - [x] 1.4 Implement `buildCronExpression(config: CrontabConfig): string` — converts config to cron string
  - [x] 1.5 Implement `describeCron(expr: string): string` — generates human-readable description
  - [x] 1.6 Implement `getNextRuns(expr: string, count: number): Array<string>` — computes next N run times in UTC
  - [x] 1.7 Reuse parsing logic from existing `src/utils/cron-parser.ts` for `describeCron` and `getNextRuns` (import `parseCron`)
  - [x] 1.8 Export `buildCronExpression`, `describeCron`, `getNextRuns`, `CrontabConfig`, `CronFieldConfig`

- [x] Task 2: Write unit tests (AC: #7)
  - [x] 2.1 Create `src/utils/crontab.spec.ts`
  - [x] 2.2 Test all-wildcard config produces `* * * * *`
  - [x] 2.3 Test specific values: minute=0,30 → `0,30 * * * *`
  - [x] 2.4 Test range: hour 9-17 → `* 9-17 * * *`
  - [x] 2.5 Test interval: every 5 minutes → `*/5 * * * *`
  - [x] 2.6 Test mixed fields config
  - [x] 2.7 Test `describeCron` returns human-readable string
  - [x] 2.8 Test `getNextRuns` returns correct count of future dates

- [x] Task 3: Create CrontabGenerator component (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Create `src/components/feature/time/CrontabGenerator.tsx` as named export
  - [x] 3.2 Render inline layout with 5 field sections
  - [x] 3.3 Each field: mode selector (Every/Specific/Range/Interval) via button group
  - [x] 3.4 Specific mode: multi-select checkboxes or number input for values
  - [x] 3.5 Range mode: two number inputs (start, end)
  - [x] 3.6 Interval mode: single number input for step value
  - [x] 3.7 Compute cron expression on every state change via `buildCronExpression()`
  - [x] 3.8 Show expression in monospace code block with `CopyButton`
  - [x] 3.9 Show human-readable description via `describeCron()`
  - [x] 3.10 Show next 5 run times via `getNextRuns()`
  - [x] 3.11 Show tool description from `TOOL_REGISTRY_MAP['crontab-generator']`

- [x] Task 4: Register tool in TOOL_REGISTRY (AC: #1)
  - [x] 4.1 Add `'crontab-generator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY` in `src/constants/tool-registry.ts` (Time category, 🕰️ emoji)
  - [x] 4.3 Add pre-render route in `vite.config.ts`

- [x] Task 5: Create barrel exports (AC: #1)
  - [x] 5.1 Add `export { CrontabGenerator } from './CrontabGenerator'` to `src/components/feature/time/index.ts`
  - [x] 5.2 Add `export * from './crontab'` to `src/utils/index.ts`

- [x] Task 6: Verify integration (AC: #1–#7)
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm test` — all tests pass (841/841)
  - [x] 6.4 Run `pnpm build` — build succeeds

## Dev Notes

### Inverse of CronExpressionParser — Reuse Logic

This tool is the inverse of `CronExpressionParser` (Story 18-2). The parser takes a cron string and outputs description + next runs. The generator takes visual input and produces a cron string + description + next runs.

**Critical:** Reuse the existing `parseCron()` function from `src/utils/cron-parser.ts` for `describeCron` and `getNextRuns` instead of reimplementing. The `parseCron(expr, count)` already returns `{ description, nextRuns, valid, error }`.

```typescript
// src/utils/crontab.ts — reuse parseCron
import { parseCron } from './cron-parser'

export function describeCron(expr: string): string {
  const result = parseCron(expr, 0)
  return result.valid ? result.description : 'Invalid expression'
}

export function getNextRuns(expr: string, count: number): Array<string> {
  const result = parseCron(expr, count)
  return result.valid ? result.nextRuns : []
}
```

### Processing Pattern — Synchronous, No Debounce

Expression building is pure string concatenation from field configs. No async, no debounce needed. The `describeCron` and `getNextRuns` calls are also synchronous (reusing `parseCron`).

### UI Layout (Inline)

```
┌──────────────────────────────────────────────────────────────────┐
│  Visually build cron expressions with field selectors...         │
│                                                                  │
│  Minute (0-59)      [Every ▪] [Specific] [Range] [Interval]     │
│                     └─ * (every minute)                          │
│                                                                  │
│  Hour (0-23)        [Every] [Specific] [Range] [Interval ▪]     │
│                     └─ */2  Start: [0] Step: [2]                 │
│                                                                  │
│  Day of Month (1-31) [Every ▪] [Specific] [Range] [Interval]   │
│                     └─ * (every day)                             │
│                                                                  │
│  Month (1-12)       [Every ▪] [Specific] [Range] [Interval]     │
│                     └─ * (every month)                           │
│                                                                  │
│  Day of Week (0-6)  [Every] [Specific ▪] [Range] [Interval]     │
│                     └─ [Mon] [Tue] [Wed] [Thu] [Fri]  → 1-5     │
│                                                                  │
│  ──────────── dashed divider ─────────────                       │
│                                                                  │
│  Cron Expression                                    [Copy]       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ * */2 * * 1-5                                             │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Description: Every minute, every 2 hours, Monday through Friday │
│                                                                  │
│  Next 5 runs (UTC)                                               │
│  • 2026-02-17 18:00:00                                           │
│  • 2026-02-17 18:01:00                                           │
│  • 2026-02-17 18:02:00                                           │
│  • 2026-02-17 18:03:00                                           │
│  • 2026-02-17 18:04:00                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Field Mode Controls

Each field uses a button group for mode selection (similar to `aria-pressed` toggle pattern):

```typescript
type FieldMode = 'every' | 'interval' | 'range' | 'specific'

// Mode button styling (reuse FlagToggle pattern):
const modeButtonClass = (active: boolean) =>
  `rounded border px-2 py-1 text-xs font-mono ${
    active
      ? 'border-primary bg-primary/20 text-primary font-bold'
      : 'border-gray-700 bg-transparent text-gray-500'
  }`
```

**Specific mode inputs by field:**

| Field | Specific UI | Values |
|-------|------------|--------|
| Minute | Number input (comma-separated) | 0–59 |
| Hour | Number input (comma-separated) | 0–23 |
| Day of Month | Number input (comma-separated) | 1–31 |
| Month | Clickable buttons: Jan–Dec | 1–12 |
| Day of Week | Clickable buttons: Sun–Sat | 0–6 |

### No New Dependencies

All logic is pure computation + reuse of existing `cron-parser.ts`. No external libraries needed.

### Architecture Compliance

- **Named export only** — `export const CrontabGenerator`
- **Lazy-loaded** — code split via registry
- **100% client-side** — pure computation
- **No debounce** — synchronous field → expression conversion
- **Reuse existing code** — import `parseCron` from `cron-parser.ts`
- **CopyButton** — on generated expression
- **Inline layout** — no dialog needed

### TOOL_REGISTRY Entry

```typescript
{
  category: 'Time',
  component: lazy(() =>
    import('@/components/feature/time/CrontabGenerator').then(
      ({ CrontabGenerator }: { CrontabGenerator: ComponentType }) => ({
        default: CrontabGenerator,
      }),
    ),
  ),
  description: 'Visually build cron expressions with field selectors, human-readable descriptions, and next run times',
  emoji: '🕰️',
  key: 'crontab-generator',
  name: 'Crontab Generator',
  routePath: '/tools/crontab-generator',
  seo: {
    description:
      'Build cron expressions visually by selecting minute, hour, day, month, and weekday values. See human-readable descriptions and next run times.',
    title: 'Crontab Generator - CSR Dev Tools',
  },
}
```

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/utils/crontab.ts` | NEW | buildCronExpression(), describeCron(), getNextRuns(), types |
| `src/utils/crontab.spec.ts` | NEW | Unit tests (~8 tests) |
| `src/components/feature/time/CrontabGenerator.tsx` | NEW | Crontab Generator component |
| `src/types/constants/tool-registry.ts` | MODIFY | Add 'crontab-generator' to ToolRegistryKey |
| `src/constants/tool-registry.ts` | MODIFY | Add registry entry |
| `src/components/feature/time/index.ts` | MODIFY | Add barrel export |
| `src/utils/index.ts` | MODIFY | Add crontab barrel export |
| `vite.config.ts` | MODIFY | Add pre-render route |

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion.md#Story 20.2]
- [Source: src/components/feature/time/CronExpressionParser.tsx] — Inverse tool, reuse parseCron
- [Source: src/utils/cron-parser.ts] — Existing cron parsing logic to reuse for describeCron/getNextRuns
- [Source: src/constants/tool-registry.ts] — Registry entry format
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryKey union

## Dev Agent Record

### Agent Model Used
Claude Opus 4 (via OpenClaw subagent)

### Debug Log References
No issues encountered.

### Completion Notes List
- Created `src/utils/crontab.ts` with `buildCronExpression()`, `describeCron()`, `getNextRuns()`, types `CrontabConfig`, `CronFieldConfig`
- Reuses `parseCron` from existing `cron-parser.ts` for description and next runs
- Created `src/utils/crontab.spec.ts` with 9 tests (all-wildcard, specific, range, interval, mixed, describeCron, getNextRuns valid/invalid)
- Created `src/components/feature/time/CrontabGenerator.tsx` — inline layout, 5 field editors with mode selectors (Every/Specific/Range/Interval), clickable buttons for Month/DOW, CopyButton, description, next 5 runs
- Registered in TOOL_REGISTRY (Time category, 🕰️ emoji, key: crontab-generator)
- Added to ToolRegistryKey union type
- Added barrel exports in time/index.ts and utils/index.ts
- Added pre-render route in vite.config.ts
- All 841 tests pass, typecheck clean

### Change Log
- 2026-02-17: Implemented Crontab Generator tool (Story 20.2) — utility, tests, component, registry, exports

### File List
- `src/utils/crontab.ts` — NEW
- `src/utils/crontab.spec.ts` — NEW
- `src/components/feature/time/CrontabGenerator.tsx` — NEW
- `src/types/constants/tool-registry.ts` — MODIFIED (added crontab-generator key)
- `src/constants/tool-registry.ts` — MODIFIED (added registry entry)
- `src/components/feature/time/index.ts` — MODIFIED (barrel export)
- `src/utils/index.ts` — MODIFIED (barrel export)
- `vite.config.ts` — MODIFIED (pre-render route)

## Senior Developer Review (AI)

**Reviewer:** csrteam (backfill review)
**Date:** 2026-02-20
**Verdict:** Done (all issues fixed)

### Findings Fixed

| Severity | Finding | Fix Applied |
|----------|---------|-------------|
| HIGH | `config.values.sort()` mutates the input array in-place | Changed to `[...config.values].sort()` to avoid mutation |
| MEDIUM | Range mode accepts `rangeStart > rangeEnd` producing invalid cron | Added `rangeStart <= rangeEnd` guard, falls back to `*` |
