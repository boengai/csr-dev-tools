---
story: 13.2
title: TOML to JSON Converter
status: done
epic: 13
---

# Story 13.2: TOML ↔ JSON Converter

## Story

As a **user**,
I want **to convert between TOML and JSON formats**,
So that **I can work with Rust/Go config files and transform them to JSON and back**.

**Epic:** Epic 13 — Data & Number Converters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 13-2-toml-to-json-converter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the TOML to JSON Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders with card buttons for both conversion directions

### AC2: TOML to JSON Conversion

**Given** tabs for TOML→JSON and JSON→TOML modes
**When** the user pastes valid TOML
**Then** formatted JSON appears in real-time

### AC3: JSON to TOML Conversion

**Given** JSON→TOML mode
**When** the user pastes valid JSON
**Then** TOML output appears

### AC4: Error Handling

**Given** invalid input
**When** parsing fails
**Then** an inline toast error describes the issue

### AC5: Unit Tests

**Given** unit tests in `src/utils/toml.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple TOML→JSON, nested tables, JSON→TOML, invalid input, parse error detection, round-trip

## Tasks / Subtasks

- [x] Task 1: Create TOML conversion utilities (AC: #2, #3, #4, #5)
  - [x] 1.1 Create `src/utils/toml.ts` with `tomlToJson()`, `jsonToToml()`, `getTomlParseError()`
  - [x] 1.2 Use `smol-toml` library (lazy-loaded via dynamic import)
  - [x] 1.3 Implement async parse error detection

- [x] Task 2: Write unit tests (AC: #5)
  - [x] 2.1 Create `src/utils/toml.spec.ts`
  - [x] 2.2 Test simple TOML→JSON (key-value pairs)
  - [x] 2.3 Test nested TOML tables
  - [x] 2.4 Test empty input throws
  - [x] 2.5 Test invalid TOML throws
  - [x] 2.6 Test JSON→TOML conversion
  - [x] 2.7 Test invalid JSON throws
  - [x] 2.8 Test `getTomlParseError` for valid/invalid/empty input
  - [x] 2.9 Test JSON→TOML→JSON round-trip consistency

- [x] Task 3: Create TomlToJsonConverter component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create `src/components/feature/data/TomlToJsonConverter.tsx` as named export
  - [x] 3.2 Two card buttons: "TOML → JSON" and "JSON → TOML"
  - [x] 3.3 Dialog with split panels, debounced processing, sessionRef for stale prevention
  - [x] 3.4 Context-aware error messages (TOML parse errors vs JSON errors)

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'toml-to-json-converter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/data/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Previous Story Intelligence

From Story 13.1 (XML to JSON Converter):
- Bidirectional converter pattern established with two card buttons
- `sessionRef` stale prevention pattern carried forward
- Async lazy-loaded library pattern same structure

### Architecture Pattern

Identical bidirectional converter pattern as XML↔JSON. Uses `smol-toml` (lightweight TOML parser) instead of `fast-xml-parser`.

### Key Implementation Details

- `smol-toml` lazy-loaded via `await import('smol-toml')` — `parse()` and `stringify()` functions
- `getTomlParseError()` is also async (needs to import the library to attempt parsing)
- TOML→JSON error path: calls `getTomlParseError()` for detailed error, then uses that in toast
- JSON→TOML error path: generic "Invalid JSON" message
- `sessionRef` prevents stale results across rapid async operations

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/toml.ts` | `tomlToJson()`, `jsonToToml()`, `getTomlParseError()` |
| `src/utils/toml.spec.ts` | 9 unit tests |
| `src/components/feature/data/TomlToJsonConverter.tsx` | Component (145 lines) |

## Dev Agent Record

### Completion Notes List

- Created async TOML/JSON conversion utilities with lazy-loaded `smol-toml`
- TomlToJsonConverter component mirrors XML converter pattern
- 9 unit tests covering conversions, error detection, and round-trip consistency

### File List

| File | Action |
|------|--------|
| `src/utils/toml.ts` | NEW |
| `src/utils/toml.spec.ts` | NEW |
| `src/components/feature/data/TomlToJsonConverter.tsx` | NEW |
| `src/components/feature/data/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |
