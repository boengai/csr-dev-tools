# Epic 21 Retrospective: AI-Powered Image Tools

**Date:** 2026-02-19
**Epic Status:** Done — 1/1 stories completed

## Epic Summary & Metrics

**Delivery:**

- Stories completed: 1/1 (100%)
- All tasks checked off (7 tasks, 30+ subtasks)
- Production incidents: 0

**Quality:**

- Tests: 848 total (6 new, 0 regressions)
- Code review findings: 3 HIGH, 4 MEDIUM, 2 LOW
- All HIGH and MEDIUM issues fixed before merge (7/9 resolved)
- 2 LOW findings deferred
- New dependencies: `@huggingface/transformers` (production), `jsdom` (dev)

**Stories Delivered:**

| Story | Title | Type | Tests New | Files New | Files Modified |
|-------|-------|------|-----------|-----------|----------------|
| 21-1 | Background Remover | Tabs + Dialog | 6 | 3 | 8 |

**Tools Added:**

- Background Remover (`background-remover`, Image) — AI-powered background removal using `@huggingface/transformers` with browser-side model inference
- Registry now has 56 tools (up from 55)

## Previous Retro Follow-Through (Epic 20)

| # | Action Item | Priority | Status | Evidence |
|---|------------|----------|--------|----------|
| 1 | Limit parallel story dev to 2-3 concurrent | HIGH | N/A | Epic 21 had only 1 story — single-story epic |
| 2 | Address 8 deferred LOW code review findings | LOW | Not Addressed | No fixes applied this epic |
| 3 | Establish Canvas mock or E2E strategy for image tools | MEDIUM | Partial | Added `jsdom` as devDep; used `@vitest-environment jsdom` directive for background-removal tests |
| 4 | Continue enforcing full BMAD workflow for all future epics | HIGH | Completed | Full create-story → dev-story → code-review flow executed |

**Summary:** 1 completed, 1 partially addressed, 1 not addressed, 1 not applicable. The full BMAD workflow commitment was honored. The deferred LOW findings from Epic 20 remain open.

## What Went Well

- **First AI/ML tool delivered** — Background Remover runs `@huggingface/transformers` inference entirely in the browser. Model downloads once (~25MB), caches in browser storage, and subsequent uses skip the download. Zero server-side processing.
- **Full BMAD workflow followed** — Story file existed before implementation. Create-story → dev-story → code-review pipeline executed properly.
- **Code review caught critical bugs** — 3 HIGH findings, most notably H2: `onAfterClose` always reset state, breaking the Confirm→Download flow entirely. This would have shipped as a user-facing regression without review.
- **Cross-cutting UploadInput bugfix** — Discovered and fixed `event.target.value = ''` reset needed after onChange, allowing re-selection of the same file. This fix benefits all tools using UploadInput (ImageResizer, FaviconGenerator, ImageColorPicker, etc.).
- **Established reusable ML patterns** — Pipeline singleton caching (cache the Promise, not the resolved value), two-level lazy loading (component chunk → library → model), jsdom test environment per-file.

## What Didn't Go Well

- **H2 was a critical UX-breaking bug** — The Confirm→Download flow was completely non-functional before code review. The `onAfterClose` callback always called `handleReset()`, meaning users would never see the download tab after confirming their result.
- **No comprehensive Canvas/E2E test strategy** — Carried forward from Epic 20. jsdom was added as a per-test-file solution, but there's still no project-wide strategy for Canvas-dependent tools.
- **5-state machine complexity** — The background remover required idle/downloading/processing/done/error states, significantly more complex than typical 2-3 state tools. This led to multiple state management bugs caught in review (M1 stale closure, M2 stuck UI).
- **2 LOW findings deferred** — L1 (tabs nav visibility) was verified as non-issue. L2 (aria-live on processing/error) was fixed. Overall minor.

## Key Insights

1. **Code review is non-negotiable for dialog-based tools** — Dialog components have complex state machines with open/close transitions that create subtle bugs. H2 would have been invisible without fresh-context review.
2. **ML tools need different state management** — Download progress + processing + error creates a fundamentally different state space than text transformation tools. Consider extracting a `useMLPipeline` hook if more ML tools are added.
3. **Pipeline caching pattern is reusable** — Cache the Promise itself (not the resolved value) to prevent duplicate initialization on concurrent calls. Any future ML tool should follow this pattern.
4. **jsdom per-file is viable** — The `// @vitest-environment jsdom` directive allows mixing `node` and `jsdom` test environments without changing the project default. Good compromise.
5. **Refactoring mid-story works when patterns are clear** — Switching from FaviconGenerator to ImageResizer pattern mid-implementation improved UX consistency. The established patterns made this a reasonable mid-course correction.

## Code Review Findings Detail

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| H1 | HIGH | Object URL leak — download anchor holds blob URL after reset | Clear anchor href/download in `handleReset()` |
| H2 | HIGH | `onAfterClose` always called `handleReset()`, breaking Confirm→Download flow | Added `confirmedRef` — only resets on dismiss, not confirm |
| H3 | HIGH | No error state in dialog after refactor — error just closes dialog | Restored error state with NotoEmoji bomb, "Try Again" button, `aria-live="assertive"` |
| M1 | MEDIUM | `updateDisplay` stale closure over `resultUrl` | Changed to `resultUrlRef.current` for stable comparison |
| M2 | MEDIUM | Stuck UI when `displayUrl` falsy but processing done | Error state now covers this case |
| M3 | MEDIUM | Download toast fires even if anchor href is empty/revoked | Added href validation before click |
| M4 | MEDIUM | Missing eslint-disable comment for intentional empty deps | Added disable comment |
| L1 | LOW | Tabs nav visible without labels | Verified: Tabs component hides nav when no triggers — non-issue |
| L2 | LOW | `aria-live` missing on processing/error states | Fixed: added `aria-live="polite"` on processing, `"assertive"` on error |

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Address 8 deferred LOW code review findings from Epic 20 | Dev (Amelia) | LOW |
| 2 | Establish project-wide Canvas mock or E2E strategy for image tools | QA (Quinn) + Dev (Amelia) | MEDIUM |
| 3 | Consider extracting `useMLPipeline` hook if Epic 22+ adds more ML tools | Architect (Winston) | LOW |
| 4 | Continue enforcing full BMAD workflow for all future epics | SM (Bob) | HIGH |
| 5 | Verify js-yaml is already in project before starting Epic 22 Story 22-1 | Dev (Amelia) | HIGH |

## Next Epic Preview — Epic 22: Data Format Tools

**Stories planned:** 4
- 22-1: YAML Formatter (`yaml-formatter`)
- 22-2: ENV File Converter (`env-file-converter`)
- 22-3: Escaped JSON Stringifier (`escaped-json-stringifier`)
- 22-4: HTML Entity Converter (`html-entity-converter`)

**Dependencies on Epic 21:** None — fully independent data/text tools.

**Preparation needed:**
- Verify js-yaml availability (Story 22-1 dependency)
- Stories 22-2, 22-3, 22-4 are pure logic with no external dependencies
- All tools are inline text transformations (no dialogs, no Canvas, no ML)

**Risk assessment:** LOW — straightforward text tools following established patterns.

**Significant changes required for Epic 22:** None. Plan is sound as-is.

## Tool Count Summary

- Epics 1-11: 19 tools (PRD scope complete)
- Epics 12-17: 22 tools (expansion)
- Epic 18: 5 tools
- Epic 19: 4 tools (originally 5, http-status-codes was already present)
- Epic 20: 5 tools
- Epic 21: 1 tool (Background Remover — first AI/ML tool)
- **Total: 56 tools, 848 tests**
