---
story: 22.2
title: ENV File Converter
status: done
epic: 22
---

# Story 22.2: ENV File Converter

Status: done

## Story

As a **developer**,
I want **to convert between .env format and JSON/YAML formats**,
So that **I can quickly transform configuration between different file formats**.

**Story Key:** 22-2-env-file-converter

## Acceptance Criteria

### AC1: .env to JSON
**Given** the user pastes a .env file (KEY=value format)
**When** the user selects To JSON output format
**Then** a JSON object is generated with keys and values, handling quoted values and comments

### AC2: .env to YAML
**Given** the user pastes a .env file
**When** the user selects To YAML output format
**Then** equivalent YAML is generated

### AC3: JSON/YAML to .env
**Given** the user pastes JSON or YAML
**When** the user selects To .env output format
**Then** a .env file is generated with KEY=value pairs, quoting values with spaces/special chars

### AC4: Comments Stripped
**Given** the .env input contains comments (lines starting with #)
**When** converted to JSON/YAML
**Then** comments are stripped

### AC5: Malformed Lines
**Given** the .env input contains empty lines or malformed lines
**When** converted
**Then** empty lines are skipped and malformed lines show a warning

## Tasks / Subtasks

- [x] Task 1: Add env-file-converter to ToolRegistryKey type union
- [x] Task 2: Add registry entry in tool-registry.ts (Data category, emoji 🔄)
- [x] Task 3: Create src/utils/env.ts with conversion functions
- [x] Task 4: Create src/utils/env.spec.ts with unit tests
- [x] Task 5: Create src/components/feature/data/EnvFileConverter.tsx
- [x] Task 6: Add barrel export in data/index.ts
- [x] Task 7: Create e2e/env-file-converter.spec.ts

## Dev Notes

- Follow JsonToYamlConverter pattern (format selector dropdown)
- Three output modes: JSON, YAML, .env
- Auto-detect input format from content
- Use yaml package for YAML conversion
- Named exports, no semicolons, single quotes, trailing commas

## Dev Agent Record

### Agent Model Used
claude-opus-4-6 (direct implementation)

### Completion Notes List
- Story file was not updated by original dev agent — backfilled during Epic 22 code review
- Code review found and fixed: nested value handling (H1), quote escaping (H2) in jsonToEnv/yamlToEnv

### Change Log
- 2026-02-20: Code review backfill — story status corrected to done, tasks marked complete, dev agent record populated
- 2026-02-20: Code review fixes — nested value rejection, inner quote escaping in env.ts

### File List
- src/utils/env.ts
- src/utils/env.spec.ts
- src/components/feature/data/EnvFileConverter.tsx
- src/components/feature/data/index.ts
- src/types/constants/tool-registry.ts
- src/constants/tool-registry.ts
- e2e/env-file-converter.spec.ts
