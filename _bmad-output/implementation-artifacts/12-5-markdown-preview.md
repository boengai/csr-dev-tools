---
story: 12.5
title: Markdown Preview
status: done
epic: 12
---

# Story 12.5: Markdown Preview

## Story

As a **user**,
I want **to write Markdown and see a live HTML preview side-by-side**,
So that **I can author READMEs and docs with instant feedback**.

**Epic:** Epic 12 — Code & Markup Formatters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 12-5-markdown-preview

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the Markdown Preview tool registered in `TOOL_REGISTRY` under the Code category
**When** the user navigates to it
**Then** it renders with a card button to open the full-screen dialog

### AC2: Live HTML Preview

**Given** the user types Markdown in the left panel
**When** content changes
**Then** rendered HTML preview appears in the right panel in real-time (debounced 300ms)

### AC3: Markdown Element Support

**Given** the preview panel
**When** it renders
**Then** it supports: headings, bold/italic, links, images, code blocks, tables, lists, blockquotes, horizontal rules

### AC4: Copy HTML Source

**Given** a "Copy HTML" button
**When** clicked
**Then** the rendered HTML source is copied to clipboard

### AC5: XSS Prevention

**Given** markdown containing script tags or event handlers
**When** rendered
**Then** dangerous elements are sanitized (scripts, iframes, event handlers removed)

### AC6: Unit Tests

**Given** unit tests in `src/utils/markdown.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: headings, bold, links, script tag stripping, event handler stripping, empty input

## Tasks / Subtasks

- [x] Task 1: Create Markdown rendering utility (AC: #2, #3, #5, #6)
  - [x] 1.1 Create `src/utils/markdown.ts` with `renderMarkdown()`
  - [x] 1.2 Import `marked` library for markdown parsing
  - [x] 1.3 Implement `sanitizeHtml()` to strip scripts, iframes, event handlers, objects, embeds
  - [x] 1.4 Use synchronous parsing (`{ async: false }`)

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/markdown.spec.ts`
  - [x] 2.2 Test heading rendering (`# Hello` → `<h1>`)
  - [x] 2.3 Test bold text rendering (`**bold**` → `<strong>`)
  - [x] 2.4 Test link rendering
  - [x] 2.5 Test script tag stripping (XSS prevention)
  - [x] 2.6 Test event handler stripping
  - [x] 2.7 Test empty/whitespace input returns empty string

- [x] Task 3: Create MarkdownPreview component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/components/feature/code/MarkdownPreview.tsx` as named export
  - [x] 3.2 Implement dialog-based layout with source/preview split panels
  - [x] 3.3 Use `dangerouslySetInnerHTML` for preview with `prose prose-invert` styling
  - [x] 3.4 Use `useDebounceCallback` with 300ms delay
  - [x] 3.5 Show CopyButton for HTML source output

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'markdown-preview'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/code/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 12.4 (SQL Formatter):
- Dialog-based pattern final iteration in this epic
- Code category barrel fully populated after this story

### Architecture Pattern

Unique among Epic 12 tools — uses **rendered HTML preview** instead of formatted text output. Preview uses Tailwind `prose prose-invert` classes for styled rendering. HTML is injected via `dangerouslySetInnerHTML` after sanitization.

### Key Implementation Details

- `renderMarkdown()` uses `marked.parse()` with `{ async: false }` for synchronous rendering
- `sanitizeHtml()` strips: `<script>`, `<iframe>`, `<object>`, `<embed>`, and `on*` event handler attributes
- Preview panel has `min-h-[300px]` and `overflow-auto` for long content
- No mode toggle — always renders preview
- Simpler than other formatters (93 lines vs 150+) — no mode/indent options

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/markdown.ts` | `renderMarkdown()`, `sanitizeHtml()` |
| `src/utils/markdown.spec.ts` | 6 unit tests |
| `src/components/feature/code/MarkdownPreview.tsx` | Component (93 lines) |

## Dev Agent Record

### Completion Notes List

- Created `renderMarkdown` utility with built-in XSS sanitization using `marked` library
- MarkdownPreview component with live rendered HTML preview using prose styling
- 6 unit tests covering rendering elements and XSS prevention

### File List

| File | Action |
|------|--------|
| `src/utils/markdown.ts` | NEW |
| `src/utils/markdown.spec.ts` | NEW |
| `src/components/feature/code/MarkdownPreview.tsx` | NEW |
| `src/components/feature/code/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
