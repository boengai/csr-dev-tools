# Story 24.4: Chmod Calculator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer/devops engineer**,
I want **to convert between symbolic (rwxr-xr-x), octal (755), and visual (checkbox) chmod notations**,
so that **I can quickly determine correct file permissions**.

## Acceptance Criteria

1. **Given** the user enters an octal permission (e.g., 755)
   **When** entered
   **Then** the symbolic notation (rwxr-xr-x) and a 3x3 checkbox grid (owner/group/other x read/write/execute) are updated

2. **Given** the user toggles checkboxes in the visual grid
   **When** a checkbox changes
   **Then** both octal and symbolic notations update in real-time

3. **Given** the user types symbolic notation (e.g., rwxr-xr-x)
   **When** entered
   **Then** octal and checkbox grid update accordingly

4. **Given** common presets (644, 755, 777, 600, 400)
   **When** selected
   **Then** all three representations update

5. **Given** any notation
   **When** displayed
   **Then** a human-readable description is shown (e.g., "Owner: read, write, execute | Group: read, execute | Other: read, execute")

## Tasks / Subtasks

- [x] Task 1: Create chmod utility functions (AC: #1, #2, #3, #4, #5)
  - [x] 1.1 Create `src/utils/chmod-calculator.ts`
  - [x] 1.2 Define `ChmodPermission` type: `{ read: boolean, write: boolean, execute: boolean }`
  - [x] 1.3 Define `ChmodState` type: `{ owner: ChmodPermission, group: ChmodPermission, other: ChmodPermission }`
  - [x] 1.4 Implement `octalToState(octal: string): ChmodState | null` — parses 3-digit octal (e.g., "755") into permission state, returns null for invalid input
  - [x] 1.5 Implement `stateToOctal(state: ChmodState): string` — converts permission state to 3-digit octal string (e.g., "755")
  - [x] 1.6 Implement `symbolicToState(symbolic: string): ChmodState | null` — parses 9-char symbolic (e.g., "rwxr-xr-x") into permission state, returns null for invalid
  - [x] 1.7 Implement `stateToSymbolic(state: ChmodState): string` — converts permission state to 9-char symbolic (e.g., "rwxr-xr-x")
  - [x] 1.8 Implement `stateToDescription(state: ChmodState): string` — returns human-readable description (e.g., "Owner: read, write, execute | Group: read, execute | Other: read, execute")
  - [x] 1.9 Implement `isValidOctal(input: string): boolean` — validates 3-digit octal (each digit 0-7)
  - [x] 1.10 Implement `isValidSymbolic(input: string): boolean` — validates 9-char rwx/- notation
  - [x] 1.11 Implement `permissionToDigit(perm: ChmodPermission): number` — converts single permission group to octal digit (0-7)
  - [x] 1.12 Implement `digitToPermission(digit: number): ChmodPermission` — converts octal digit (0-7) to permission booleans
  - [x] 1.13 Add barrel export in `src/utils/index.ts`

- [x] Task 2: Create unit tests for chmod utility functions (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `src/utils/chmod-calculator.spec.ts`
  - [x] 2.2 Test `octalToState()` — "755" returns owner:rwx, group:rx, other:rx
  - [x] 2.3 Test `octalToState()` — "644" returns owner:rw, group:r, other:r
  - [x] 2.4 Test `octalToState()` — "000" returns all false
  - [x] 2.5 Test `octalToState()` — "777" returns all true
  - [x] 2.6 Test `octalToState()` — invalid input ("888", "abc", "75", "7777") returns null
  - [x] 2.7 Test `stateToOctal()` — roundtrip: octalToState("755") → stateToOctal → "755"
  - [x] 2.8 Test `symbolicToState()` — "rwxr-xr-x" returns owner:rwx, group:rx, other:rx
  - [x] 2.9 Test `symbolicToState()` — "rw-r--r--" returns owner:rw, group:r, other:r
  - [x] 2.10 Test `symbolicToState()` — "---------" returns all false
  - [x] 2.11 Test `symbolicToState()` — invalid input ("rwxrwxrw", "abc", "rwx") returns null
  - [x] 2.12 Test `stateToSymbolic()` — roundtrip: symbolicToState("rwxr-xr-x") → stateToSymbolic → "rwxr-xr-x"
  - [x] 2.13 Test `stateToDescription()` — "755" state produces "Owner: read, write, execute | Group: read, execute | Other: read, execute"
  - [x] 2.14 Test `stateToDescription()` — "000" state produces "Owner: none | Group: none | Other: none"
  - [x] 2.15 Test `stateToDescription()` — "400" state produces "Owner: read | Group: none | Other: none"
  - [x] 2.16 Test `isValidOctal()` — valid: "000", "755", "644", "777" → true; invalid: "888", "9", "abc", "", "0755" → false
  - [x] 2.17 Test `isValidSymbolic()` — valid: "rwxrwxrwx", "---------", "rw-r--r--" → true; invalid: "rwx", "abcdefghi" → false
  - [x] 2.18 Test `permissionToDigit()` — {r:true,w:true,x:true}→7, {r:true,w:false,x:false}→4, all false→0
  - [x] 2.19 Test `digitToPermission()` — 7→rwx, 5→rx, 4→r, 0→none

- [x] Task 3: Create ChmodCalculator component (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `src/components/feature/security/ChmodCalculator.tsx`
  - [x] 3.2 Update `src/components/feature/security/index.ts` — add barrel export (alphabetical)
  - [x] 3.3 Implement main layout: description from `TOOL_REGISTRY_MAP['chmod-calculator']`, three synced sections
  - [x] 3.4 **Octal Input**: TextInput for 3-digit octal (e.g., "755"), validates on change, updates other representations in real-time
  - [x] 3.5 **Symbolic Input**: TextInput for 9-char symbolic (e.g., "rwxr-xr-x"), validates on change, updates other representations in real-time
  - [x] 3.6 **Checkbox Grid**: 3x3 grid of checkboxes — rows: Owner, Group, Other; columns: Read (r), Write (w), Execute (x). Each toggle updates octal and symbolic inputs in real-time
  - [x] 3.7 **Presets**: Row of preset buttons (644, 755, 777, 600, 400) — clicking populates all three representations
  - [x] 3.8 **Human-Readable Description**: Display `stateToDescription()` output below the grid (aria-live="polite")
  - [x] 3.9 **Command Preview**: Show the `chmod` command (e.g., `chmod 755 filename`) with CopyButton
  - [x] 3.10 Implement error handling: invalid octal or symbolic input shows inline validation error (amber text) — no toast needed for live validation
  - [x] 3.11 Initialize with default preset 755

- [x] Task 4: Register tool and configure routing (AC: all)
  - [x] 4.1 Add `'chmod-calculator'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts` (alphabetical)
  - [x] 4.2 Add registry entry in `src/constants/tool-registry.ts` (alphabetical within Security category)
  - [x] 4.3 Add prerender route `/tools/chmod-calculator` in `vite.config.ts` `toolRoutes` array (alphabetical)

- [x] Task 5: Implement accessibility (AC: all)
  - [x] 5.1 Add `aria-live="polite"` on description and output regions
  - [x] 5.2 Add `aria-label` on each checkbox (e.g., "Owner read permission", "Group write permission")
  - [x] 5.3 Add `role="group"` with `aria-labelledby` on each permission row (Owner, Group, Other)
  - [x] 5.4 Ensure full keyboard navigation (Tab through all inputs, checkboxes, preset buttons)
  - [x] 5.5 Ensure WCAG 2.1 AA contrast ratios on all text
  - [x] 5.6 Checkbox labels must include both group and permission type — not just "r"/"w"/"x"

- [x] Task 6: Create E2E tests (AC: all)
  - [x] 6.1 Create `e2e/chmod-calculator.spec.ts`
  - [x] 6.2 Test: navigate to tool page, verify title and description
  - [x] 6.3 Test: enter octal "755" → symbolic shows "rwxr-xr-x", checkbox grid matches
  - [x] 6.4 Test: enter octal "644" → symbolic shows "rw-r--r--", checkbox grid matches
  - [x] 6.5 Test: toggle checkbox (e.g., uncheck owner execute on 755) → octal updates to "655", symbolic updates
  - [x] 6.6 Test: click preset "777" → octal shows "777", symbolic shows "rwxrwxrwx", all checkboxes checked
  - [x] 6.7 Test: click preset "400" → octal shows "400", symbolic shows "r--------", only owner-read checked
  - [x] 6.8 Test: human-readable description shows for "755"
  - [x] 6.9 Test: CopyButton on command preview copies "chmod 755 filename"
  - [x] 6.10 Test: mobile viewport (375px) responsiveness

- [x] Task 7: Verify build and tests pass
  - [x] 7.1 Run `pnpm lint` — 0 errors
  - [x] 7.2 Run `pnpm format` — compliant
  - [x] 7.3 Run `pnpm test` — all tests pass (0 regressions)
  - [x] 7.4 Run `pnpm build` — clean build
  - [x] 7.5 Run E2E tests — all pass

## Dev Notes

### Architecture Compliance

- **Technical Stack**: React 19.2.4, TypeScript 5.9.3 (strict), Vite 7.3.1, Tailwind CSS 4.1.18, Motion 12.34.0
- **Component Pattern**: Named export `export const ChmodCalculator`, no default export
- **State**: `useState` for local UI state (permission state, octal string, symbolic string)
- **Error Handling**: Inline validation errors (amber text) for invalid input — no toast for live validation feedback
- **Styling**: Tailwind CSS v4 classes, `tv()` from `@/utils` for component variants, OKLCH color space
- **Animations**: Import from `motion/react` (NOT `framer-motion`) — use for preset button interactions
- **Code Quality**: oxlint + oxfmt — no semicolons, single quotes, trailing commas, 120 char width
- **No External Dependencies**: Pure TypeScript bit manipulation — no libraries to install

### Zero Dependencies

**This tool requires NO npm packages.** Chmod calculation is pure bit arithmetic:
- Read = 4 (bit 2), Write = 2 (bit 1), Execute = 1 (bit 0)
- Each octal digit (0-7) maps directly to rwx booleans via bitwise AND
- Conversion is synchronous and O(1) — no async, no lazy loading needed

**Bit mapping reference:**
```
r = 4 (100)
w = 2 (010)
x = 1 (001)

Examples:
7 = 111 = rwx (4+2+1)
6 = 110 = rw- (4+2)
5 = 101 = r-x (4+1)
4 = 100 = r-- (4)
0 = 000 = --- (0)
```

### Category and Domain Placement

**Category**: `'Security'` (already exists — created in Story 24.1)
**Component Directory**: `src/components/feature/security/ChmodCalculator.tsx`
**Emoji**: 🛡️
**Key**: `chmod-calculator`
**Route**: `/tools/chmod-calculator`

### Tool Type: Live/Real-Time Converter

**This is a live synchronous tool.** Per architecture:
- Processing trigger: Immediate on any input change (octal, symbolic, checkbox)
- No debounce needed — calculations are synchronous O(1) bit operations
- All three representations stay in sync at all times
- This is similar to the Color Converter pattern (multiple representations synced in real-time)
- No button click needed — results appear instantly

### Component Implementation Pattern

```
src/components/feature/security/ChmodCalculator.tsx
├── Tool description from TOOL_REGISTRY_MAP['chmod-calculator']
│
├── Preset Buttons Row
│   ├── Button: "644" (files: owner rw, others read)
│   ├── Button: "755" (dirs: owner rwx, others rx)
│   ├── Button: "777" (all permissions)
│   ├── Button: "600" (owner only rw)
│   └── Button: "400" (owner read only)
│
├── Input Section (flex row on desktop, stack on mobile)
│   ├── Octal Input
│   │   ├── TextInput: 3-digit octal, placeholder "755"
│   │   └── Inline validation error (if invalid)
│   └── Symbolic Input
│       ├── TextInput: 9-char symbolic, placeholder "rwxr-xr-x", monospace
│       └── Inline validation error (if invalid)
│
├── Checkbox Grid (3x3)
│   ├── Header Row: [blank] | Read | Write | Execute
│   ├── Owner Row:  "Owner"  | [x]  | [x]   | [x]
│   ├── Group Row:  "Group"  | [x]  | [ ]   | [x]
│   └── Other Row:  "Other"  | [x]  | [ ]   | [x]
│
├── Human-Readable Description (aria-live="polite")
│   └── "Owner: read, write, execute | Group: read, execute | Other: read, execute"
│
├── Command Preview + CopyButton
│   └── "chmod 755 filename"
│
└── No dialog, no tabs — all visible at once
```

### Existing Utilities to REUSE

**Hooks to Use:**
- `useCopyToClipboard` from `@/hooks` — used internally by CopyButton
- Do NOT use `useDebounceCallback` — calculations are synchronous, no debounce needed
- Do NOT use `useToast` — inline validation only for this tool

**Components to Use:**
- `TextInput` from `@/components/common` — for octal and symbolic inputs
- `CopyButton` from `@/components/common` — for command preview copy
- `Button` from `@/components/common` — for preset buttons
- Do NOT use Tabs — all content visible simultaneously (not tabbed)

### Registry Entry Format

```typescript
{
  category: 'Security',
  component: lazy(() =>
    import('@/components/feature/security/ChmodCalculator').then(
      ({ ChmodCalculator }: { ChmodCalculator: ComponentType }) => ({
        default: ChmodCalculator,
      }),
    ),
  ),
  description: 'Convert between symbolic (rwxr-xr-x), octal (755), and visual chmod notations. Toggle permissions with an interactive checkbox grid and common presets.',
  emoji: '\u{1F6E1}\uFE0F',
  key: 'chmod-calculator',
  name: 'Chmod Calculator',
  routePath: '/tools/chmod-calculator',
  seo: {
    description:
      'Calculate Unix file permissions online. Convert between octal (755), symbolic (rwxr-xr-x), and visual checkbox notation. Interactive chmod calculator with common presets. Free client-side tool.',
    title: 'Chmod Calculator - CSR Dev Tools',
  },
}
```

### UX / Interaction Requirements

- **Live sync pattern**: All three representations (octal, symbolic, checkbox) update instantly when any one changes
- **Preset buttons**: Prominent row above inputs, styled as toggle-able chips/buttons. Active preset highlighted
- **Checkbox grid**: Visually clear 3x3 grid with labeled rows (Owner, Group, Other) and columns (Read, Write, Execute). Use native checkboxes styled with Tailwind — no need for Radix checkbox here (native checkboxes are fully accessible)
- **Monospace symbolic**: Symbolic input uses monospace font for alignment
- **Octal validation**: Accept only 3 digits, each 0-7. Show amber inline error for invalid input. Do not clear other fields on invalid input — just show error
- **Symbolic validation**: Accept only 9 characters of [rwx-]. Show amber inline error for invalid input
- **Command preview**: Show `chmod {octal} filename` as a copyable string. "filename" is a placeholder text
- **Initial state**: Default to "755" on load — most common directory permission
- **Mobile**: Grid stacks naturally, inputs full-width, 375px min viewport, 44px+ touch targets for checkboxes
- **No tabs needed**: All content fits on one screen — show everything simultaneously

### Chmod Common Presets Reference

| Octal | Symbolic | Usage |
|-------|----------|-------|
| 644 | rw-r--r-- | Standard file permissions |
| 755 | rwxr-xr-x | Standard directory/executable |
| 777 | rwxrwxrwx | Full access (avoid in production) |
| 600 | rw------- | Private file (owner only) |
| 400 | r-------- | Read-only (owner only) |

### Previous Story Intelligence (24.3 Bcrypt Hasher)

Key learnings from Story 24.3 to apply here:

1. **CopyButton/clipboard pattern**: Use CopyButton component with `label` and `value` props — never raw `navigator.clipboard`
2. **Barrel export ordering**: Maintain alphabetical order in barrel exports
3. **E2E test selectors**: Use `exact: true` for toast text matching; import from `./helpers/selectors`
4. **Spec files need explicit imports**: `import { describe, expect, it } from 'vitest'` (for tsc build)
5. **Registration checklist**: types union → registry entry → vite prerender → barrel exports
6. **Security category already exists**: `'Security'` is already in ToolCategory and CATEGORY_ORDER — no need to create
7. **Tool description display**: Read from `TOOL_REGISTRY_MAP[key]?.description` and render as `<p>` tag
8. **Tabs trigger lesson**: If using Radix Tabs, ALWAYS include `trigger` prop. (Not applicable here — no tabs)
9. **Build warnings**: Avoid mixed static/dynamic imports of the same module. (Not applicable here — no lazy-loaded dependencies)
10. **Live elapsed timer pattern**: useRef for timer interval, cleanup on unmount. (Not applicable here — synchronous calculations)
11. **Inline warnings (amber text)**: Used for informational feedback (e.g., bcrypt truncation warning). Apply same pattern for validation errors.
12. **Code review common fixes**: Keyboard accessibility (focus-visible), dead code removal, barrel export ordering, ToolRegistryKey alphabetical ordering

### Git Intelligence

Recent commit patterns from Epic 24:
- `cdf72f2` — `🔒 Bcrypt Hasher + 🔍 code review fixes (Story 24.3)` — 13 files changed
- `bf9e5d8` — `📜 Certificate Decoder + 🔍 code review fixes (Story 24.2)`
- `a107ab4` — `🔑 SSH Key Fingerprint Viewer + 🔍 code review fixes (Story 24.1)`

**Commit message pattern**: `{emoji} {Tool Name} + 🔍 code review fixes (Story {epic}.{story})`
Suggested for this story: `🛡️ Chmod Calculator + 🔍 code review fixes (Story 24.4)`

**Files pattern from 24.3 (13 files):**
- `package.json` + `pnpm-lock.yaml` — dependency changes (NOT needed for this story — no new deps)
- `src/utils/{tool}.ts` + `src/utils/{tool}.spec.ts` — utility + tests
- `src/utils/index.ts` — barrel export
- `src/components/feature/security/{Tool}.tsx` — component
- `src/components/feature/security/index.ts` — barrel export
- `src/types/constants/tool-registry.ts` — ToolRegistryKey union
- `src/constants/tool-registry.ts` — registry entry
- `vite.config.ts` — prerender route
- `e2e/{tool}.spec.ts` — E2E tests

This story should follow the same pattern minus package.json/lockfile (no new dependencies).

### Project Structure Notes

- **Existing directory**: `src/components/feature/security/` — already exists from Stories 24.1, 24.2, 24.3
- **Security category already exists**: `'Security'` in ToolCategory and CATEGORY_ORDER — no changes needed
- **Security barrel already exists**: `src/components/feature/security/index.ts` — just add new export
- **No new dependencies**: Pure TypeScript bit manipulation — no package.json changes
- **Utility location**: `src/utils/chmod-calculator.ts` — all conversion, validation, and description logic as pure functions

### File Locations & Naming

| File | Path |
|---|---|
| Utility functions | `src/utils/chmod-calculator.ts` |
| Utility tests | `src/utils/chmod-calculator.spec.ts` |
| Component | `src/components/feature/security/ChmodCalculator.tsx` |
| Security barrel update | `src/components/feature/security/index.ts` |
| E2E test | `e2e/chmod-calculator.spec.ts` |
| Registry key type | `src/types/constants/tool-registry.ts` |
| Registry entry | `src/constants/tool-registry.ts` |
| Prerender route | `vite.config.ts` → `toolRoutes` array |
| Utils barrel update | `src/utils/index.ts` |

### Code Conventions (Enforced)

- `type` over `interface`
- `Array<T>` over `T[]`
- `import type` for type-only imports
- Named exports only (no default export for components)
- `@/` path alias for all imports
- Let TypeScript infer where possible
- No `console.log` statements
- Explicit `import { describe, expect, it } from 'vitest'` in spec files (for tsc build)
- Alphabetical ordering in object keys, barrel exports, union types

### References

- [Source: _bmad-output/planning-artifacts/epics-expansion-3.md#Epic 24 Story 24.4]
- [Source: _bmad-output/project-context.md#Implementation Rules, Adding a New Tool]
- [Source: _bmad-output/implementation-artifacts/24-3-bcrypt-hasher.md — previous story patterns and learnings]
- [Source: src/constants/tool-registry.ts — registry entry pattern and CATEGORY_ORDER]
- [Source: src/types/constants/tool-registry.ts — ToolRegistryKey and ToolCategory types]
- [Source: vite.config.ts — prerender route registration]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Build initially failed due to `id` and `maxLength` props not being part of `TextInputProps` type — resolved by removing unsupported props and using wrapping `<label>` elements instead of `htmlFor`

### Completion Notes List

- Implemented all chmod utility functions as pure TypeScript bitwise operations — zero external dependencies
- Created 31 unit tests covering all conversion functions, roundtrip tests, validation, and edge cases
- Built ChmodCalculator component with live-sync between octal, symbolic, and checkbox grid representations
- Added 5 preset buttons (644, 755, 777, 600, 400) with active highlighting
- Implemented inline amber validation errors for invalid octal/symbolic input
- Added command preview with CopyButton (`chmod {octal} filename`)
- Full accessibility: aria-labels on all checkboxes, aria-live regions, role="group" on permission rows, keyboard navigation
- Created 10 E2E tests covering all acceptance criteria including mobile responsiveness and symbolic input (AC #3)
- All quality gates passed: lint (0 errors), format, 1151 unit tests (0 regressions), clean build, 10 E2E tests

### Change Log

- 2026-02-24: Implemented Chmod Calculator tool (Story 24.4) — all 7 tasks complete, all ACs satisfied
- 2026-02-24: Code review fixes — 8 issues fixed (5 MEDIUM, 3 LOW): pure setState updater, removed role="grid", added aria-live on command preview, increased checkbox touch targets to 44px+, added E2E test for symbolic input (AC #3), switched to aria-labelledby, removed dead PRESETS data, added roundtrip tests

### File List

- `src/utils/chmod-calculator.ts` (new) — Permission types and conversion/validation functions
- `src/utils/chmod-calculator.spec.ts` (new) — 31 unit tests for utility functions
- `src/utils/index.ts` (modified) — Added chmod-calculator barrel export
- `src/components/feature/security/ChmodCalculator.tsx` (new) — Main component
- `src/components/feature/security/index.ts` (modified) — Added ChmodCalculator barrel export
- `src/types/constants/tool-registry.ts` (modified) — Added 'chmod-calculator' to ToolRegistryKey
- `src/constants/tool-registry.ts` (modified) — Added registry entry in Security category
- `vite.config.ts` (modified) — Added prerender route /tools/chmod-calculator
- `e2e/chmod-calculator.spec.ts` (new) — 10 E2E tests
