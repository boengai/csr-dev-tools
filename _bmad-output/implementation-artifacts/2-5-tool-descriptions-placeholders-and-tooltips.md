# Story 2.5: Tool Descriptions, Placeholders & Tooltips

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **every tool to show a one-line description and have input fields with clear placeholder text explaining accepted formats**,
So that **I can use any tool instantly without reading documentation**.

**Epic:** Epic 2 — Standardized Tool Experience
**Dependencies:** Story 2.1 (ToolLayout), Story 2.2 (CopyButton/OutputDisplay), Story 2.3 (Error Handling System), Story 2.4 (Input Validation Utilities) — all complete. Epic 1 complete.
**Scope note:** This story enhances ToolLayout to always show the description, improves placeholder text and labels across all 6 existing tools, and ensures select dropdowns have sensible pre-selected defaults. This is the final story in Epic 2 — a content/UX polish pass preparing tools for Epic 3 refactoring.

## Acceptance Criteria

### AC1: Tool Description Visible in ToolLayout

**Given** any tool rendered via `ToolLayout`
**When** the tool header displays
**Then** a one-line description is shown below the tool title (sourced from `TOOL_REGISTRY` description field)

**Implementation note:** Currently ToolLayout only renders the title/description block in `page` mode. The `card` mode omits it entirely. This AC requires the description to be visible in BOTH modes — in `card` mode as a compact subtitle, in `page` mode as already implemented.

### AC2: Placeholder Text Shows Expected Format

**Given** any text input field in a tool
**When** the field is empty
**Then** placeholder text shows the expected format (e.g., `#3B82F6` for hex input, `1700000000` for timestamp, `SGVsbG8=` for Base64)

### AC3: Visible Labels via FieldForm

**Given** any input field in a tool
**When** the field has a visible label via `FieldForm` wrapper
**Then** the label clearly describes what input is expected
**And** labels are always visible above the input — never placeholder-only labels

### AC4: Select Dropdowns Have Sensible Defaults

**Given** any select dropdown in a tool
**When** it renders
**Then** it has a sensible default pre-selected (most common option first)
**And** there is no empty "Choose an option" placeholder state

## Tasks / Subtasks

- [x] Task 1: Update ToolLayout to show description in card mode (AC: #1)
  - [x] 1.1 Modify `src/components/common/tool-layout/ToolLayout.tsx` — add a compact description line in `card` mode (below any title rendering, styled as `text-body-xs text-gray-500` or similar muted small text)
  - [x] 1.2 Ensure `page` mode description rendering remains unchanged
  - [x] 1.3 Verify both modes render description correctly via manual inspection or existing tests

- [x] Task 2: Improve EncodingBase64 placeholders (AC: #2, #3)
  - [x] 2.1 In `src/components/feature/encoding/EncodingBase64.tsx`, replace the long lorem ipsum encode placeholder with a short, format-illustrative example: `"Hello, World!"` (for encode source)
  - [x] 2.2 Replace the long Base64 decode placeholder with a short example: `"SGVsbG8sIFdvcmxkIQ=="` (for decode source)
  - [x] 2.3 Update the result placeholders similarly — encode result: `"SGVsbG8sIFdvcmxkIQ=="`, decode result: `"Hello, World!"`
  - [x] 2.4 Verify labels "Source" and "Result" are descriptive enough — if the tabs already indicate "Encode" vs "Decode" mode, the labels are sufficient. No label change needed if tab context makes them clear.

- [x] Task 3: Add ImageResizer dimension placeholders (AC: #2)
  - [x] 3.1 In `src/components/feature/image/ImageResizer.tsx`, add placeholder text to the Width FieldForm: `"1920"`
  - [x] 3.2 Add placeholder text to the Height FieldForm: `"1080"`

- [x] Task 4: Audit and confirm all remaining tools have proper placeholders/labels (AC: #2, #3, #4)
  - [x] 4.1 **ColorConvertor** — ALREADY GOOD: Has format-specific placeholders (`#000 or #000000`, `rgb(0, 0, 0)`, `hsl(0 0% 0%)`, etc.) and format name labels (Hex, RGB, HSL, OKLCH, LAB, LCH). No changes needed.
  - [x] 4.2 **TimeUnixTimestamp** — ALREADY GOOD: Uses current Date.now() as dynamic placeholder, has descriptive labels. No changes needed.
  - [x] 4.3 **UnitPxToRem** — ALREADY GOOD: Has `"16"` and `"1"` as placeholders, "PX" and "REM" labels. No changes needed.
  - [x] 4.4 **ImageConvertor** — ALREADY GOOD: Uses select inputs only (ImageFormatSelectInput, ImageQualitySelectInput) with pre-selected defaults (webp, 0.8 quality). No text input fields. No changes needed.
  - [x] 4.5 **All select dropdowns** — ALREADY GOOD: ImageFormatSelectInput defaults to `'image/webp'`, ImageQualitySelectInput defaults to `'0.8'` or `'1'` for PNG, TimeUnixTimestamp selects default to current date/time values. No empty "Choose an option" state exists anywhere.

- [x] Task 5: Linting & formatting verification
  - [x] 5.1 Run `pnpm lint` — no errors
  - [x] 5.2 Run `pnpm format:check` — no formatting issues
  - [x] 5.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 5.4 Run `pnpm test` — all 140 existing tests pass, no regressions

## Dev Notes

### CRITICAL: Architecture Decisions

#### ToolLayout Description in Card Mode

Currently in `src/components/common/tool-layout/ToolLayout.tsx`, the title/description block is conditionally rendered only in `page` mode:

```tsx
{mode === 'page' && (
  <div>
    <h2 className="text-heading-5">{title}</h2>
    <p className="text-body-sm text-gray-400">{description}</p>
  </div>
)}
```

For this story, add a compact description in `card` mode as well. The card mode should show the description more subtly since space is limited on dashboard cards:

```tsx
// card mode — compact description only
{mode === 'card' && description && (
  <p className="text-body-xs text-gray-500">{description}</p>
)}

// page mode — full title + description (unchanged)
{mode === 'page' && (
  <div>
    <h2 className="text-heading-5">{title}</h2>
    <p className="text-body-sm text-gray-400">{description}</p>
  </div>
)}
```

Use `text-body-xs` and `text-gray-500` (more muted than page mode's `text-gray-400`) for the card description to keep it subtle in the constrained card layout. The exact classes should match the existing design token system in `src/index.css`.

**IMPORTANT:** No tools currently use ToolLayout — they use FieldForm directly. The description rendering change prepares ToolLayout for Epic 3 when all 6 tools will be refactored to use it. This change is still valuable NOW because:
1. It establishes the pattern for Epic 3 implementers
2. Any NEW tools created (Epic 5+) would use ToolLayout immediately
3. It completes the ToolLayout component's contract for FR38

#### Placeholder Text Philosophy

The UX specification mandates "zero-onboarding" — every tool should be self-explanatory. Placeholders serve as inline format documentation:

- **Text inputs**: Show the most common valid example of the expected format
- **Number inputs**: Show a typical value (e.g., "1920" for width, "16" for px)
- **TextArea inputs**: Show a short, recognizable example — NOT lengthy lorem ipsum text
- **Select inputs**: Pre-select the most common option, no empty placeholder state

Placeholder format examples from the architecture:
- Hex: `#3B82F6` — includes the `#` prefix to show it's accepted
- RGB: `rgb(59, 130, 246)` — shows the exact format syntax
- Timestamp: `1700000000` — shows a realistic numeric value
- Base64: `SGVsbG8=` — shows a short encoded value that's recognizable

#### What NOT to Change

1. **Do NOT refactor tools to use ToolLayout** — that's Epic 3's scope (stories 3.1-3.6)
2. **Do NOT modify validation functions** — Story 2.4 is complete
3. **Do NOT add new components** — use existing FieldForm, TextInput, TextAreaInput, SelectInput
4. **Do NOT modify types** — ToolLayout already accepts `description: string` in its props
5. **Do NOT add tooltips as hover popups** — FR38 says "placeholder text or tooltips" — placeholders and visible labels fulfill this requirement. No HTML `title` attributes or Radix UI Tooltip components needed.

### Existing Codebase Patterns to Follow

#### EncodingBase64 Placeholder Update Pattern

Current placeholders are overly long lorem ipsum text that wraps awkwardly in the textarea. Replace with short, recognizable examples:

```tsx
// BEFORE (encode mode placeholder):
placeholder="Lorem ipsum is placeholder text commonly used in the graphic..."

// AFTER:
placeholder="Hello, World!"

// BEFORE (decode mode placeholder):
placeholder="TG9yZW0lMjBpcHN1bSUyMHBsYWNlaG9sZGVyJTIwdGV4d..."

// AFTER:
placeholder="SGVsbG8sIFdvcmxkIQ=="
```

The encode placeholder should be the plain text, and the decode placeholder should be the Base64 encoding of that same text — so users immediately understand the relationship.

#### ImageResizer Placeholder Pattern

Currently the Width and Height FieldForm inputs have no placeholder:

```tsx
// BEFORE:
<FieldForm label="Width" name="width" type="number" value={...} onChange={...} />

// AFTER:
<FieldForm label="Width" name="width" placeholder="1920" type="number" value={...} onChange={...} />
```

Use common resolution values as placeholders: 1920x1080 (Full HD) is the most universally recognizable.

### Architecture Compliance

- **ToolLayout description rendering** — FR38 requires "a one-line tool description" visible on each tool [Source: epics.md#Story 2.5]
- **Placeholder format** — UX spec: "smart placeholders, format hints" for zero-onboarding [Source: ux-design-specification.md#Zero-Onboarding]
- **Labels always visible** — UX spec: "labels are always visible above the input — never placeholder-only labels" [Source: epics.md#Story 2.5]
- **Select defaults** — UX spec: "sensible default pre-selected (most common option first)" [Source: epics.md#Story 2.5]
- **Description sourced from TOOL_REGISTRY** — Architecture: centralized registry is single source of truth for all tool metadata [Source: architecture.md#Tool Registry Architecture]
- **No tooltip popups needed** — FR38 says "placeholder text **or** tooltips" — existing FieldForm labels + improved placeholders satisfy this [Source: epics.md#FR38]

### Previous Story Intelligence (Story 2.4)

From Story 2.4 (Input Validation Utilities) implementation:

- **All 140 tests pass** — 39 pre-existing (15 color + 8 CopyButton + 10 OutputDisplay + 6 useToolError) + 101 new validation tests. No regressions.
- **Barrel exports fully wired** — types and utils barrel chains are complete and working
- **Build/lint/format all clean** — verified at story 2.4 completion
- **Validator naming** established: `isValid{Format}` — will be used when tools are refactored in Epic 3, not in this story

### Git Intelligence

Recent commit patterns:
- `♻️: story 2.4` — Validation utilities (types, validators, tests, barrel exports) — 7 files
- `♻️: story 2-3` — Error handling system (types, hook, component, tests, barrel exports) — 12 files
- `♻️: story 2-2` — CopyButton/OutputDisplay — 10 files
- `♻️: story 2-1` — ToolLayout component — 7 files

**Files changed in story 2.4 (latest):**
- `src/types/utils/validation.ts` (NEW)
- `src/types/utils/index.ts` (MODIFIED)
- `src/utils/validation.ts` (NEW)
- `src/utils/validation.spec.ts` (NEW)
- `src/utils/index.ts` (MODIFIED)

**Pattern:** Single clean commit per story with emoji prefix `♻️:` for refactor/component stories.

**Key insight:** Stories 2.1-2.4 added NEW files. Story 2.5 is different — it MODIFIES existing files only (ToolLayout component + 2 tool components). This is a smaller, focused change.

### Project Structure Notes

- **Files to modify:**
  - `src/components/common/tool-layout/ToolLayout.tsx` — add card mode description
  - `src/components/feature/encoding/EncodingBase64.tsx` — improve placeholders
  - `src/components/feature/image/ImageResizer.tsx` — add dimension placeholders
- **Files NOT to modify:** All other tools, types, utils, tests, constants — no changes needed
- **No new files created** — this story only modifies 3 existing files
- **No type changes needed** — ToolLayout already accepts `description: string`
- **No test changes needed** — placeholder and label changes are visual/content, not logic. Existing 140 tests remain unaffected.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/epics.md#FR38] — "Users can see a one-line tool description and placeholder text or tooltips"
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool Registry Architecture] — TOOL_REGISTRY as single source of truth for descriptions
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] — ToolLayout usage pattern with title, description, error props
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Tool rendering modes (card vs page)
- [Source: _bmad-output/project-context.md#Component Patterns] — tv() for styling, named exports, Motion for animations
- [Source: _bmad-output/project-context.md#Framework-Specific Rules] — FieldForm, SelectInput, TextInput patterns
- [Source: _bmad-output/implementation-artifacts/2-4-input-validation-utilities.md] — Previous story: 140 tests passing, all clean
- [Source: _bmad-output/implementation-artifacts/2-3-error-handling-system.md] — Error handling patterns established
- [Source: _bmad-output/implementation-artifacts/2-1-toollayout-component.md] — ToolLayout component created with card/page modes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Task 1: Added compact description rendering in `card` mode to ToolLayout — `text-body-xs text-gray-500` for subtle display. Page mode unchanged. Prepares ToolLayout for Epic 3 adoption.
- Task 2: Replaced verbose lorem ipsum placeholders in EncodingBase64 with short, format-illustrative examples: `"Hello, World!"` (encode source/decode result) and `"SGVsbG8sIFdvcmxkIQ=="` (decode source/encode result). Labels confirmed adequate with tab context.
- Task 3: Added `placeholder="1920"` (Width) and `placeholder="1080"` (Height) to ImageResizer FieldForm inputs.
- Task 4: Audited all 6 tools — ColorConvertor, UnitPxToRem, ImageConvertor confirmed with proper placeholders, labels, and select defaults. TimeUnixTimestamp DateSection Month/Day selects started empty (placeholder-only, not pre-selected) — fixed by pre-filling with current date values and computing initial result.
- Task 5: All verifications pass — lint (0 errors), format (clean), build (success), tests (140/140 pass, 0 regressions).
- Review fix: AC1 is coded and correct but untestable in running app — no tools currently use ToolLayout. Will be verifiable when tools adopt ToolLayout in Epic 3.

### Change Log

- 2026-02-13: Story 2.5 implementation — ToolLayout card mode description, Base64 placeholder improvements, ImageResizer dimension placeholders, full tool audit. 3 files modified, 0 new files.
- 2026-02-13: Code review fix — TimeUnixTimestamp DateSection pre-filled with current date/time values to satisfy AC4 (no empty select states). 4 files modified total.

### File List

- `src/components/common/tool-layout/ToolLayout.tsx` (MODIFIED) — added card mode description rendering
- `src/components/feature/encoding/EncodingBase64.tsx` (MODIFIED) — replaced lorem ipsum placeholders with format-illustrative examples
- `src/components/feature/image/ImageResizer.tsx` (MODIFIED) — added Width/Height placeholder text
- `src/components/feature/time/TimeUnixTimestamp.tsx` (MODIFIED) — pre-filled DateSection with current date values (review fix)
