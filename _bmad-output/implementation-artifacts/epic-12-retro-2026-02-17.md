# Epic 12 Retrospective: Code & Markup Formatters

**Date:** 2026-02-17
**Epic Status:** Done (backfill retro — all stories completed before this document was created)

## Epic Summary & Metrics

**Delivery:**

- Stories completed: 5/5 (100%)
- Story 12-1: HTML Formatter — done
- Story 12-2: CSS Formatter — done
- Story 12-3: JavaScript Minifier — done
- Story 12-4: SQL Formatter — done
- Story 12-5: Markdown Preview — done
- Production incidents: 0

**Quality:**

- Tests: 27 new tests across 5 spec files (html-format: 7, css-format: 6, js-format: 5, sql-format: 3, markdown: 6)
- 0 regressions

**Tools Added:**

- HTML Formatter (`html-formatter`) — beautify/minify HTML via js-beautify
- CSS Formatter (`css-formatter`) — beautify/minify CSS via js-beautify
- JavaScript Minifier (`javascript-minifier`) — minify/beautify JS via js-beautify
- SQL Formatter (`sql-formatter`) — format SQL via sql-formatter
- Markdown Preview (`markdown-preview`) — live preview via marked

**New Dependencies:** 3 (`js-beautify`, `sql-formatter`, `marked`)

**Files Added/Modified:**

| Type | Files |
|------|-------|
| Components | `HtmlFormatter.tsx`, `CssFormatter.tsx`, `JavaScriptMinifier.tsx`, `SqlFormatter.tsx`, `MarkdownPreview.tsx`, `code/index.ts` |
| Utils | `html-format.ts`, `css-format.ts`, `js-format.ts`, `sql-format.ts`, `markdown.ts` |
| Specs | `html-format.spec.ts`, `css-format.spec.ts`, `js-format.spec.ts`, `sql-format.spec.ts`, `markdown.spec.ts` |
| Config | `tool-registry.ts`, `route.ts`, `feature.ts` |

## What Went Well

- **Largest epic by story count (5 stories) delivered cleanly** — All 5 formatter tools follow a consistent input → transform → output pattern, making development predictable.
- **js-beautify covered 3 tools** — HTML, CSS, and JS formatting all used a single dependency, reducing maintenance surface.
- **Consistent component architecture** — All formatters share the same TextAreaInput → util function → output pattern, establishing a repeatable template for code tools.
- **27 tests with zero regressions** — Testing covered core formatting logic through pure utility functions.

## What Didn't Go Well

- **Story artifacts were not created before implementation** — All 5 story documents (12-1 through 12-5) were written as backfill after the code was complete. This means no upfront acceptance criteria, no task breakdown during development, and no code review against documented requirements. This is a critical process failure.
- **No Previous Story Intelligence applied** — Without story artifacts, there was no formal mechanism to carry lessons from 12-1 into subsequent stories. The practice proven so effective in Epic 10 was abandoned.
- **No code review artifacts** — Without story documents, code reviews (if any) had no documented findings, fixes, or patterns to carry forward.
- **Low test count for SQL Formatter (3 tests)** — Compared to other formatters, SQL formatting has the fewest tests despite being the most complex formatting domain.

## Key Insights

1. **Story artifacts are not optional ceremony — they are the mechanism that enables quality practices.** Without them, Previous Story Intelligence, code review tracking, and acceptance criteria all break down.
2. **Shared dependencies across multiple tools in an epic reduce integration risk** — js-beautify powering 3 tools meant less dependency evaluation overhead.
3. **Formatter tools are structurally simple** — Input text → transform → output text. This pattern has low bug surface, which may explain why skipping process didn't cause visible quality issues (though invisible quality issues are by definition invisible).
4. **Five stories in one epic is the project maximum so far** — High throughput, but the lack of process artifacts means we can't verify quality with confidence.

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Retroactively verify SQL formatter edge cases — only 3 tests for a complex domain | Dev | MEDIUM |
| 2 | Establish mandatory story artifact creation BEFORE implementation for all future epics | SM | HIGH |
| 3 | Document the formatter component pattern as a reusable template | Dev | LOW |

## Team Agreements

**Critical new agreement:**

- **Story artifacts MUST be created before implementation begins.** Epics 12-17 demonstrated that skipping this step eliminates all downstream quality practices (Previous Story Intelligence, code review tracking, acceptance criteria validation). This is non-negotiable going forward.

**Continued from Epic 10:**

- Pure function testing strategy
- Utility extraction during implementation > planned abstractions
- Test assertions must be specific
- Theme tokens for all color values
