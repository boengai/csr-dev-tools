---
story: 18.5
title: Text Sort & Dedupe
status: done
epic: 18
---

# Story 18.5: Text Sort & Dedupe

## Tool Metadata
- **Key:** `text-sort-dedupe`
- **Name:** Text Sort & Dedupe
- **Category:** Text
- **Emoji:** 🔀
- **Route:** `/tools/text-sort-dedupe`
- **SEO Title:** Text Sort & Dedupe - CSR Dev Tools
- **SEO Description:** Sort lines alphabetically, numerically, or by length. Remove duplicates, empty lines, and trim whitespace.

## Acceptance Criteria

**Given** the user enters text with multiple lines
**When** a sort mode is selected (A-Z, Z-A, length asc/desc, numeric)
**Then** the lines are sorted accordingly in real-time (debounced 300ms)

**Given** the user enables "Dedupe"
**When** toggled on
**Then** duplicate lines are removed from the output

**Given** the user enables "No Empty"
**When** toggled on
**Then** empty/blank lines are removed from the output

**Given** the user enables "Trim"
**When** toggled on
**Then** leading/trailing whitespace is removed from each line

**Given** processing completes
**When** results are displayed
**Then** line count before and after is shown (e.g. "10 → 7 lines")

**Given** numeric sort with mixed content
**When** processed
**Then** numeric lines sort by value; non-numeric lines sort alphabetically at the end

## Previous Story Intelligence (from 18.1–18.4)
- Inline tools work well for text input→output patterns
- Toggle buttons with active state highlighting (`border-primary bg-primary/20 text-primary`) for boolean options
- Show before/after metrics for data reduction tools

## Implementation Checklist
1. [x] Create `src/utils/text-sort.ts` with `sortAndProcessText()`, `TextSortOptions`, `TextSortResult`
2. [x] Create `src/utils/text-sort.spec.ts` — 10 tests
3. [x] Create `src/components/feature/text/TextSortDedupe.tsx` — inline with toggles
4. [x] Register in `TOOL_REGISTRY`
5. [x] Add `'text-sort-dedupe'` to `ToolRegistryKey` union
6. [x] Export from `src/utils/index.ts`

## File List
| File | Action |
|------|--------|
| `src/utils/text-sort.ts` | NEW |
| `src/utils/text-sort.spec.ts` | NEW |
| `src/components/feature/text/TextSortDedupe.tsx` | NEW |
| `src/constants/tool-registry.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |

## Unit Tests
- 10 tests, all passing
- Covers: A-Z sort, Z-A sort, length asc/desc, numeric sort, deduplication, empty line removal, trim, line counts, numeric with mixed content
