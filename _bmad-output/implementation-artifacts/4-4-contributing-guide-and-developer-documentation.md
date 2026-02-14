# Story 4.4: CONTRIBUTING Guide & Developer Documentation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **contributor**,
I want **a clear guide explaining how to add a new tool step-by-step**,
So that **I can contribute a tool without needing to ask the maintainer for help**.

**Epic:** Epic 4 — Quality Infrastructure & Contributor Experience
**Dependencies:** Story 4-1 (E2E test infrastructure — complete), Story 4-2 (CI/CD pipeline — complete), Story 4-3 (Lighthouse CI — complete)
**Story Key:** 4-4-contributing-guide-and-developer-documentation

## Acceptance Criteria

### AC1: CONTRIBUTING.md Documents Complete "Add a New Tool" Workflow

**Given** `CONTRIBUTING.md` at the project root
**When** a contributor reads it
**Then** it documents the complete "add a new tool" workflow:
1. Create component in `src/components/feature/{domain}/`
2. Add types in `src/types/components/feature/{domain}/`
3. Add barrel exports in `index.ts` files
4. Add registry entry in `src/constants/tool-registry.ts`
5. Add validation functions if needed in `src/utils/validation.ts`
6. Write unit tests for logic in `*.spec.ts`
7. Write E2E test in `e2e/{tool-key}.spec.ts`

### AC2: End-to-End Contributor Success Path

**Given** the CONTRIBUTING guide
**When** a contributor follows it end-to-end
**Then** the new tool appears on the dashboard, has a dedicated route, shows in the sidebar and command palette, and passes all quality gates

### AC3: PR Checklist Included

**Given** the CONTRIBUTING guide
**When** it references code patterns
**Then** it includes a PR checklist: registry entry added, useToolError used, unit tests written, E2E test written, all existing tests pass

## Tasks / Subtasks

- [x] Task 1: Create CONTRIBUTING.md at project root (AC: #1, #2, #3)
  - [x] 1.1 Write "Prerequisites" section documenting Node.js >= 24.5.0, pnpm 10.11.0, and environment setup
  - [x] 1.2 Write "Getting Started" section with clone, install, dev server commands
  - [x] 1.3 Write "Adding a New Tool" section with the complete 7-step workflow including code examples
    - [x] 1.3.1 Step 1: Create the tool component in `src/components/feature/{domain}/` using named exports, `useToolError` hook
    - [x] 1.3.2 Step 2: Add types in `src/types/components/feature/{domain}/` using `type` not `interface`
    - [x] 1.3.3 Step 3: Add barrel exports up the chain in `index.ts` files
    - [x] 1.3.4 Step 4: Add registry entry in `src/constants/tool-registry.ts` with all required fields (key, name, category, emoji, description, seo, routePath, component)
    - [x] 1.3.5 Step 5: Update `ToolCategory` and `ToolRegistryKey` types in `src/types/constants/tool-registry.ts` if new category or key
    - [x] 1.3.6 Step 6: Add validation functions if needed in `src/utils/validation.ts` with tests in `validation.spec.ts`
    - [x] 1.3.7 Step 7: Write unit tests for logic as co-located `*.spec.ts` files
    - [x] 1.3.8 Step 8: Write E2E test in `e2e/{tool-key}.spec.ts` following the existing `color-converter.spec.ts` pattern
  - [x] 1.4 Write "Code Conventions" section documenting critical rules:
    - [x] 1.4.1 `type` not `interface`, `Array<T>` not `T[]`
    - [x] 1.4.2 Named exports only (no default except pages)
    - [x] 1.4.3 `import type` for type-only imports
    - [x] 1.4.4 `@/` path alias, alphabetical imports
    - [x] 1.4.5 No semicolons, single quotes, trailing commas
    - [x] 1.4.6 `motion/react` not `framer-motion`
    - [x] 1.4.7 `tv()` from `@/utils` for Tailwind variants
  - [x] 1.5 Write "Available Scripts" section with all pnpm commands (dev, build, lint, format, test, test:e2e)
  - [x] 1.6 Write "Project Structure" section showing actual current source tree layout
  - [x] 1.7 Write "Testing" section covering:
    - [x] 1.7.1 Unit tests: Vitest, node env, co-located `*.spec.ts`, globals enabled
    - [x] 1.7.2 E2E tests: Playwright, shared selectors from `e2e/helpers/selectors.ts`, shared fixtures from `e2e/helpers/fixtures.ts`
  - [x] 1.8 Write "PR Checklist" section as a copyable markdown checklist
  - [x] 1.9 Write "CI/CD Quality Gates" section documenting what the CI pipeline checks (lint, format, test, build, Lighthouse)

- [x] Task 2: Update README.md Contributing section (AC: #2)
  - [x] 2.1 Update the "Contributing" section in README.md to reference `CONTRIBUTING.md` instead of inline guidelines

- [x] Task 3: Verify documentation accuracy (AC: #1, #2, #3)
  - [x] 3.1 Cross-reference all file paths mentioned in CONTRIBUTING.md against actual project structure
  - [x] 3.2 Verify all pnpm commands listed actually exist in package.json scripts
  - [x] 3.3 Ensure code examples follow project conventions (no semicolons, single quotes, type not interface, Array<T> not T[])

## Dev Notes

### CRITICAL: This is a Documentation-Only Story — No Source Code Changes

This story creates `CONTRIBUTING.md` at the project root and updates the Contributing section in `README.md`. No files in `src/` are modified. No new runtime dependencies. No test files created.

#### What Already Exists

1. **Development guide (docs/development-guide.md):**
   - Contains prerequisites, available scripts, VS Code setup, code style rules, testing info
   - Has a basic "Adding a New Tool" section (6 steps) — BUT it's outdated (references old pattern of registering in `home/index.tsx` instead of `TOOL_REGISTRY`)
   - CONTRIBUTING.md should be the canonical contributor guide, with more detail and current patterns

2. **README.md:**
   - Has a "Contributing" section with generic 5-step guidelines
   - References ESLint/Prettier (outdated — project uses oxlint/oxfmt)
   - Should be updated to point to `CONTRIBUTING.md`

3. **project-context.md (_bmad-output/):**
   - 53 rules for AI agents — internal reference, NOT a contributor-facing document
   - CONTRIBUTING.md should distill the human-relevant subset of these rules

4. **Architecture doc (_bmad-output/planning-artifacts/):**
   - Contains comprehensive patterns and anti-patterns
   - CONTRIBUTING.md should reference key patterns without duplicating the full architecture

5. **Tool Registry (`src/constants/tool-registry.ts`):**
   - 6 tools registered with all fields: key, name, category, emoji, description, seo, routePath, component
   - `ToolRegistryEntry` type enforces shape
   - `ToolCategory` union: `'Color' | 'Encoding' | 'Image' | 'Time' | 'Unit'`
   - `ToolRegistryKey` union: all 6 tool keys
   - Contributors MUST add to both the registry AND the types when adding new tools

6. **E2E test infrastructure (story 4-1):**
   - `e2e/helpers/selectors.ts` — shared selectors for sidebar, command palette, tool inputs, outputs, copy button, toast, card, error messages
   - `e2e/helpers/fixtures.ts` — shared test data
   - `e2e/color-converter.spec.ts` — example tool E2E test pattern
   - `playwright.config.ts` — Chromium only, baseURL `localhost:5173`, dev server auto-start

7. **CI/CD pipeline (story 4-2):**
   - `.github/workflows/ci.yml` — lint + format:check + test + build + E2E tests
   - All steps use pnpm

8. **Lighthouse CI (story 4-3):**
   - `.github/workflows/lighthouse.yml` — Performance, Accessibility, SEO >= 90
   - `lighthouserc.cjs` — CommonJS config

9. **Validation utilities (`src/utils/validation.ts`):**
   - 8 validators: `isValidHex`, `isValidRgb`, `isValidHsl`, `isValidBase64`, `isValidUrl`, `isValidJson`, `isValidJwt`, `isValidUuid`, `isValidTimestamp`
   - All return `boolean`, never throw

10. **Error handling (`src/hooks/useToolError.ts`):**
    - Returns `{ error, setError, clearError }`
    - Used by all tool components

#### Key Design Decisions for CONTRIBUTING.md

**CONTRIBUTING.md is the primary contributor-facing document:**
- Should be self-contained — a contributor should NOT need to read architecture docs or project-context.md
- Should include concrete code examples (not just descriptions)
- Should reference actual file paths that exist in the project
- Should NOT duplicate the full architecture doc — just the contributor-relevant patterns

**The "Add a New Tool" workflow must reflect the CURRENT project state:**
- The old `docs/development-guide.md` pattern (register in `home/index.tsx`) is OUTDATED
- Current pattern: add to `TOOL_REGISTRY` in `src/constants/tool-registry.ts`
- Must also update `ToolCategory` and `ToolRegistryKey` types if new category/key
- Tool routes are auto-generated from the registry — no manual route setup needed

**Code examples must follow project conventions exactly:**
- No semicolons
- Single quotes
- `type` not `interface`
- `Array<T>` not `T[]`
- Named exports (no `export default` for components)
- `import type` for type-only imports
- `@/` path alias for all src imports
- `motion/react` for animations
- `tv()` from `@/utils` for Tailwind variants

**PR checklist should be actionable and concise:**
- Registry entry added with all required fields
- Types updated (ToolCategory, ToolRegistryKey if new)
- Barrel exports added/updated
- `useToolError` hook used for error handling
- Unit tests written (co-located `*.spec.ts`)
- E2E test written (`e2e/{tool-key}.spec.ts`)
- `pnpm lint` passes
- `pnpm format:check` passes
- `pnpm test` passes
- `pnpm build` succeeds

### Architecture Compliance

- **CONTRIBUTING.md at project root** — listed as NEW in architecture doc [Source: architecture.md#Project Directory Structure]
- **FR33 coverage:** "Contributors can add a new tool by following the CONTRIBUTING guide, which documents the required file structure (component, route, constants, tests) and a PR checklist" [Source: epics.md#Requirements Inventory]
- **FR34 coverage:** "Contributors can run the development environment locally with standard tooling" [Source: epics.md#Requirements Inventory]
- **FR35 coverage:** "Contributors can run tests to validate their changes against existing tool regression stories" [Source: epics.md#Requirements Inventory]
- **pnpm only** — all commands use pnpm [Source: project-context.md#Package Management]

### Library & Framework Requirements

- **No new dependencies** — This story creates documentation files only
- **No runtime changes** — Documentation does not affect the application bundle

### File Structure Requirements

**Files to CREATE:**

```
CONTRIBUTING.md    — Primary contributor guide at project root
```

**Files to MODIFY:**

```
README.md          — Update Contributing section to reference CONTRIBUTING.md
```

**Files NOT to modify:**
- `docs/development-guide.md` — Leave as-is (it's a generated reference doc, not the contributor guide)
- `src/**/*` — No source code changes
- `package.json` — No new scripts or dependencies
- Any workflow files — CI/CD infrastructure is done

### Testing Requirements

**No new tests to write.** This story creates documentation files only.

**Verification that documentation is accurate:**
- All file paths mentioned in CONTRIBUTING.md exist in the project
- All pnpm commands listed exist in `package.json` scripts
- Code examples compile and follow project conventions (no semicolons, single quotes, type not interface, Array<T> not T[])
- The "Add a New Tool" workflow steps reference the correct current patterns (TOOL_REGISTRY, not old home/index.tsx pattern)

### Previous Story Intelligence (Story 4-3)

From story 4-3 (Lighthouse CI Integration):
- **Infrastructure stories 4-1, 4-2, 4-3 are all complete** — CONTRIBUTING.md can reference:
  - E2E test infrastructure (Playwright, selectors, fixtures)
  - CI/CD pipeline (lint + format + test + build + E2E)
  - Lighthouse CI (performance, accessibility, SEO quality gates)
- **Commit pattern:** `✨: story 4-3` — sparkle emoji for new features
- **No source code was changed** in stories 4-1 through 4-3 — only infrastructure files

### Git Intelligence

Recent commits:
```
e5f588e ✨: story 4-3
ef7ad63 ✨: story 4-2
fd4a033 ✨: story 4-1
e1e1996 ✨: add close button to tool page Card to navigate home
35f808d 🐛: hide close button entirely when onClose is not provided
a8150f7 ♻️: story 3-7
```

**Pattern:** `✨:` prefix for new features/infrastructure. This story adds contributor documentation, so `📝: story 4-4` (docs emoji) is more appropriate than `✨:`.

### Latest Technical Information

**No web research needed for this story.** This is a documentation-only story. All referenced technologies are already established in the project with pinned versions. No API changes, library updates, or external dependencies to verify.

### Project Structure Notes

- `CONTRIBUTING.md` at project root — standard open-source convention alongside README.md, LICENSE
- Architecture doc lists `CONTRIBUTING.md` as NEW [Source: architecture.md#Project Directory Structure]
- No new directories created
- README.md already references contributing — just needs to point to CONTRIBUTING.md

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] — Acceptance criteria and story definition
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4] — Epic objectives: quality infrastructure and contributor experience
- [Source: _bmad-output/planning-artifacts/epics.md#Requirements Inventory] — FR33 (CONTRIBUTING guide), FR34 (local dev), FR35 (test validation)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Directory Structure] — CONTRIBUTING.md listed as NEW
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Tool registry pattern, naming conventions, anti-patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — Tool component file structure, E2E test structure
- [Source: _bmad-output/project-context.md] — 53 project rules (code conventions source of truth)
- [Source: docs/development-guide.md] — Existing dev guide (outdated "Add a Tool" section)
- [Source: README.md] — Existing contributing section (generic, references outdated tools)
- [Source: src/constants/tool-registry.ts] — Current registry pattern with 6 tools
- [Source: src/types/constants/tool-registry.ts] — ToolRegistryEntry, ToolCategory, ToolRegistryKey types
- [Source: src/hooks/useToolError.ts] — Error handling hook pattern
- [Source: src/utils/validation.ts] — Shared validation utilities (8 validators)
- [Source: e2e/helpers/selectors.ts] — Shared E2E selectors
- [Source: e2e/helpers/fixtures.ts] — Shared E2E test fixtures
- [Source: e2e/color-converter.spec.ts] — Example E2E test pattern
- [Source: playwright.config.ts] — E2E test configuration
- [Source: .github/workflows/ci.yml] — CI pipeline (lint, format, test, build, E2E)
- [Source: .github/workflows/lighthouse.yml] — Lighthouse CI quality gates
- [Source: _bmad-output/implementation-artifacts/4-1-e2e-test-infrastructure.md] — E2E infrastructure details
- [Source: _bmad-output/implementation-artifacts/4-2-ci-cd-pipeline.md] — CI/CD pipeline details
- [Source: _bmad-output/implementation-artifacts/4-3-lighthouse-ci-integration.md] — Lighthouse CI details

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered — documentation-only story with no runtime code changes.

### Completion Notes List

- Created comprehensive CONTRIBUTING.md (approx. 350 lines) at project root with all required sections: Prerequisites, Getting Started, Adding a New Tool (8-step workflow with full code examples), Code Conventions, Available Scripts, Project Structure, Testing, PR Checklist, CI/CD Quality Gates
- Updated README.md Contributing section to reference CONTRIBUTING.md instead of outdated inline guidelines (removed generic 5-step guidelines and ESLint/Prettier references)
- Verified 22 accuracy checks: 21/22 file paths, all 11 pnpm commands, all 7 code convention rules in examples. One finding corrected: `src/types/components/feature/` doesn't exist yet (prescribed convention for new tools) — added clarifying note in Step 2. Validation utilities: 9 validators (isValidHex, isValidRgb, isValidHsl, isValidBase64, isValidUrl, isValidJson, isValidJwt, isValidUuid, isValidTimestamp)
- All code examples follow project conventions: no semicolons, single quotes, `type` not `interface`, `Array<T>` not `T[]`, named exports, `import type`, `@/` path alias
- The "Add a New Tool" workflow uses current patterns (TOOL_REGISTRY, not the outdated home/index.tsx pattern)

### File List

- `CONTRIBUTING.md` — NEW: Primary contributor guide at project root
- `README.md` — MODIFIED: Updated Contributing section to reference CONTRIBUTING.md

### Change Log

- 2026-02-14: Created CONTRIBUTING.md and updated README.md Contributing section (Story 4-4)
- 2026-02-14: Code review fixes — added dashboard/sidebar/command-palette auto-population note to CONTRIBUTING.md (H1); updated README.md Development Tools from ESLint/Prettier to oxlint/oxfmt (M1), fixed "Run ESLint" to "Run oxlint" in Available Scripts (M2), replaced non-existent eslint.config.mjs with .oxlintrc.json/.oxfmtrc.json in Project Structure (M3); added e2e/platform/ directory to CONTRIBUTING.md project structure (L1), added .oxlintrc.json/.oxfmtrc.json to CONTRIBUTING.md project structure (L2), corrected validator count to 9 in completion notes (L3)
