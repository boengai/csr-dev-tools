# Story 2.1: ToolLayout Component

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **every tool to follow the same spatial layout pattern**,
So that **I can immediately understand any tool's interface without re-learning where inputs, outputs, and actions are**.

**Epic:** Epic 2 — Standardized Tool Experience
**Dependencies:** Epic 1 complete (TOOL_REGISTRY, dedicated routes, sidebar, command palette, design tokens all in place)
**Scope note:** This story creates the `ToolLayout` wrapper component and its types. It does NOT refactor existing tools to use it — that happens in Epic 3 stories. However, the ToolLayout must be designed to accommodate all 6 existing tools and all planned future tools.

## Acceptance Criteria

### AC1: ToolLayout Component Exists

**Given** a `ToolLayout` component in `src/components/common/tool-layout/`
**When** a tool component uses `ToolLayout` as its wrapper
**Then** it renders in a consistent structure: tool header (title + one-line description) → input region → output region → action bar

### AC2: Card Mode (Dashboard)

**Given** a tool is rendered in card mode (dashboard)
**When** the `mode` variant is `"card"`
**Then** the tool renders in a compact layout suitable for the dashboard grid
**And** the layout respects the existing Card component's constraints (full height, overflow handling)

### AC3: Page Mode (Dedicated Route)

**Given** a tool is rendered in page mode (dedicated route)
**When** the `mode` variant is `"page"`
**Then** the tool renders in a full-page layout with expanded workspace
**And** the layout fills the available space within the existing Card wrapper on tool pages

### AC4: Mobile Responsive

**Given** a tool is viewed on mobile (< 768px)
**When** the viewport is narrow
**Then** the ToolLayout stacks regions vertically: input → output → actions
**And** all tap targets are at least 44x44px

### AC5: Accessibility

**Given** the `ToolLayout` component
**When** a screen reader encounters it
**Then** it renders as a `<section>` with `aria-label` matching the tool name
**And** tab order follows the logical flow: input → output → actions

### AC6: TypeScript Types

**Given** `ToolLayout` types defined in `src/types/components/common/tool-layout.ts`
**When** a developer creates a new tool
**Then** TypeScript enforces required props: `title`, `description`, `mode`, and slot children (`input`, `output`, `actions`)

### AC7: Error Display Integration Point

**Given** the `ToolLayout` component
**When** an `error` prop is provided (string | null)
**Then** the error is rendered inline below the input region, styled with `--color-error`
**And** the error includes an actionable message format (e.g., "Enter a valid hex color (e.g., #3B82F6)")
**And** when `error` is null, no error region is displayed

### AC8: Barrel Exports & Integration

**Given** the ToolLayout module
**When** a developer imports it
**Then** it is available via `@/components` barrel export chain
**And** types are available via `@/types` barrel export chain

## Tasks / Subtasks

- [x] Task 1: Create ToolLayout types (AC: #6)
  - [x] 1.1 Create `src/types/components/common/tool-layout.ts` with `ToolLayoutProps`, `ToolLayoutMode`, and slot types
  - [x] 1.2 Export from `src/types/components/common/index.ts`
  - [x] 1.3 Export from `src/types/components/index.ts`
  - [x] 1.4 Export from `src/types/index.ts`

- [x] Task 2: Create ToolLayout component (AC: #1, #2, #3, #4, #5, #7)
  - [x] 2.1 Create `src/components/common/tool-layout/ToolLayout.tsx` using `tv()` variants for card/page modes
  - [x] 2.2 Implement `<section aria-label={title}>` wrapper
  - [x] 2.3 Implement header region: title (text-heading-5) + description (text-body-sm text-gray-400)
  - [x] 2.4 Implement input slot region with flexible content area
  - [x] 2.5 Implement error display region (conditional on `error` prop)
  - [x] 2.6 Implement output slot region with flexible content area
  - [x] 2.7 Implement action bar slot region (right-aligned on desktop, full-width stacked on mobile)
  - [x] 2.8 Apply responsive stacking for mobile (vertical flow: input → error → output → actions)
  - [x] 2.9 Create `src/components/common/tool-layout/index.ts` barrel export

- [x] Task 3: Wire up barrel exports (AC: #8)
  - [x] 3.1 Export from `src/components/common/index.ts`
  - [x] 3.2 Export from `src/components/index.ts`

- [x] Task 4: Linting & formatting verification
  - [x] 4.1 Run `pnpm lint` — no errors
  - [x] 4.2 Run `pnpm format:check` — no formatting issues
  - [x] 4.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 4.4 Run `pnpm test` — all existing tests pass (15/15 color tests)

## Dev Notes

### CRITICAL: Component Architecture Decisions

#### Slot-Based Children Pattern

ToolLayout uses a **slot-based children pattern** — NOT compound components (no `ToolLayout.Input`). The architecture doc showed a compound component example, but the existing codebase does not use this pattern anywhere. Instead, use explicit named slot props for each region:

```typescript
type ToolLayoutProps = {
  title: string
  description: string
  mode: ToolLayoutMode
  error?: string | null
  input: ReactNode
  output?: ReactNode
  actions?: ReactNode
}
```

**Rationale:** Matches existing patterns in the codebase (Card accepts `children`, FieldForm accepts `children`). Named slots provide explicit TypeScript enforcement of which content goes where. Simpler than compound components.

#### Mode Variant Strategy

The `mode` prop controls layout density:
- **`"card"`** — compact: tighter spacing (gap-2, p-3), smaller heading (text-heading-6), description hidden to save vertical space, regions constrained to card height
- **`"page"`** — expanded: standard spacing (gap-4, p-4), larger heading (text-heading-5), description visible, regions expand to fill available space

Use `tv()` from `@/utils` for the variant definitions, consistent with every other component in the project.

#### ToolLayout Does NOT Wrap Card

ToolLayout renders **inside** the existing `Card` component, not around it. The page-level wrapper (`src/pages/tool/index.tsx`) and home page (`src/pages/home/index.tsx`) already handle the Card wrapper. ToolLayout is the **content** inside the card:

```
Card (existing, handles border/shadow/close/title bar)
  └── ToolLayout (NEW, handles input/output/action spatial structure)
       ├── header (title + description)
       ├── input slot
       ├── error display
       ├── output slot
       └── action bar
```

**IMPORTANT:** ToolLayout does NOT duplicate the Card title. The Card component already renders its own title in the header bar. ToolLayout's `title` prop is used for: (1) `aria-label` on the `<section>` element, and (2) an optional inline heading visible in page mode. In card mode, the Card title bar already provides the name, so ToolLayout can skip rendering its own header.

#### Error Display Pattern

The `error` prop is a simple `string | null`. When non-null:
- A `<p>` element appears below the input region
- Styled with `text-error text-body-sm`
- Uses `role="alert"` for screen reader announcement
- Message format: concise, actionable, with example (e.g., "Enter a valid hex color (e.g., #3B82F6)")

This integrates with the `useToolError` hook (Story 2.3) but works independently — any string passed as `error` will display. The hook is not a dependency of this story.

### Existing Codebase Patterns to Follow

#### `tv()` Variant Pattern

Every component uses `tv()` from `@/utils` with a typed `CompVariant<T>` above the component:

```typescript
import type { CompVariant } from '@/types'

const toolLayoutVariants: CompVariant<typeof toolLayoutTv> = {
  // variant values used by the component
}

const toolLayoutTv = tv({
  base: 'flex flex-col w-full',
  variants: {
    mode: {
      card: 'gap-2 p-3',
      page: 'gap-4 p-4',
    },
  },
})
```

**Note:** Check `src/utils/tailwind-variants.ts` and `src/types/utils/tailwind-variants.ts` for the exact `tv` export and `CompVariant` type definition.

#### File Structure Convention

```
src/components/common/tool-layout/
  ToolLayout.tsx          # Named export: export const ToolLayout = ...
  index.ts                # Barrel: export { ToolLayout } from './ToolLayout'
src/types/components/common/
  tool-layout.ts          # Type exports: ToolLayoutProps, ToolLayoutMode
```

#### Import Ordering Convention

```typescript
// 1. External libraries (alphabetical)
import { type ReactNode } from 'react'

// 2. Type-only imports from @/types
import type { ToolLayoutProps } from '@/types'

// 3. Internal @/ imports (alphabetical)
import { tv } from '@/utils'
```

### Architecture Compliance

- **ToolLayout wrapper for all tools** — architecture mandates every tool component wraps in ToolLayout [Source: architecture.md#Implementation Patterns]
- **`mode` variant** — tools accept mode to render differently in card vs page contexts [Source: architecture.md#Frontend Architecture]
- **Input/output spatial pattern** — header → input → output → actions [Source: ux-design-specification.md#Tool Layout Components]
- **Mobile stacking** — always vertical on mobile (<768px) [Source: ux-design-specification.md#ToolLayout]
- **Error inline, never modal** — error prop renders below input, styled with --color-error [Source: architecture.md#Error Handling]
- **44x44px touch targets** — all interactive elements on mobile [Source: prd.md#Responsive Design]

### Previous Story Intelligence (Epic 1)

From Story 1.6 (Design System Foundation) implementation:
- **Design tokens are in place:** All OKLCH color tokens, shadow scale, border radius (`--radius-sm: 4px`, `--radius-card: 6px`), Space Mono font — all updated and verified
- **Card component redesigned:** Unified container with border on outer `motion.article`, macOS-style red dot close button, `border-b` header separator, title in `text-body-sm text-gray-400`, hover glow effect
- **Component styling convention:** Uses `rounded-card` (6px), solid `bg-gray-950` backgrounds, `border-gray-800` borders
- **Tailwind class sorting** works in `tv()` calls via oxfmt experimental plugin
- **All 15 existing tests pass** — no regressions from Epic 1 work

### Git Intelligence

Recent commit patterns from Epic 1:
- Emoji prefixes: `✨:` (new feature), `💄:` (UI polish), `♻️:` (refactor), `🐛:` (bugfix), `📝:` (docs)
- Stories grouped into larger commits (e.g., "story 1-4" as single commit)
- Card.tsx recently redesigned with motion animations, hover glow, red dot close button
- Sidebar simplified: categories are uppercase labels, tool items use right-side border accent
- Dialog restructured to match Card pattern

### Web Intelligence

No critical library updates needed for this story. The component uses only:
- React 19.2.4 (stable, no breaking changes)
- tailwind-variants 3.2.2 (stable, `tv()` API unchanged)
- Tailwind CSS 4.1.18 (stable, `@theme` tokens working)
- motion/react 12.34.0 (optional for transitions, stable)

All libraries are at their currently pinned versions. No version-specific concerns.

### Project Structure Notes

- Aligns with architecture directory structure: `src/components/common/tool-layout/` [Source: architecture.md#Complete Project Directory Structure]
- Types mirror at: `src/types/components/common/tool-layout.ts` [Source: architecture.md#Complete Project Directory Structure]
- No conflicts with existing files detected

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — ToolLayout wrapper, mode variant, error handling
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — tv() pattern, naming conventions, file structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Tool Layout Components] — ToolLayout anatomy, states, variants, accessibility
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns] — Error feedback, form/input patterns, button hierarchy
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/prd.md#Responsive Design] — 375px minimum, 44x44px touch targets
- [Source: _bmad-output/project-context.md] — 53 implementation rules (types, imports, naming, testing)
- [Source: _bmad-output/implementation-artifacts/1-6-design-system-foundation-apply-ux-direction.md] — Previous story learnings, token values, Card redesign notes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- oxfmt auto-fixed Tailwind class ordering in ToolLayout.tsx (sorted `max-tablet:` prefixed classes before unprefixed)

### Completion Notes List

- Created ToolLayout types (`ToolLayoutProps`, `ToolLayoutMode`, `ToolLayoutVariants`) in `src/types/components/common/tool-layout.ts`
- Created ToolLayout component using slot-based pattern with `tv()` variants for card/page modes
- Card mode: compact gap-2, no header (Card already provides title bar)
- Page mode: expanded gap-4, header with title (text-heading-5) + description (text-body-sm text-gray-400)
- Error display: conditional `<p role="alert">` below input region, styled with `text-error text-body-sm`
- Accessibility: `<section aria-label={title} aria-description={description}>` wrapper, natural tab order follows input → output → actions
- Mobile responsive: vertical stacking by default (flex-col), action bar stacks vertically on mobile (`max-tablet:flex-col`) with full-width + min 44px tap targets
- Barrel exports wired through full chain: types and components accessible via `@/types` and `@/components`
- All verification passed: lint (0 errors), format (clean), build (success), tests (15/15 pass)
- No new dependencies added; no existing tests broken

### File List

- `src/types/components/common/tool-layout.ts` (new)
- `src/types/components/common/index.ts` (modified — added tool-layout export)
- `src/components/common/tool-layout/ToolLayout.tsx` (new)
- `src/components/common/tool-layout/index.ts` (new)
- `src/components/common/index.ts` (modified — added tool-layout export)

### Change Log

- 2026-02-13: Implemented Story 2.1 — ToolLayout component with types, barrel exports, and all ACs satisfied
- 2026-02-13: Code review fixes — (1) action bar: added gap-2, flex-wrap, items-center, max-tablet:flex-col for proper mobile stacking and button spacing, (2) section: added aria-description={description} for card mode accessibility. Note: architecture.md "Good" example still shows compound component pattern (ToolLayout.Input) instead of the slot-prop pattern used — should be updated separately.
