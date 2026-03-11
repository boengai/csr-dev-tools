# Epic 24 Retrospective — Security & Crypto Tools

**Date:** 2026-02-25
**Epic:** 24 — Security & Crypto Tools
**Stories Completed:** 5/5
**Participants:** Bob (SM), Alice (PO), Charlie (Dev), Dana (QA), Elena (Dev), csrteam (Project Lead)

## Summary

All 5 stories implemented successfully across 2026-02-23 to 2026-02-25:

- 24.1: SSH Key Fingerprint Viewer (pure JS, inline RFC 1321 MD5)
- 24.2: Certificate Decoder (@peculiar/x509, lazy-loaded)
- 24.3: Bcrypt Hasher (bcryptjs, lazy-loaded)
- 24.4: Chmod Calculator (pure TypeScript bitwise ops)
- 24.5: RSA Key Pair Generator (Web Crypto API, zero deps)

## Delivery Metrics

- **Stories:** 5/5 completed (100%)
- **Unit tests added:** 98 (25 + 18 + 17 + 31 + 7)
- **E2E tests added:** 46 (8 + 10 + 9 + 10 + 9)
- **Total test suite:** 1158 unit tests passing, 0 regressions
- **Build:** Clean, 56 prerendered pages
- **Blockers:** 0
- **Technical debt:** 0
- **Production incidents:** 0
- **Code review rounds:** 6 (one per story, plus extra round for 24.3)
- **New dependencies:** 2 (@peculiar/x509 1.14.3, bcryptjs 3.0.3) — both lazy-loaded
- **Dependencies avoided:** 3 (blueimp-md5 rejected, zero deps for chmod and RSA)
- **Agent model:** Claude Opus 4.6 (all stories)

## What Went Well

1. **100% completion with zero blockers** — All 5 stories completed cleanly with no blocking issues. Epic maintained consistent delivery.

2. **"Previous Story Intelligence" continued as force multiplier** — All 5 stories included PSI sections applying learnings from predecessor stories. Toast API fix (24.1), lazy loading pattern (24.2→24.3), Tabs trigger lesson (24.3→24.4), TextInput props lesson (24.4→24.5).

3. **Creative dependency-free solutions** — Story 24.1 replaced blueimp-md5 with inline RFC 1321 MD5 (~50 lines) when the library corrupted binary data. Stories 24.4 and 24.5 used pure TypeScript bitwise ops and Web Crypto API respectively. 3/5 stories shipped with zero new npm dependencies.

4. **Comprehensive test coverage** — 98 unit tests and 46 E2E tests covering all acceptance criteria, edge cases (multi-byte UTF-8, empty strings, expired certificates), error states, and mobile responsiveness.

5. **Security category established cleanly** — New `'Security'` ToolCategory created in Story 24.1 and reused seamlessly across all 5 stories. Pattern of category creation → tool registration is now well-established.

6. **Web Crypto API proven reliable** — Used for SHA-256 fingerprinting (24.1), RSA key generation (24.5), and bcryptjs random salt (24.3). Works natively in both browser and Node.js test environment without mocks.

7. **Pattern stability** — The utility-first, registration-checklist approach (types union → registry entry → vite prerender → barrel exports) continued to deliver reliable results across all 5 stories.

## What Could Be Improved

1. **Recurring accessibility issues in code review (4/5 stories)** — aria-live placement, aria-labels, keyboard navigation, and Radix component props continued to surface in code reviews. This is the same category of findings from Epic 23.

2. **Third-party library API surprises (3/5 stories):**
   - 24.1: blueimp-md5 UTF-8 encodes binary input (corrupts SSH key blob hashes)
   - 24.2: @peculiar/x509 SAN returns GeneralNames object (not array), EKU returns ExtendedKeyUsageType (not string)
   - 24.3: bcryptjs callback parameter order reversed from expectation

3. **Critical Tabs bug in Story 24.3** — Missing `trigger` prop on Radix Tabs made Verify tab completely inaccessible. Only caught in code review — no runtime error or warning.

4. **E2E test selector mismatch (24.5)** — All 9 E2E tests initially failed because the button selector didn't match the actual aria-label. Tests should be written against actual rendered output.

5. **Epic 23 action items not followed through** — 3 out of 4 action items from Epic 23 retro were not addressed (Common Gotchas checklist, clipboard docs, pattern docs). This directly contributed to recurring code review findings.

6. **Story 24.3 required two code review rounds** — The most complex story in the epic needed an additional review to resolve build warnings from mixed static/dynamic imports and missing verify tab elapsed timer.

## Lessons Learned

1. **Zero-dependency stories are faster and cleaner** — Stories 24.1, 24.4, and 24.5 (pure TypeScript/Web Crypto) had fewer code review issues than library-dependent stories 24.2 and 24.3. Prefer native APIs where possible.

2. **Third-party library APIs must be verified with real data early** — Reading documentation isn't enough. Test library behavior with actual input data (binary blobs, certificate bytes, password strings) before committing to implementation.

3. **Previous Story Intelligence is proven across 2 epics** — PSI eliminated repeat mistakes within the epic and accelerated velocity. The pattern should be mandatory, not optional.

4. **Unfollowed action items create compounding debt** — The Common Gotchas checklist from Epic 23 would have prevented many of Epic 24's recurring code review findings. Not doing it cost more than doing it.

5. **Radix component documentation gaps** — Radix Tabs silently fails without trigger props. This type of "invisible failure" is dangerous and needs explicit documentation in the project's gotchas list.

6. **E2E selectors must match rendered output** — Writing E2E tests against assumed text (not actual DOM) leads to false failures. Always verify selectors against the running application.

## Previous Retro (Epic 23) Follow-Through

| # | Epic 23 Action | Status | Evidence |
|---|---|---|---|
| 1 | Create "Common Gotchas" pre-implementation checklist | ❌ Not Addressed | Same accessibility, barrel ordering, E2E selector issues recurred in all 5 Epic 24 stories |
| 2 | Continue "Previous Story Intelligence" pattern | ✅ Completed | All 5 stories included PSI section with applied learnings |
| 3 | Standardize clipboard usage in project-context.md | ❌ Not Addressed | project-context.md unchanged since 2026-02-11 |
| 4 | Update project-context.md with Epic 23 patterns | ❌ Not Addressed | No SVG data URI or color picker sync patterns documented |

**Follow-through rate:** 1/4 (25%) — needs significant improvement

**Impact of missed items:**
- Accessibility issues appeared in 4/5 stories' code reviews
- Same barrel export ordering fixes repeated
- E2E selector patterns not standardized

## Next Epic Preview — Epic 25: Code & Schema Tools

**4 stories planned:**

- 25.1: GraphQL Schema Viewer (graphql package)
- 25.2: Protobuf to JSON (protobufjs)
- 25.3: TypeScript Playground (@monaco-editor/react — heavy bundle, NFR-E3-01)
- 25.4: JSONPath Evaluator (jsonpath-plus)

**Dependencies on Epic 24:** None (independent tool set)

**New challenges:**

- All 4 stories require external libraries (vs. 2/5 in Epic 24)
- Monaco Editor (25.3) is extremely heavy — needs careful lazy loading and loading skeleton
- `'Code'` category may need verification/creation
- Library vetting critical given Epic 24's API surprise pattern

## Action Items

### Process Improvements

1. **Create "Common Gotchas" pre-implementation checklist** (CARRIED FORWARD — Epic 23)
   - Owner: Bob (SM)
   - Deadline: Before Epic 25 Story 25.1
   - Criteria: Covers accessibility (aria-live, aria-label, keyboard nav, focus-visible), barrel export ordering, E2E selector accuracy, Radix required props (Tabs trigger), clipboard hook usage, vitest explicit imports

2. **Add library spike step to story preparation**
   - Owner: Bob (SM)
   - Deadline: Before Epic 25
   - Criteria: Story template includes "Library Behavior Verification" for any story with external dependencies

3. **Enforce action item follow-through tracking**
   - Owner: Bob (SM)
   - Deadline: Ongoing
   - Criteria: Action items from retros reviewed weekly, tracked with clear status

### Technical Improvements

4. **Update project-context.md with Epic 23+24 patterns** (CARRIED FORWARD)
   - Owner: Charlie (Dev)
   - Deadline: Before Epic 25
   - Criteria: Clipboard hook rule, accessibility checklist, lazy-loading conventions, Radix Tabs trigger requirement, Web Crypto API patterns documented

### Documentation

5. **Document Security category implementation patterns**
   - Owner: Paige (Tech Writer)
   - Deadline: Before Epic 25
   - Criteria: Private key detection pattern, Web Crypto API usage, lazy-loading of crypto libraries, inline MD5 rationale documented

### Team Agreements

- Always verify library APIs with real data before committing to implementation
- Always include Radix component required props (especially Tabs trigger)
- Always run E2E tests with exact rendered selectors (not assumed text)
- Continue Previous Story Intelligence pattern in every story
- Always use `useCopyToClipboard` hook — never raw clipboard API
- Always use `exact: true` for toast text matching in E2E tests
- Always maintain alphabetical ordering in barrel exports and registry entries

## Epic 25 Preparation Tasks

**Critical (before epic starts):**

- [ ] Verify/add `'Code'` to ToolCategory union type
- [ ] Update project-context.md with accumulated patterns

**Parallel (during early stories):**

- [ ] Research Monaco Editor bundle size and lazy-loading strategy for Story 25.3
- [ ] Vet graphql package for client-side browser compatibility
- [ ] Vet protobufjs for client-side browser compatibility
- [ ] Vet jsonpath-plus for client-side browser compatibility
- [ ] Design loading skeleton for Monaco Editor (NFR-E3-01)

**Nice-to-have:**

- [ ] Create the Common Gotchas document from code review patterns across Epics 22-24

## Readiness Assessment

| Area | Status |
|---|---|
| Testing & Quality | ✅ 1158 unit tests, all E2E passing, 0 regressions |
| Build | ✅ Clean, 56 prerendered pages, lint 0 errors |
| Technical Health | ✅ Zero technical debt, all code review fixes applied |
| Deployment | ✅ Client-side only — no server deployment needed |
| Unresolved Blockers | ✅ None |

**Epic Update Required:** NO — Epic 25's plan is sound as-is.

## Critical Path

1. Create Common Gotchas checklist — before Story 25.1
2. Update project-context.md — before Epic 25
3. Update sprint-status: Epic 24 → `done` — immediate
