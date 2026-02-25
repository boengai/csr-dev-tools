# Epic 25 Retrospective — Code & Schema Tools

**Date:** 2026-02-25
**Epic:** 25 — Code & Schema Tools
**Stories Completed:** 4/4
**Participants:** Bob (SM), Alice (PO), Charlie (Dev), Dana (QA), Elena (Dev), csrteam (Project Lead)

## Summary

All 4 stories implemented successfully on 2026-02-25:

- 25.1: GraphQL Schema Viewer (graphql@16.13.0, lazy-loaded)
- 25.2: Protobuf to JSON (protobufjs@8.0.0, lazy-loaded)
- 25.3: TypeScript Playground (@monaco-editor/react@4.7.0, Monaco from CDN — zero bundle impact)
- 25.4: JSONPath Evaluator (jsonpath-plus@10.4.0, static import — small enough at ~15KB gzipped)

## Delivery Metrics

- **Stories:** 4/4 completed (100%)
- **Unit tests added:** 69 (19 + 22 + 0 + 28)
- **E2E tests added:** 37 (9 + 9 + 8 + 11)
- **Total test suite:** 1224 unit tests passing, 0 regressions
- **Build:** Clean, 60 prerendered pages (up from 56)
- **Blockers:** 0
- **Technical debt:** 0
- **Production incidents:** 0
- **Code review rounds:** 4 (one per story)
- **Code review issues total:** 13 (4 + 3 + 3 + 3)
- **New dependencies:** 4 (graphql, protobufjs, @monaco-editor/react, jsonpath-plus) — all lazy-loaded or CDN-loaded
- **Agent model:** Claude Opus 4.6 (all stories)

## What Went Well

1. **100% completion with zero blockers** — Fourth consecutive epic with 100% story completion. All 4 stories delivered cleanly, maintaining the streak from Epics 22-24.

2. **Previous Story Intelligence (PSI) matured into a force multiplier** — Now in its third epic, PSI is compounding powerfully. Story 25.1's dynamic import fix (H1) was explicitly applied in 25.2. Story 25.2's "no mixed static/dynamic import" rule prevented the same issue in 25.3 and 25.4. Story 25.3's Monaco E2E workarounds informed 25.4's approach to timeout handling.

3. **Innovative dependency loading strategies** — The team developed three distinct strategies for external libraries:
   - **Dynamic import** (25.1, 25.2): Lazy-load heavy libs (~32KB, ~19KB gzipped) inside async callbacks
   - **CDN loading** (25.3): Monaco Editor loads from jsdelivr CDN at runtime — zero bundle impact for an enormous library
   - **Static import** (25.4): jsonpath-plus at ~15KB gzipped deemed small enough for direct import — pragmatic threshold established

4. **All 4 external libraries integrated successfully** — Every story in this epic required a new npm dependency (vs. 2/5 in Epic 24). All 4 were vetted and integrated cleanly despite API surprises in protobufjs v8.

5. **Code category scaled to 12 tools** — The 'Code' category grew from 8 to 12 tools without any structural issues. The registration checklist (types union → registry entry → vite prerender → barrel exports) continued to deliver reliable results.

6. **Test suite growth** — 1224 unit tests (+66 from Epic 24's 1158) and 37 new E2E tests with 0 regressions. Quality infrastructure remains solid.

7. **Team agreements from Epic 24 mostly followed** — Library API verification, Radix required props, PSI continuation, CopyButton usage, exact toast matching, alphabetical ordering — all held. Behavioral changes stuck.

## What Could Be Improved

1. **Code review issues in EVERY story (13 total)** — Despite 3 epics of retrospectives identifying this pattern, every story still surfaces code review findings. The breakdown:
   - ARIA semantic issues: 3/4 stories (listbox/option misuse in 25.1, role="alert" vs role="status" in 25.3, missing attributes in 25.4)
   - Edge case handling: 2/4 stories (falsy JSON primitives in 25.4, type resolution in 25.1)
   - Dead code/comments: 2/4 stories
   - Import patterns: 2/4 stories

2. **Action item follow-through WORSENED** — 0.5/5 action items from Epic 24 retro addressed (10%), down from 25% in Epic 24, which was already down from Epic 23. The "Common Gotchas" checklist has been carried forward for THREE consecutive epics without being created.

3. **project-context.md stale for 2+ weeks** — Still dated 2026-02-11 despite action items from Epic 23 AND 24 to update it. Patterns from 3 epics remain undocumented.

4. **Library API surprises continued (2/4 stories):**
   - 25.2: protobufjs v8.0.0 removed `Field.rule`, `IParserResult.syntax`, and default export — API docs didn't match
   - 25.4: jsonpath-plus `JSONPath()` return type needed casting, `TextInput` type prop requirement

5. **Stale closure bug pattern (25.4)** — Debounced callbacks captured stale state, requiring a `useRef` mirror workaround. This is a fundamental React pattern that should be documented for future stories using debounce.

6. **ARIA remains the #1 code review category across 3 epics** — Accessibility issues appeared in code reviews for Epics 23, 24, and 25. This is not improving because the Common Gotchas checklist keeps not being created.

## Lessons Learned

1. **Three dependency loading strategies now available** — Dynamic import for medium libs (>15KB gzipped), CDN loading for massive libs (Monaco), static import for small libs (<15KB gzipped). The team now has a decision framework.

2. **PSI is the most impactful process innovation this project has adopted** — It's the only consistently applied improvement across 3 epics. It compounds aggressively — each story is better than the last within an epic.

3. **Behavioral changes stick, artifact creation doesn't** — Team agreements (behavioral) have high follow-through. Formal action items requiring artifact creation (docs, checklists) have near-zero follow-through. The process needs to change to match reality.

4. **Stale closures in debounced callbacks are a trap** — When using `useDebounceCallback` with state dependencies, the callback captures stale state. Solution: mirror state values in `useRef` and read from ref inside the callback.

5. **Monaco CDN loading is a breakthrough pattern** — Loading heavy editor libraries from CDN at runtime achieves zero bundle impact while providing a full-featured editor experience. This pattern should be applied to the Mermaid renderer in Epic 26.

6. **The "Common Gotchas" checklist is this project's biggest unforced error** — Three epics of recurring ARIA issues, three retros requesting the same checklist. The cost of NOT creating it exceeds the cost of creating it many times over.

## Previous Retro (Epic 24) Follow-Through

| # | Epic 24 Action | Status | Evidence |
|---|---|---|---|
| 1 | Create "Common Gotchas" pre-implementation checklist (CARRIED x2) | ❌ Not Addressed | Same ARIA issues recurred in 3/4 Epic 25 stories |
| 2 | Add library spike step to story preparation | ⏳ Partial | PSI sections included library notes, but no formal template change |
| 3 | Enforce action item follow-through tracking | ❌ Not Addressed | No evidence of weekly tracking between retros |
| 4 | Update project-context.md with Epic 23+24 patterns (CARRIED x2) | ❌ Not Addressed | Still dated 2026-02-11 |
| 5 | Document Security category implementation patterns | ❌ Not Addressed | No documentation created |

**Follow-through rate:** 0.5/5 (10%) — declined from 25% in Epic 24 and ~25% in Epic 23

**Impact of missed items:**
- ARIA issues appeared in 3/4 stories' code reviews (would have been caught by Gotchas checklist)
- Same import and barrel export fixes repeated (would have been prevented by updated project-context.md)
- No documented patterns from Epics 23 or 24 available for reference

**Team Agreements Follow-Through (from Epic 24):**
- ✅ Verify library APIs with real data — applied, caught protobufjs v8 changes
- ✅ Include Radix required props — no Tabs issues this epic
- ✅ Continue PSI pattern — all 4 stories included PSI
- ✅ Use CopyButton/useCopyToClipboard — consistently applied
- ✅ Use exact: true for toast matching — consistently applied
- ✅ Maintain alphabetical ordering — consistently applied
- ⏳ Run E2E tests with exact rendered selectors — mostly improved, some issues remain

## Next Epic Preview — Epic 26: Time & Diagram Tools

**3 stories planned:**

- 26.1: Timezone Converter (likely Intl API, new 'Time' category)
- 26.2: Mermaid Diagram Renderer (mermaid library — heavy, CDN pattern from 25.3 applicable)
- 26.3: IP/Subnet Calculator (pure TypeScript bitwise math, new 'Network' category)

**Dependencies on Epic 25:** None (independent tool set)

**Key observations:**
- Two new categories likely needed: 'Time' and 'Network'
- Mermaid library is heavy — apply Monaco CDN loading pattern from 25.3
- 26.3 is pure math like 24.4 Chmod Calculator — should be cleanest story
- 26.1 may use browser's `Intl.DateTimeFormat` API (zero dependencies possible)

## Action Items

### Process Improvements

1. **FINAL ATTEMPT: Create "Common Gotchas" checklist (CARRIED x3)**
   - Owner: Bob (SM) — pair with csrteam to ensure completion
   - Deadline: Before Epic 26 Story 26.1
   - Criteria: Document covering ARIA patterns (aria-live, aria-label, aria-current, role semantics, focus-visible), barrel export ordering, E2E selector accuracy, Radix required props, debounce stale closure pattern, import patterns (static vs dynamic), Tailwind class ordering
   - **ESCALATION**: If not completed before Epic 26, embed the checklist directly in story templates instead of creating a separate document

2. **Replace artifact-based action items with inline process changes**
   - Owner: Bob (SM)
   - Deadline: Immediate (this retro)
   - Criteria: Instead of "create document X," embed the knowledge directly into existing workflow artifacts (story templates, PSI sections, project-context.md). Stop creating action items that require new standalone artifacts.

3. **Continue and formalize PSI as mandatory**
   - Owner: Bob (SM)
   - Deadline: Ongoing
   - Criteria: PSI section required in every story. SM verifies PSI inclusion during story creation.

### Technical Improvements

4. **Update project-context.md with Epic 23-25 patterns (FINAL CARRY)**
   - Owner: Charlie (Dev) — pair with csrteam
   - Deadline: Before Epic 26
   - Criteria: Add stale closure/useRef pattern, dependency loading decision framework (static <15KB / dynamic >15KB / CDN for massive), ARIA semantic rules, Monaco CDN pattern

5. **Document dependency loading decision framework in story template**
   - Owner: Bob (SM)
   - Deadline: Before Epic 26
   - Criteria: Story template includes decision tree: <15KB gzipped → static import, >15KB → dynamic import, massive (>100KB) → CDN loading

### Documentation

6. **Add stale closure pattern to PSI for debounced tools**
   - Owner: Charlie (Dev)
   - Deadline: Include in Epic 26 Story 26.1's PSI section
   - Criteria: Document useRef mirror pattern for debounced callbacks that depend on state

### Team Agreements

- Continue PSI pattern in every story (non-negotiable)
- Apply dependency loading framework: static (<15KB), dynamic (>15KB), CDN (massive)
- Always use `role="status"` with `aria-live="polite"` (not `role="alert"`)
- Always use button-based lists with aria-labels (not listbox/option for simple lists)
- Document useRef mirror pattern for debounced callbacks using state
- Verify library APIs with real data before committing to implementation
- Maintain alphabetical ordering in all registrations and barrel exports

## Epic 26 Preparation Tasks

**Critical (before epic starts):**

- [ ] Verify/create 'Time' ToolCategory for Story 26.1
- [ ] Verify/create 'Network' ToolCategory for Story 26.3
- [ ] Update project-context.md with Epic 23-25 accumulated patterns
- [ ] Create Common Gotchas checklist (or embed in story template)

**Parallel (during early stories):**

- [ ] Research Mermaid library loading strategy for Story 26.2 (CDN vs lazy load)
- [ ] Investigate Intl.DateTimeFormat for timezone conversion (26.1 zero-dep potential)
- [ ] Design loading skeleton for Mermaid renderer (NFR-E3-02)

**Nice-to-have:**

- [ ] Audit and consolidate ARIA patterns used across all 60 tools into a reference

## Readiness Assessment

| Area | Status |
|---|---|
| Testing & Quality | ✅ 1224 unit tests, all E2E passing, 0 regressions |
| Build | ✅ Clean, 60 prerendered pages, lint 0 errors |
| Technical Health | ✅ Zero technical debt, all code review fixes applied |
| Deployment | ✅ Client-side only — no server deployment needed |
| Unresolved Blockers | ✅ None |

**Epic Update Required:** NO — Epic 26's plan is sound as-is.

## Significant Discoveries

No discoveries that fundamentally change Epic 26 plans. The CDN loading pattern from Story 25.3 is directly applicable to the Mermaid renderer in 26.2, which is a positive dependency.

## Critical Path

1. Update sprint-status: Epic 25 → `done`, retrospective → `done` — immediate
2. Create Common Gotchas checklist or embed in story template — before Story 26.1
3. Update project-context.md — before Epic 26
4. Verify/create 'Time' and 'Network' categories — before respective stories
