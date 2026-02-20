---
story: 13.1
title: XML to JSON Converter
status: done
epic: 13
---

# Story 13.1: XML ↔ JSON Converter

## Story

As a **user**,
I want **to convert between XML and JSON formats**,
So that **I can transform data between these common formats for APIs and configuration files**.

**Epic:** Epic 13 — Data & Number Converters
**Dependencies:** Epic 1 (TOOL_REGISTRY), Epic 2 (CopyButton, FieldForm)
**Story Key:** 13-1-xml-to-json-converter

## Acceptance Criteria

### AC1: Tool Registered and Accessible

**Given** the XML to JSON Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders with card buttons for both conversion directions

### AC2: XML to JSON Conversion

**Given** tabs for XML→JSON and JSON→XML modes
**When** the user pastes valid XML in XML→JSON mode
**Then** the JSON equivalent appears in real-time (debounced 300ms)

### AC3: JSON to XML Conversion

**Given** JSON→XML mode
**When** the user pastes valid JSON
**Then** formatted XML output appears

### AC4: Error Handling

**Given** invalid input in either mode
**When** parsing fails
**Then** an inline toast error describes the issue

### AC5: Copy Result

**Given** the converted output
**When** the user clicks `CopyButton`
**Then** the result is copied to clipboard

### AC6: Unit Tests

**Given** unit tests in `src/utils/xml.spec.ts`
**When** `pnpm test` runs
**Then** tests cover: simple XML→JSON, attributes, JSON→XML, empty input, invalid JSON, round-trip consistency

## Tasks / Subtasks

- [x] Task 1: Create XML conversion utilities (AC: #2, #3, #4, #6)
  - [x] 1.1 Create `src/utils/xml.ts` with `xmlToJson()`, `jsonToXml()`, `getXmlParseError()`
  - [x] 1.2 Use `fast-xml-parser` library (lazy-loaded via dynamic import)
  - [x] 1.3 Configure attribute prefix `@_` for XML attributes
  - [x] 1.4 Use `fast-xml-parser` `XMLValidator` for XML validation in `getXmlParseError()`

- [x] Task 2: Write unit tests (AC: #6)
  - [x] 2.1 Create `src/utils/xml.spec.ts`
  - [x] 2.2 Test simple XML→JSON conversion
  - [x] 2.3 Test XML attributes handling (`@_id`)
  - [x] 2.4 Test empty input throws
  - [x] 2.5 Test JSON→XML conversion
  - [x] 2.6 Test invalid JSON throws
  - [x] 2.7 Test round-trip consistency (XML→JSON→XML)

- [x] Task 3: Create XmlToJsonConverter component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/data/XmlToJsonConverter.tsx` as named export
  - [x] 3.2 Two card buttons: "XML → JSON" and "JSON → XML" opening dialog in respective modes
  - [x] 3.3 Dialog with split panels (source/result)
  - [x] 3.4 Use `useDebounceCallback` with 300ms delay and `sessionRef` for stale prevention
  - [x] 3.5 Show context-aware error messages (XML parse errors vs generic JSON errors)

- [x] Task 4: Register tool and update exports (AC: #1)
  - [x] 4.1 Add `'xml-to-json-converter'` to `ToolRegistryKey` union
  - [x] 4.2 Add registry entry to `TOOL_REGISTRY`
  - [x] 4.3 Add export to `src/components/feature/data/index.ts`
  - [x] 4.4 Add barrel export to `src/utils/index.ts`

## Dev Notes

### Architecture Pattern

Uses the **bidirectional converter pattern** — two card buttons open the same dialog in different modes. Conversion functions are async (lazy-loaded library) with `sessionRef` for stale result prevention.

### Key Implementation Details

- `fast-xml-parser` is lazy-loaded via `await import('fast-xml-parser')` inside the conversion functions
- `XMLParser` configured with `ignoreAttributes: false` and `attributeNamePrefix: '@_'`
- `XMLBuilder` uses same attribute config for consistent round-trips
- `getXmlParseError()` uses `fast-xml-parser` `XMLValidator` for strict XML validation (testable in node)
- `sessionRef` pattern prevents displaying stale results when user types rapidly
- Error messages differentiate between XML parse errors (with detail) and JSON errors

### File Locations

| File | Purpose |
|------|---------|
| `src/utils/xml.ts` | `xmlToJson()`, `jsonToXml()`, `getXmlParseError()` |
| `src/utils/xml.spec.ts` | 12 unit tests |
| `src/components/feature/data/XmlToJsonConverter.tsx` | Component (141 lines) |

## Dev Agent Record

### Completion Notes List

- Created async XML/JSON conversion utilities with lazy-loaded `fast-xml-parser`
- XmlToJsonConverter component with bidirectional mode, stale result prevention
- 7 unit tests covering conversions, error cases, and round-trip consistency

### File List

| File | Action |
|------|--------|
| `src/utils/xml.ts` | NEW |
| `src/utils/xml.spec.ts` | NEW |
| `src/components/feature/data/XmlToJsonConverter.tsx` | NEW |
| `src/components/feature/data/index.ts` | MODIFIED |
| `src/utils/index.ts` | MODIFIED |
| `src/types/constants/tool-registry.ts` | MODIFIED |
| `src/constants/tool-registry.ts` | MODIFIED |
| `vite.config.ts` | MODIFIED |

### Senior Developer Review (AI)

**Reviewer:** boengai | **Date:** 2026-02-20

**Findings Fixed:**
- **H1:** `getXmlParseError` refactored from browser-only `DOMParser` to `fast-xml-parser` `XMLValidator` — now async, testable in node, with 4 new tests added
- **M1:** Resolved by H1 — no longer depends on browser-only API
- **M3:** Story test count corrected from 7 to 12
- **L2:** Validate-after-fail pattern acknowledged (no code change — works as designed)

**Files Changed in Review:**
| File | Action |
|------|--------|
| `src/utils/xml.ts` | MODIFIED (getXmlParseError async + XMLValidator) |
| `src/utils/xml.spec.ts` | MODIFIED (+4 getXmlParseError tests) |
| `src/components/feature/data/XmlToJsonConverter.tsx` | MODIFIED (dynamic import for getXmlParseError) |
