---
story: 16.2
title: Word/Character Counter
status: done
epic: 16
---

# Story 16.2: Word/Character Counter

## Story

As a **user**,
I want **to paste text and see word count, character count, sentence count, paragraph count, and estimated reading time**,
So that **I can check text length for various requirements (tweets, blog posts, essays)**.

**Epic:** Epic 16 — Text Utilities
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (FieldForm, Button)
**Story Key:** 16-2-word-counter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the Word Counter tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: Real-Time Statistics

**Given** the user enters text
**When** content changes
**Then** stats update in real-time: characters (with/without spaces), words, sentences, paragraphs, lines, reading time (200 wpm), speaking time (130 wpm)

### AC3: Grid Layout

**Given** the stats display
**When** rendered
**Then** stats are shown in a clean 2-column grid of stat cards

### AC4: Empty State

**Given** empty input
**When** nothing is entered
**Then** all stats show 0

### AC5: Unit Tests

**Given** unit tests in `src/utils/word-counter.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: empty input, characters, words, sentences, paragraphs, lines, reading time, whitespace-only

## Tasks / Subtasks

- [x] Task 1: Create word counting utility (AC: #2, #4, #5)
  - [x] 1.1 Create `src/utils/word-counter.ts` with `countTextStats()`
  - [x] 1.2 Define `TextStats` type with all stat fields
  - [x] 1.3 Implement `formatTime()` helper for reading/speaking time
  - [x] 1.4 Calculate: characters, characters without spaces, words, sentences (period/!/? splitting), paragraphs (double newline), lines (newline), reading time (200 wpm), speaking time (130 wpm)

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/word-counter.spec.ts`
  - [x] 2.2 Test empty string returns all zeros
  - [x] 2.3 Test character count (with and without spaces)
  - [x] 2.4 Test word count
  - [x] 2.5 Test sentence count
  - [x] 2.6 Test paragraph count
  - [x] 2.7 Test line count
  - [x] 2.8 Test reading time calculation (400 words → "2 min")
  - [x] 2.9 Test whitespace-only input

- [x] Task 3: Create WordCounter component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/components/feature/text/WordCounter.tsx` as named export
  - [x] 3.2 Dialog-based layout with text input on left, stats grid on right
  - [x] 3.3 Stats displayed in 2-column grid (`grid grid-cols-2 gap-3`)
  - [x] 3.4 Each stat in a card with label (gray-500) and value (gray-200, font-semibold)
  - [x] 3.5 Use `useDebounceCallback` with 300ms delay
  - [x] 3.6 `EMPTY_STATS` constant for default/empty state
  - [x] 3.7 `STAT_LABELS` array maps keys to display labels

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'word-counter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/text/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 16.1 (Text Case Converter):
- Text category and barrel exports established
- Dialog-based layout pattern confirmed for text tools

### Architecture Pattern

**Dialog-based stats display** — input on left, 2-column grid of stat cards on right. No copy functionality needed (stats are numerical).

### Key Implementation Details

- No external library — pure JavaScript text analysis
- `countTextStats()` returns `TextStats` object with all 8 metrics
- Reading time: `Math.ceil(wordCount / 200)` minutes
- Speaking time: `Math.ceil(wordCount / 130)` minutes
- `formatTime()`: returns `"0 min"` for 0, `"< 1 min"` for fractional, `"{n} min"` otherwise
- Sentence detection: split on `.`, `!`, `?` and filter non-empty
- Paragraph detection: split on `\n\n` and filter non-empty
- `EMPTY_STATS` constant used for initialization and empty input reset

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/word-counter.ts` | `countTextStats()`, `TextStats` type, `formatTime()` |
| `src/utils/word-counter.spec.ts` | 8 unit tests |
| `src/components/feature/text/WordCounter.tsx` | Component (103 lines) |

## Dev Agent Record

### Completion Notes List

- Created text statistics utility with 8 metrics including reading/speaking time
- WordCounter component with stat card grid display
- 8 unit tests covering all stats and edge cases

### File List

| File | Action |
|------|--------|
| `src/utils/word-counter.ts` | NEW |
| `src/utils/word-counter.spec.ts` | NEW |
| `src/components/feature/text/WordCounter.tsx` | NEW |
| `src/components/feature/text/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Code review (backfill): fixed AC4 — empty input now shows `0 min` for readingTime/speakingTime; added missing test assertions |

### Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20 | **Status:** Approved

**Findings Fixed:**
- [M1] `formatTime(0)` now returns `'0 min'` instead of `'< 1 min'` — satisfies AC4 "all stats show 0"
- [M1] `EMPTY_STATS` in WordCounter component updated to `'0 min'` for readingTime/speakingTime
- [M2] Empty-string test now verifies `readingTime` and `speakingTime` values

**Notes:**
- All 8 stats compute correctly for non-empty input
- Grid layout confirmed as `grid grid-cols-2 gap-3`
- Debounce at 300ms working as specified
