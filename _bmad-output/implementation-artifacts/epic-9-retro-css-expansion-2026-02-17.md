# Epic 15 Retrospective: CSS & Design Tools

**Date:** 2026-02-17
**Epic Status:** Done (backfill retro — all stories completed before this document was created)

## Epic Summary & Metrics

**Delivery:**

- Stories completed: 3/3 (100%)
- Story 15-1: CSS Gradient Generator — done
- Story 15-2: CSS Flexbox Playground — done
- Story 15-3: SVG Viewer/Optimizer — done
- Production incidents: 0

**Quality:**

- Tests: 28 new tests across 3 spec files (gradient: 8, flexbox: 8, svg-optimize: 12)
- 0 regressions
- SVG Optimizer has the highest test count (12) — appropriate given the complexity of SVG parsing/optimization

**Tools Added:**

- CSS Gradient Generator (`gradient-generator`) — visual linear/radial/conic gradient builder with CSS output
- CSS Flexbox Playground (`flexbox-playground`) — interactive flexbox property explorer with live preview
- SVG Viewer/Optimizer (`svg-viewer`) — view, inspect, and optimize SVG markup

**New Dependencies:** 0

**Files Added/Modified:**

| Type | Files |
|------|-------|
| Components | `GradientGenerator.tsx`, `FlexboxPlayground.tsx`, `SvgViewer.tsx`, `css/index.ts`, `image/index.ts` |
| Utils | `gradient.ts`, `flexbox.ts`, `svg-optimize.ts` |
| Specs | `gradient.spec.ts`, `flexbox.spec.ts`, `svg-optimize.spec.ts` |
| Config | `tool-registry.ts`, `route.ts`, `feature.ts` |

## What Went Well

- **Zero new dependencies again** — All three tools use pure logic (CSS string generation, flexbox property mapping, SVG string manipulation). Continuing the zero-dep streak from Epic 14.
- **Visual/interactive tools are the most engaging category** — Gradient Generator and Flexbox Playground provide immediate visual feedback, which is the highest-value UX pattern for CSS tools.
- **SVG Optimizer had thorough testing (12 tests)** — SVG manipulation has many edge cases (namespaces, attributes, nested elements). The test coverage reflects this complexity appropriately.
- **Good distribution across component categories** — Tools landed in both `css/` and `image/` feature directories, showing the registry and routing handle cross-category placement well.

## What Didn't Go Well

- **Story artifacts were not created before implementation** — Same process failure as Epics 12-14. All 3 story documents (15-1 through 15-3) were backfilled. Four consecutive epics now without upfront story artifacts.
- **Interactive tools are harder to unit test** — Gradient Generator and Flexbox Playground have significant visual/interactive behavior that pure utility tests don't cover. 8 tests each may miss interaction-specific bugs.
- **No accessibility review for visual tools** — Gradient Generator and Flexbox Playground are highly visual. Without story artifacts, there's no documented consideration of color contrast, keyboard navigation, or screen reader support.

## Key Insights

1. **Visual/interactive tools need both utility tests AND interaction patterns** — Pure function tests cover the logic, but the UX of dragging gradient stops or toggling flex properties requires a different testing approach (or at minimum, documented manual test scripts).
2. **Zero-dependency tools are achievable even for complex visual features** — CSS generation and SVG manipulation are string operations at their core. Libraries are not needed.
3. **The WCAG checklist gap (carried since Epic 7) is especially relevant for visual tools** — Gradient Generator and Flexbox Playground are the tools most likely to have accessibility issues, and the tools least likely to have been audited.
4. **Four consecutive epics without story artifacts confirms this is a systemic issue, not a one-time oversight.**

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Create story artifacts before implementation (carried from Epics 12-14) | SM | HIGH |
| 2 | Audit Gradient Generator and Flexbox Playground for keyboard accessibility | Dev | MEDIUM |
| 3 | Consider adding interaction-level tests for visual tools (e.g., component tests) | Dev | LOW |

## Team Agreements

**Continued from Epics 12-14:**

- Story artifacts MUST be created before implementation begins
- Web Crypto API default for crypto; zero-dep preference for all tools
- Pure function testing strategy

**New:**

- Visual/interactive tools should document manual test scripts for interactions that unit tests can't cover
- Accessibility review is especially critical for visual tools (gradient, flexbox, color-related)
