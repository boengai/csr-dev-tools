---
story: 22.1
title: YAML Formatter/Validator
status: done
epic: 22
---

# Story 22.1: YAML Formatter/Validator

Status: done

## Story

As a **developer**,
I want **to paste YAML and see it formatted with proper indentation, with validation errors highlighted**,
So that **I can clean up and validate YAML configuration files quickly**.

**Epic:** Epic 22 — Data Format Tools
**Dependencies:** `yaml` package v2.8.2 (already installed)
**Story Key:** 22-1-yaml-formatter

## Acceptance Criteria

### AC1: Tool Registered and Renders
**Given** the YAML Formatter tool is registered in TOOL_REGISTRY under the Data category
**When** the user navigates to it
**Then** it renders with a button to open the dialog and a description from the registry entry

### AC2: Format Valid YAML
**Given** the user pastes valid YAML in the dialog
**When** the value is entered
**Then** formatted YAML appears in real-time (debounced 300ms) with configurable indent (2/4 spaces)

### AC3: Validation Error Display
**Given** the user pastes invalid YAML
**When** the value is entered
**Then** a toast error shows the line number and nature of the syntax error

### AC4: Copy Output
**Given** formatted YAML output
**When** the user clicks CopyButton
**Then** the formatted output is copied to clipboard

### AC5: Sort Keys Option
**Given** the user enables Sort Keys toggle
**When** YAML is entered
**Then** all object keys are sorted alphabetically in the output

## Tasks / Subtasks

- [x] Task 1: Add yaml-formatter to ToolRegistryKey type union in src/types/constants/tool-registry.ts
- [x] Task 2: Add registry entry in src/constants/tool-registry.ts
- [x] Task 3: Create src/utils/yaml.ts with formatYaml and getYamlParseError
- [x] Task 4: Create src/utils/yaml.spec.ts with unit tests
- [x] Task 5: Create src/components/feature/data/YamlFormatter.tsx following JsonFormatter pattern
- [x] Task 6: Add barrel export in src/components/feature/data/index.ts
- [x] Task 7: Create e2e/yaml-formatter.spec.ts

## Dev Notes

- Follow JsonFormatter.tsx pattern exactly: Dialog-based, dual textarea, debounced processing
- Use yaml package v2 API: import { parse, stringify } from 'yaml'
- Component accepts ToolComponentProps ({ autoOpen, onAfterDialogClose })
- Indent selector (2/4 spaces) and Sort Keys checkbox toggle
- CopyButton on output, useToast for errors
- Named exports only, no semicolons, single quotes, trailing commas
- import type for type-only imports, @/ path aliases
- Custom breakpoints: tablet: not md:
- Array<T> not T[], type not interface

### Registry Entry

category: Data, emoji: 📋, key: yaml-formatter, name: YAML Formatter, routePath: /tools/yaml-formatter

## Dev Agent Record

### Agent Model Used
claude-opus-4-6 (direct implementation)

### Completion Notes List
- Story file was not updated by original dev agent — backfilled during Epic 22 code review

### Change Log
- 2026-02-20: Code review backfill — story status corrected to done, dev agent record populated

### File List
- src/utils/yaml.ts
- src/utils/yaml.spec.ts
- src/components/feature/data/YamlFormatter.tsx
- src/components/feature/data/index.ts
- src/types/constants/tool-registry.ts
- src/constants/tool-registry.ts
- e2e/yaml-formatter.spec.ts
