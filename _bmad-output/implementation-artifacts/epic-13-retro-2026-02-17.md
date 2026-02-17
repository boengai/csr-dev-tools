# Epic 13 Retrospective: Data & Number Converters

**Date:** 2026-02-17
**Epic Status:** Done (backfill retro — all stories completed before this document was created)

## Epic Summary & Metrics

**Delivery:**

- Stories completed: 4/4 (100%)
- Story 13-1: XML↔JSON Converter — done
- Story 13-2: TOML↔JSON Converter — done
- Story 13-3: HTML↔Markdown Converter — done
- Story 13-4: Number Base Converter — done
- Production incidents: 0

**Quality:**

- Tests: 40 new tests across 4 spec files (xml: 8, toml: 11, html-markdown: 8, number-base: 13)
- 0 regressions
- Highest test density in number-base (13 tests) — appropriate given the combinatorial nature of base conversions

**Tools Added:**

- XML↔JSON Converter (`xml-to-json`) — bidirectional conversion via fast-xml-parser
- TOML↔JSON Converter (`toml-to-json`) — bidirectional conversion via yaml (TOML parsing)
- HTML↔Markdown Converter (`html-to-markdown`) — bidirectional conversion via turndown
- Number Base Converter (`number-base-converter`) — convert between binary, octal, decimal, hex, and custom bases

**New Dependencies:** 3 (`fast-xml-parser`, `yaml`, `turndown`)

**Files Added/Modified:**

| Type | Files |
|------|-------|
| Components | `XmlToJsonConverter.tsx`, `TomlToJsonConverter.tsx`, `HtmlToMarkdownConverter.tsx`, `NumberBaseConverter.tsx`, `data/index.ts`, `encoding/index.ts` |
| Utils | `xml.ts`, `toml.ts`, `html-markdown.ts`, `number-base.ts` |
| Specs | `xml.spec.ts`, `toml.spec.ts`, `html-markdown.spec.ts`, `number-base.spec.ts` |
| Config | `tool-registry.ts`, `route.ts`, `feature.ts` |

## What Went Well

- **Bidirectional converters are a strong UX pattern** — XML↔JSON, TOML↔JSON, and HTML↔Markdown all support conversion in both directions, doubling utility from a single tool.
- **40 tests — highest test count of Epics 12-17 so far** — Converter logic has clear input/output contracts that lend themselves well to testing.
- **Number Base Converter is a zero-dependency tool** — Pure math logic, no external library needed. Clean, testable, maintainable.
- **TOML had the most thorough test coverage (11 tests)** — TOML's nested structure and type system warranted deeper testing, and got it.

## What Didn't Go Well

- **Story artifacts were not created before implementation** — Same process failure as Epic 12. All 4 story documents (13-1 through 13-4) were backfilled after code was written. No upfront acceptance criteria, no Previous Story Intelligence carried between stories.
- **Three new dependencies in one epic** — fast-xml-parser, yaml, and turndown. Each is justified individually, but the cumulative dependency surface is growing. No dependency audit process in place.
- **No documented rationale for library choices** — Without story artifacts, the evaluation of fast-xml-parser vs alternatives, or turndown vs other HTML→Markdown libraries, was not captured.

## Key Insights

1. **Bidirectional tools deliver 2x value at ~1.5x implementation cost** — The pattern of A↔B conversion should be the default for any data format tool.
2. **Converter tools have naturally high testability** — Clear input format → clear output format = easy to write comprehensive specs. This epic's 40 tests reflect that structural advantage.
3. **Story artifacts would have caught the dependency accumulation pattern** — If each story documented "new dependencies: X", the team would have visibility into the growing dependency surface across the epic.
4. **Number base conversion is a solved algorithmic problem** — No library needed. Pure utility functions with high test coverage (13 tests). This is the ideal tool profile.

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Create story artifacts before implementation (carried from Epic 12) | SM | HIGH |
| 2 | Establish dependency audit checklist for stories adding external libraries | Dev | MEDIUM |
| 3 | Consider dependency consolidation review — project now has many format-specific libs | Dev | LOW |

## Team Agreements

**Continued from Epic 12:**

- Story artifacts MUST be created before implementation begins
- Pure function testing strategy
- Test assertions must be specific

**New:**

- Bidirectional conversion should be the default pattern for format converter tools
- New dependency additions should document rationale and alternatives considered
