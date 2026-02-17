---
story: 12.1
title: HTML Formatter/Beautifier
status: ready
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
