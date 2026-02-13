# Story 2.2: CopyButton & OutputDisplay Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to copy any tool output with a single click and see results in a clean, formatted display**,
So that **I can quickly capture outputs and paste them directly into my code**.

**Epic:** Epic 2 — Standardized Tool Experience
**Dependencies:** Story 2.1 (ToolLayout component) complete. Epic 1 complete (TOOL_REGISTRY, design tokens, sidebar, command palette).
**Scope note:** This story creates the `CopyButton` and `OutputDisplay` components. It does NOT refactor existing tools to use them — that happens in Epic 3 stories. However, both components must be designed to accommodate all current and planned tool output patterns.

## Acceptance Criteria

### AC1: CopyButton Click Copies to Clipboard

**Given** a `CopyButton` component in `src/components/common/button/`
**When** the user clicks it
**Then** the associated value is copied to the clipboard
**And** the icon morphs from clipboard to check mark (300ms transition via Motion)
**And** a toast appears: "Copied to clipboard" (auto-dismiss 2.5s)
**And** the icon reverts to clipboard after 2 seconds

### AC2: CopyButton Variants

**Given** `CopyButton` has two variants
**When** rendered as `icon-only` — it shows only the icon (compact, for inline use next to output values)
**When** rendered as `labeled` — it shows icon + "Copy" text (for action bars)

### AC3: CopyButton Disabled State

**Given** `CopyButton` with nothing to copy
**When** the output value is empty or undefined
**Then** the button is disabled (pointer-events-none, opacity-50)

### AC4: OutputDisplay Renders Formatted Output

**Given** an `OutputDisplay` component in `src/components/common/output/`
**When** it receives a value
**Then** it renders the formatted result with an adjacent `CopyButton`

### AC5: OutputDisplay Variants

**Given** `OutputDisplay` has three variants:
- **`single`** — shows one copyable value (e.g., "rgb(59, 130, 246)") with adjacent icon-only CopyButton
- **`table`** — shows multiple key-value pairs, each with their own icon-only CopyButton
- **`code`** — shows a monospace code block with syntax-appropriate formatting and a CopyButton

### AC6: OutputDisplay Value Change Animation

**Given** the output value changes
**When** a new value is computed
**Then** the `OutputDisplay` shows a brief highlight flash (200ms background pulse via Motion)
**And** screen readers are notified via `aria-live="polite"`

### AC7: TypeScript Types & Barrel Exports

**Given** types for CopyButton and OutputDisplay
**When** a developer imports them
**Then** `CopyButtonProps`, `CopyButtonVariants`, `OutputDisplayProps`, `OutputDisplayVariants` are available via `@/types`
**And** components are available via `@/components` barrel export chain

## Tasks / Subtasks

- [x] Task 1: Create CopyButton types (AC: #2, #3, #7)
  - [x] 1.1 Create `src/types/components/common/button.ts` — add `CopyButtonProps` and `CopyButtonVariants` types (extend existing file)
  - [x] 1.2 Verify export from `src/types/components/common/index.ts` (already exports button)

- [x] Task 2: Create CopyButton component (AC: #1, #2, #3)
  - [x] 2.1 Create `src/components/common/button/CopyButton.tsx`
  - [x] 2.2 Implement clipboard copy using existing `useCopyToClipboard` hook (which already handles clipboard write + toast)
  - [x] 2.3 Implement icon morph: CopyIcon → CheckIcon (300ms transition via `motion/react` `AnimatePresence` + opacity/scale)
  - [x] 2.4 Implement 2-second revert timer via `useEffect` + `setTimeout` (cleanup on unmount)
  - [x] 2.5 Implement `icon-only` variant: compact button showing only icon
  - [x] 2.6 Implement `labeled` variant: icon + "Copy" text label
  - [x] 2.7 Implement disabled state when `value` is empty string or undefined
  - [x] 2.8 Add `aria-label="Copy to clipboard"` for accessibility
  - [x] 2.9 Export from `src/components/common/button/index.ts`

- [x] Task 3: Create OutputDisplay types (AC: #5, #7)
  - [x] 3.1 Create `src/types/components/common/output.ts` with `OutputDisplayProps`, `OutputDisplayVariants`, `OutputDisplayTableRow` types
  - [x] 3.2 Export from `src/types/components/common/index.ts`

- [x] Task 4: Create OutputDisplay component (AC: #4, #5, #6)
  - [x] 4.1 Create `src/components/common/output/OutputDisplay.tsx`
  - [x] 4.2 Implement `single` variant: value text + adjacent icon-only CopyButton
  - [x] 4.3 Implement `table` variant: list of `{ label, value }` rows, each with its own icon-only CopyButton
  - [x] 4.4 Implement `code` variant: monospace `<pre><code>` block with CopyButton in top-right corner
  - [x] 4.5 Implement value change highlight flash (200ms background pulse via `motion/react` `motion.div` with `key={value}` to trigger re-animation)
  - [x] 4.6 Add `aria-live="polite"` on the output container for screen reader announcements
  - [x] 4.7 Add `aria-label` prop for describing the output context
  - [x] 4.8 Create `src/components/common/output/index.ts` barrel export
  - [x] 4.9 Export from `src/components/common/index.ts`

- [x] Task 5: Linting & formatting verification
  - [x] 5.1 Run `pnpm lint` — no errors
  - [x] 5.2 Run `pnpm format:check` — no formatting issues
  - [x] 5.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 5.4 Run `pnpm test` — all tests pass (33 total: 15 color + 8 CopyButton + 10 OutputDisplay)

## Dev Notes

### CRITICAL: Component Architecture Decisions

#### CopyButton Reuses Existing `useCopyToClipboard` Hook

The project already has a `useCopyToClipboard` hook at `src/hooks/useCopyToClipboard.ts` that:
1. Writes to `navigator.clipboard`
2. Triggers a toast: `{ label: 'Copied to clipboard', type: 'success' }`

CopyButton MUST use this existing hook. Do NOT re-implement clipboard logic or toast triggering. The CopyButton's job is the icon morph animation and the variant styling — the clipboard+toast behavior is delegated to the hook.

```typescript
// CORRECT — reuse existing hook
const copyToClipboard = useCopyToClipboard()
const handleClick = async () => {
  await copyToClipboard(value)
  setIsCopied(true) // triggers icon morph
}

// WRONG — reimplementing clipboard logic
await navigator.clipboard.writeText(value) // DON'T DO THIS
```

#### CopyButton Icon Morph Animation

The icon transition uses `motion/react`'s `AnimatePresence` for enter/exit animations on the icon swap:
- Default state: `CopyIcon` (existing at `src/components/common/icon/CopyIcon.tsx`)
- Copied state: `CheckIcon` (existing at `src/components/common/icon/CheckIcon.tsx`)
- Transition: 300ms opacity + scale
- Revert: after 2 seconds via `setTimeout`, resets `isCopied` state to false

Both icons already exist — do NOT create new icon components.

#### CopyButton Is NOT the Existing Button Component

CopyButton is a **new, lightweight component** — NOT a wrapper around the existing `Button.tsx`. The existing `Button` has heavy motion animations (hover lift, tap scale, drop shadow) that are inappropriate for a small inline copy icon. CopyButton is a simpler `<button>` (or `motion.button` for the icon animation only) with its own `tv()` variants.

#### OutputDisplay Variant Implementations

**`single` variant:**
```
┌──────────────────────────────┐
│ rgb(59, 130, 246)   [📋]    │
└──────────────────────────────┘
```
- Inline flex: value text + icon-only CopyButton
- Value uses `text-body-sm font-mono` for developer-friendly output
- Empty state: show "—" (em dash) when value is empty

**`table` variant:**
```
┌──────────────────────────────┐
│ HEX   #3b82f6         [📋]  │
│ RGB   rgb(59, 130, 246) [📋] │
│ HSL   hsl(217, 91%, 60%) [📋]│
└──────────────────────────────┘
```
- Each row: label (text-gray-400) + value (font-mono) + icon-only CopyButton
- Rows separated by subtle borders or spacing
- Each CopyButton copies only its row's value

**`code` variant:**
```
┌──────────────────────────────┐
│                       [📋]   │
│ {                            │
│   "name": "test",            │
│   "value": 42                │
│ }                            │
└──────────────────────────────┘
```
- `<pre><code>` block with `font-mono text-body-sm`
- CopyButton positioned top-right (absolute positioned)
- Copies the entire code block content
- Horizontal scroll for long lines (overflow-x-auto)

#### Value Change Highlight Animation

Use `motion/react`'s `motion.div` with a key-based remount to trigger the animation on value change:

```typescript
<motion.div
  key={value} // Forces remount on value change → triggers initial animation
  initial={{ backgroundColor: 'oklch(0.55 0.22 310 / 0.15)' }} // subtle primary tint
  animate={{ backgroundColor: 'oklch(0 0 0 / 0)' }} // fade to transparent
  transition={{ duration: 0.2 }}
>
  {/* output content */}
</motion.div>
```

This approach is lightweight and avoids managing animation state manually. The `key` prop causes React to unmount/remount the element when value changes, triggering the `initial` → `animate` transition.

**IMPORTANT:** For the `table` variant, the highlight should apply to the entire table container, not individual rows. The `key` should be derived from a hash or join of all values to detect any change.

### Existing Codebase Patterns to Follow

#### `tv()` Variant Pattern (CopyButton)

```typescript
import type { CompVariant, CopyButtonVariants } from '@/types'
import { tv } from '@/utils'

const copyButtonVariants: CompVariant<CopyButtonVariants> = tv({
  base: 'inline-flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      'icon-only': 'rounded-md p-1 text-gray-400 hover:text-white',
      labeled: 'rounded-md gap-2 px-3 py-1 text-body-sm text-gray-400 hover:text-white',
    },
  },
})
```

#### `tv()` Variant Pattern (OutputDisplay)

```typescript
import type { CompVariant, OutputDisplayVariants } from '@/types'
import { tv } from '@/utils'

const outputDisplayVariants: CompVariant<OutputDisplayVariants> = tv({
  base: 'relative rounded-sm',
  variants: {
    variant: {
      code: 'overflow-x-auto bg-gray-900 p-3 font-mono text-body-sm',
      single: 'flex items-center gap-2',
      table: 'flex flex-col gap-1',
    },
  },
})
```

#### File Structure Convention

```
src/components/common/button/
  Button.tsx              # Existing — DO NOT MODIFY
  CopyButton.tsx          # NEW — Named export: export const CopyButton = ...
  index.ts                # MODIFY — add CopyButton export

src/components/common/output/
  OutputDisplay.tsx        # NEW — Named export: export const OutputDisplay = ...
  index.ts                # NEW — Barrel: export { OutputDisplay } from './OutputDisplay'

src/types/components/common/
  button.ts               # MODIFY — add CopyButtonProps, CopyButtonVariants
  output.ts               # NEW — OutputDisplayProps, OutputDisplayVariants, OutputDisplayTableRow
```

#### Import Ordering Convention

```typescript
// 1. External libraries (alphabetical)
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

// 2. Type-only imports from @/types
import type { CopyButtonProps } from '@/types'

// 3. Internal @/ imports (alphabetical)
import { CheckIcon, CopyIcon } from '@/components'
import { useCopyToClipboard } from '@/hooks'
import { tv } from '@/utils'
```

### Architecture Compliance

- **CopyButton in `src/components/common/button/`** — architecture specifies this exact location [Source: architecture.md#Complete Project Directory Structure]
- **OutputDisplay in `src/components/common/output/`** — architecture specifies this exact location [Source: architecture.md#Complete Project Directory Structure]
- **Toast pattern: "Copied to clipboard"** — exact string specified, no variation allowed [Source: architecture.md#Communication Patterns]
- **Icon morph: clipboard → check (300ms), revert after 2s** — UX spec defines exact timing [Source: ux-design-specification.md#CopyButton]
- **OutputDisplay variants: single, table, code** — UX spec defines exact variants [Source: ux-design-specification.md#OutputDisplay]
- **aria-live="polite" on OutputDisplay** — UX spec mandates screen reader notification [Source: ux-design-specification.md#OutputDisplay]
- **Value change highlight flash (200ms)** — UX spec defines animation timing [Source: ux-design-specification.md#OutputDisplay]
- **Disabled when empty** — UX spec: "CopyButton with nothing to copy is disabled" [Source: epics.md#Story 2.2]

### Previous Story Intelligence (Story 2.1)

From Story 2.1 (ToolLayout Component) implementation:
- **Slot-based children pattern** was used instead of compound components — ToolLayout accepts `input`, `output`, `actions` as named props, NOT `ToolLayout.Input`, etc.
- **ToolLayout does NOT wrap Card** — it renders INSIDE the existing Card component
- **`mode` variants via `tv()`** — card mode is compact (gap-2), page mode is expanded (gap-4)
- **Error display** uses `role="alert"` and `text-error text-body-sm`
- **Barrel exports** wired through full chain: component → common → components → top-level
- **Types** exported through: types/components/common → types/components → types
- **oxfmt auto-sorted** Tailwind classes including `max-tablet:` prefixed classes — expect this during formatting
- **All 15 existing tests pass** — no regressions from Story 2.1 work
- **Architecture note:** The architecture doc "Good" example still shows `ToolLayout.Input` compound pattern but the actual implementation uses slot props — follow the actual implementation, not the architecture example

### Git Intelligence

Recent commit patterns:
- `♻️: story 2-1` — ToolLayout component created (7 files: types, component, barrel exports, sprint status)
- `💄: tab button` — Tabs component styling fix (1 file)
- `📝: epic1 retro` — Epic 1 retrospective doc
- `💄: story 6` — Design system foundation (18 files: tokens, Card redesign, Dialog, Sidebar, CommandPalette styling updates)
- `✨: story 1-4` — Command Palette feature (19 files: component, store, keyboard shortcuts, types)

**Key patterns from commits:**
- ToolLayout created types first, then component, then barrel exports — follow same order
- Tab button had styling adjustments — Tabs component uses `motion.button` with similar animation patterns
- Card.tsx redesigned with `motion.article`, border styling, hover glow — CopyButton should use subtler animations than Card/Button
- Story 2.1 commit was a single clean commit with all files — aim for same pattern

### Web Intelligence

No critical library updates needed. The components use only:
- React 19.2.4 (stable) — `useState`, `useEffect`, `useCallback` for copy state management
- motion/react 12.34.0 (stable) — `AnimatePresence`, `motion.div`, `motion.button` for icon morph and highlight
- tailwind-variants 3.2.2 (stable) — `tv()` for variant styling
- Clipboard API — `navigator.clipboard.writeText()` (used by existing `useCopyToClipboard` hook, browser support: all modern browsers)

All libraries at currently pinned versions. No version-specific concerns.

### Project Structure Notes

- **CopyButton** aligns with architecture: `src/components/common/button/CopyButton.tsx` [Source: architecture.md#Complete Project Directory Structure]
- **OutputDisplay** aligns with architecture: `src/components/common/output/OutputDisplay.tsx` [Source: architecture.md#Complete Project Directory Structure]
- **Types** mirror at: `src/types/components/common/button.ts` (extend) and `src/types/components/common/output.ts` (new) [Source: architecture.md#Complete Project Directory Structure]
- **No conflicts** with existing files detected — `button/index.ts` needs one new export line, `common/index.ts` needs one new export line for output

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — CopyButton and OutputDisplay file locations
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — Toast notification pattern: "Copied to clipboard" exact string
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — tv() pattern, naming conventions, file structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#CopyButton] — Icon morph timing (300ms), revert timing (2s), variants (icon-only, labeled)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#OutputDisplay] — Variants (single, table, code), aria-live, highlight animation (200ms)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns] — Copy-to-clipboard feedback pattern, button hierarchy
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/prd.md#Responsive Design] — 375px minimum, 44x44px touch targets
- [Source: _bmad-output/project-context.md] — 53 implementation rules (types, imports, naming, testing)
- [Source: _bmad-output/implementation-artifacts/2-1-toollayout-component.md] — Previous story learnings, slot pattern decision, barrel export chain

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Lint: 0 errors, 4 warnings (2 pre-existing prerender.ts, 2 only-export-components for tv variant exports)
- Build: success in 1.27s, 0 TypeScript errors
- Tests: 33 passed across 3 files (15 color + 8 CopyButton + 10 OutputDisplay)
- Format: clean (oxfmt auto-corrected Tailwind class ordering)

### Completion Notes List

- Task 1: Extended existing `src/types/components/common/button.ts` with `CopyButtonProps`, `CopyButtonVariant`, `CopyButtonVariants` types (H1 fix: types in `button.ts` not separate `copy-button.ts`)
- Task 2: Created `CopyButton` component with `useCopyToClipboard` hook reuse, AnimatePresence icon morph (CopyIcon → CheckIcon, 2s revert), tv() variants (icon-only/labeled), `disabled:pointer-events-none` (M1 fix), timeout cleanup on unmount. Fixed import ordering: `motion/react` before `react` (H2 fix)
- Task 3: Created `OutputDisplayProps`, `OutputDisplayVariant`, `OutputDisplayVariants`, `OutputDisplayEntry` types in `src/types/components/common/output.ts`
- Task 4: Created `OutputDisplay` with three variants. Added `font-mono` to single and table value spans (H3 fix). Table highlight animation on container via `motion.div` with key from joined values (H4 fix). Highlight color corrected to `oklch(0.55 0.22 310 / 0.15)` matching design system primary (H5 fix). Moved `text-body-sm` into code variant tv() definition (M3 fix)
- Task 5: All quality gates pass — lint 0 errors, build success, 33 tests pass, format clean
- Code Review: Applied 8 fixes from adversarial review (5 HIGH, 3 MEDIUM). Original implementation from `bmad-autonomous-build-cycle` branch commit `64816fe`, fixes applied on `bmad` branch

### File List

- `src/types/components/common/button.ts` (MODIFIED — added CopyButton types)
- `src/types/components/common/output.ts` (NEW)
- `src/types/components/common/index.ts` (MODIFIED — added output export)
- `src/components/common/button/CopyButton.tsx` (NEW)
- `src/components/common/button/copyButton.spec.ts` (NEW)
- `src/components/common/button/index.ts` (MODIFIED — added CopyButton export)
- `src/components/common/output/OutputDisplay.tsx` (NEW)
- `src/components/common/output/outputDisplay.spec.ts` (NEW)
- `src/components/common/output/index.ts` (NEW)
- `src/components/common/index.ts` (MODIFIED — added output export)
