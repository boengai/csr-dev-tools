---
story: 13.3
title: HTML to Markdown Converter
status: done
epic: 13
---

# Story 13.3: HTML ↔ Markdown Converter

## Story

As a **user**,
I want **to convert HTML to Markdown and Markdown to HTML**,
So that **I can transform content between these formats for documentation and web publishing**.

**Epic:** Epic 13 — Data & Number Converters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 13-3-html-to-markdown-converter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the HTML to Markdown Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders with card buttons for both conversion directions

### AC2: HTML to Markdown

**Given** tabs for HTML→Markdown and Markdown→HTML modes
**When** the user pastes valid HTML
**Then** Markdown equivalent appears in real-time

### AC3: Markdown to HTML

**Given** Markdown→HTML mode
**When** Markdown is entered
**Then** HTML output appears

### AC4: Element Support

**Given** complex HTML (tables, images, links)
**When** converted to Markdown
**Then** GFM table syntax and standard markdown elements are used

### AC5: Unit Tests

**Given** unit tests in `src/utils/html-markdown.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: headings, bold/italic, links, empty input for both directions

## Tasks / Subtasks

- [x] Task 1: Create HTML↔Markdown conversion utilities (AC: #2, #3, #4, #5)
  - [x] 1.1 Create `src/utils/html-markdown.ts` with `htmlToMarkdown()` and `markdownToHtml()`
  - [x] 1.2 Use `turndown` library (lazy-loaded) for HTML→Markdown with ATX headings and fenced code blocks
  - [x] 1.3 Use `marked` library (lazy-loaded) for Markdown→HTML

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/html-markdown.spec.ts`
  - [x] 2.2 Test HTML→Markdown: headings, bold/italic, links
  - [x] 2.3 Test Markdown→HTML: headings, bold/italic, links
  - [x] 2.4 Test empty input throws for both directions

- [x] Task 3: Create HtmlToMarkdownConverter component (AC: #1, #2, #3)
  - [x] 3.1 Create `src/components/feature/data/HtmlToMarkdownConverter.tsx` as named export
  - [x] 3.2 Two card buttons: "HTML → Markdown" and "Markdown → HTML"
  - [x] 3.3 Dialog with split panels, debounced processing, sessionRef for stale prevention
  - [x] 3.4 Generic error toast on conversion failure

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'html-to-markdown-converter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/data/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 13.2 (TOML to JSON Converter):
- Bidirectional converter pattern mature — third use in this epic
- `sessionRef` stale prevention standard across all converters

### Architecture Pattern

Same bidirectional converter pattern. Uses two different libraries for each direction — `turndown` (HTML→MD) and `marked` (MD→HTML), both lazy-loaded.

### Key Implementation Details

- `turndown` configured with `headingStyle: 'atx'`, `codeBlockStyle: 'fenced'`, and `turndown-plugin-gfm` for GFM table support
- `turndown` import uses `.default` pattern: `(await import('turndown')).default`
- `marked` used for MD→HTML (same library as Story 12.5 but lazy-loaded here)
- Error handling is simpler than XML/TOML — generic "Conversion failed" message (no parse error detail)

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/html-markdown.ts` | `htmlToMarkdown()`, `markdownToHtml()` |
| `src/utils/html-markdown.spec.ts` | 13 unit tests |
| `src/components/feature/data/HtmlToMarkdownConverter.tsx` | Component (132 lines) |

## Dev Agent Record

### Completion Notes List

- Created async HTML↔Markdown conversion utilities with lazy-loaded `turndown` and `marked`
- HtmlToMarkdownConverter component following established bidirectional pattern
- 8 unit tests covering both conversion directions

### File List

| File | Action |
|------|--------|
| `src/utils/html-markdown.ts` | NEW |
| `src/utils/html-markdown.spec.ts` | NEW |
| `src/components/feature/data/HtmlToMarkdownConverter.tsx` | NEW |
| `src/components/feature/data/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20

**Findings Fixed:**
- **H2:** Added `turndown-plugin-gfm` dependency and registered GFM plugin — HTML tables now convert to Markdown tables
- **H3:** Added 3 XSS sanitization tests (script tags, event handlers, javascript: URIs)
- **M2:** Extended sanitization regexes to cover `<iframe>`, `<embed>`, `<object>`, `<svg>` tags and `data:` URIs; added defensive comment
- **M3:** Story test count corrected from 8 to 13
- **L1:** Added tests for image and table conversion (AC4 coverage)

**Files Changed in Review:**
| File | Action |
|------|--------|
| `src/utils/html-markdown.ts` | MODIFIED (GFM plugin + extended sanitization) |
| `src/utils/html-markdown.spec.ts` | MODIFIED (+5 tests: images, tables, XSS) |
| `src/vite-env.d.ts` | MODIFIED (turndown-plugin-gfm type declaration) |
| `package.json` | MODIFIED (+turndown-plugin-gfm dependency) |
