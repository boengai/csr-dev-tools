---
story: 22.3
title: Escaped JSON Stringifier
status: done
epic: 22
---

# Story 22.3: Escaped JSON Stringifier

Status: done

## Story

As a **developer**,
I want **to escape JSON for embedding in strings and unescape them back**,
So that **I can safely embed JSON in contexts that require string escaping**.

## Tasks

- [x] Task 1: Add escaped-json-stringifier to ToolRegistryKey
- [x] Task 2: Add registry entry (Data, emoji 🔤)
- [x] Task 3: Create src/utils/escaped-json.ts
- [x] Task 4: Create src/utils/escaped-json.spec.ts
- [x] Task 5: Create src/components/feature/data/EscapedJsonStringifier.tsx
- [x] Task 6: Add barrel export
- [x] Task 7: Create e2e/escaped-json-stringifier.spec.ts

## Dev Agent Record

### Agent Model Used
claude-opus-4-6 (direct implementation)

### File List
- src/utils/escaped-json.ts
- src/utils/escaped-json.spec.ts
- src/components/feature/data/EscapedJsonStringifier.tsx
- src/components/feature/data/index.ts
- src/types/constants/tool-registry.ts
- src/constants/tool-registry.ts
- e2e/escaped-json-stringifier.spec.ts
