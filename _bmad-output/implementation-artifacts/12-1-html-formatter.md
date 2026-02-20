---
story: 12.1
title: HTML Formatter/Beautifier
status: done
epic: 12
---

# Story 12.1: HTML Formatter/Beautifier

## Tool Metadata
- **Key:** `html-formatter`
- **Name:** HTML Formatter
- **Category:** Code (NEW category)
- **Emoji:** 📄
- **Route:** `/tools/html-formatter`
- **SEO Title:** HTML Formatter - CSR Dev Tools
- **SEO Description:** Format, beautify, and minify HTML online. Clean up messy HTML with proper indentation — free browser-based tool.

## Implementation Checklist
1. Add `'Code'` to `ToolCategory` union in `src/types/constants/tool-registry.ts`
2. Add `'html-formatter'` to `ToolRegistryKey` union
3. Create `src/components/feature/code/` directory
4. Create `src/components/feature/code/HtmlFormatter.tsx`
5. Create `src/components/feature/code/index.ts` barrel export
6. Add `export * from './code'` to `src/components/feature/index.ts`
7. Add registry entry to `src/constants/tool-registry.ts`
8. Install `js-beautify` as dependency
9. Create unit tests
10. Create E2E test `e2e/html-formatter.spec.ts`

## Component Pattern
Follow existing tool patterns (e.g., RegexTester, JsonFormatter).

## Senior Developer Review (AI)
**Reviewer:** csrteam | **Date:** 2026-02-20 | **Status:** Approved with fixes applied

### Findings & Fixes Applied
| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| H1 | HIGH | `minifyHtml` destroyed whitespace in `<pre>`, `<script>`, `<style>`, `<code>` blocks | Fixed — blocks now preserved via placeholder extraction before minification |
| M1 | MEDIUM | `minifyHtml` removes whitespace between inline elements (`><`) | Accepted — consistent with standard HTML minifier behavior |
| M2 | MEDIUM | E2E test only covered beautify mode | Fixed — added minify mode E2E test |
| L1 | LOW | Unit tests missing edge cases | Fixed — added 6 tests (pre/script/style/code preservation, self-closing tags, attributes) |
| L2 | LOW | E2E test not in dedicated file per story spec | Accepted — consolidated in `code-tools-extended.spec.ts` per project convention |

### Files Modified During Review
- `src/utils/html-format.ts` — Fixed minifyHtml to preserve whitespace-sensitive blocks
- `src/utils/html-format.spec.ts` — Added 6 edge case tests
- `e2e/code-tools-extended.spec.ts` — Added minify mode E2E test

### Change Log
- 2026-02-20: Code review backfill — 1 HIGH + 1 MEDIUM fixed, 1 MEDIUM accepted, 2 LOW (1 fixed, 1 accepted)
