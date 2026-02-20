---
story: 22.4
title: HTML Entity Converter
status: done
epic: 22
---

# Story 22.4: HTML Entity Converter

Status: done

## Story

As a **developer**,
I want **to encode text into HTML entities and decode HTML entities back to text**,
So that **I can safely handle special characters in HTML content**.

## Tasks

- [x] Task 1: Add html-entity-converter to ToolRegistryKey
- [x] Task 2: Add registry entry (Data, emoji 🏷️)
- [x] Task 3: Create src/utils/html-entity.ts
- [x] Task 4: Create src/utils/html-entity.spec.ts
- [x] Task 5: Create src/components/feature/data/HtmlEntityConverter.tsx
- [x] Task 6: Add barrel export
- [x] Task 7: Create e2e/html-entity-converter.spec.ts

## Dev Agent Record

### Agent Model Used
claude-opus-4-6 (direct implementation)

### Change Log
- 2026-02-20: Code review fixes — replaced charCodeAt(0) with codePointAt(0) for proper emoji encoding, removed dead code branch in encodeHtmlEntities

### File List
- src/utils/html-entity.ts
- src/utils/html-entity.spec.ts
- src/components/feature/data/HtmlEntityConverter.tsx
- src/components/feature/data/index.ts
- src/types/constants/tool-registry.ts
- src/constants/tool-registry.ts
- e2e/html-entity-converter.spec.ts
