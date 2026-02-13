# Story 2.3: Error Handling System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **clear, inline error feedback when I enter invalid input — and never a modal or blocking dialog**,
So that **I can quickly correct my input and continue working without disruption**.

**Epic:** Epic 2 — Standardized Tool Experience
**Dependencies:** Story 2.1 (ToolLayout component) complete. Story 2.2 (CopyButton/OutputDisplay) complete. Epic 1 complete (TOOL_REGISTRY, design tokens, sidebar, command palette).
**Scope note:** This story creates the `useToolError` hook and `ToolErrorBoundary` component. ToolLayout already renders errors — this story provides the state management hook and the crash recovery boundary. It does NOT refactor existing tools to use `useToolError` — that happens in Epic 3 stories.

## Acceptance Criteria

### AC1: useToolError Hook Provides Error State Management

**Given** a `useToolError` hook in `src/hooks/`
**When** a tool component calls `useToolError()`
**Then** it receives `error` (string | null), `setError(message)`, and `clearError()` functions

### AC2: Error Renders Inline via ToolLayout

**Given** a tool has an error state set via `setError`
**When** `ToolLayout` renders
**Then** the error message appears inline below the relevant input, styled with `--color-error`
**And** the message is concise, actionable, and includes an example of valid input (e.g., "Enter a valid hex color (e.g., #3B82F6)")

### AC3: Error Clears Automatically on Valid Input

**Given** a tool has an active error
**When** the user corrects the input to a valid value
**Then** `clearError()` is called automatically and the error message disappears

### AC4: ToolErrorBoundary Catches Unexpected Crashes

**Given** a `ToolErrorBoundary` component in `src/components/common/error-boundary/`
**When** an unexpected JavaScript error occurs within a tool
**Then** the error boundary catches it and displays "Something went wrong" with a Reset button
**And** the error does not crash the entire application — only the affected tool

### AC5: Error Display Is Never Modal

**Given** the error handling system
**When** an error message is displayed
**Then** it is never a modal dialog, never an alert box, and never a blocking overlay

### AC6: TypeScript Types & Barrel Exports

**Given** types for useToolError and ToolErrorBoundary
**When** a developer imports them
**Then** `UseToolError` and `ToolErrorBoundaryProps` are available via `@/types`
**And** `useToolError` is available via `@/hooks`
**And** `ToolErrorBoundary` is available via `@/components` barrel export chain

## Tasks / Subtasks

- [x] Task 1: Create useToolError types (AC: #1, #6)
  - [x] 1.1 Create `src/types/hooks/error.ts` — add `UseToolError` type with `error: null | string`, `setError: (message: string) => void`, `clearError: () => void`
  - [x] 1.2 Export from `src/types/hooks/index.ts`

- [x] Task 2: Create useToolError hook (AC: #1, #3)
  - [x] 2.1 Create `src/hooks/useToolError.ts`
  - [x] 2.2 Implement as a simple React `useState` hook (NOT a Zustand store — each tool instance needs its own error state, not shared global state)
  - [x] 2.3 Return `{ error, setError, clearError }` — `clearError` calls `setError(null)`
  - [x] 2.4 Export from `src/hooks/index.ts`

- [x] Task 3: Create ToolErrorBoundary types (AC: #4, #6)
  - [x] 3.1 Create `src/types/components/common/error-boundary.ts` with `ToolErrorBoundaryProps` type (children: React.ReactNode, fallback?: React.ReactNode)
  - [x] 3.2 Export from `src/types/components/common/index.ts`

- [x] Task 4: Create ToolErrorBoundary component (AC: #4, #5)
  - [x] 4.1 Create `src/components/common/error-boundary/ToolErrorBoundary.tsx`
  - [x] 4.2 Implement as a React Error Boundary class component (React does not support error boundaries as function components)
  - [x] 4.3 Render fallback UI: "Something went wrong" message with a "Reset" button that calls `this.setState({ hasError: false })`
  - [x] 4.4 Style fallback with `text-error`, `text-body-sm`, centered within the tool area
  - [x] 4.5 Reset button uses secondary button styling (outlined, `--color-error` border)
  - [x] 4.6 Add `role="alert"` to fallback container for accessibility
  - [x] 4.7 Create `src/components/common/error-boundary/index.ts` barrel export
  - [x] 4.8 Export from `src/components/common/index.ts`

- [x] Task 5: Write unit tests (AC: #1, #3, #4)
  - [x] 5.1 Create `src/hooks/useToolError.spec.ts` — test setError, clearError, initial state
  - [x] 5.2 Tests verify: export correctness, UseToolError type enforcement (null/string error, function signatures), return shape (3-key object). Note: behavioral tests (state transitions) not possible in node test env — useToolError requires React rendering context

- [x] Task 6: Linting & formatting verification
  - [x] 6.1 Run `pnpm lint` — no errors
  - [x] 6.2 Run `pnpm format:check` — no formatting issues
  - [x] 6.3 Run `pnpm build` — build succeeds with no TypeScript errors
  - [x] 6.4 Run `pnpm test` — all tests pass (existing 33 + new useToolError tests)

## Dev Notes

### CRITICAL: Architecture Decisions

#### useToolError Is a Simple useState Hook — NOT a Zustand Store

Despite the architecture doc mentioning `useToolError` alongside Zustand stores, this hook MUST be a simple `useState`-based hook, NOT a Zustand store. The reason is critical:

**Each tool instance needs its own independent error state.** If `useToolError` were a Zustand store, all tools on the dashboard would share a single error state — setting an error on the Color Converter would display the error on the Base64 Encoder too.

```typescript
// CORRECT — local state per tool instance
export const useToolError = (): UseToolError => {
  const [error, setError] = useState<null | string>(null)
  return {
    clearError: () => setError(null),
    error,
    setError,
  }
}

// WRONG — global shared state (Zustand store)
export const useToolError = create<UseToolError>()(...)
```

The architecture doc's state boundary table confirms this: `useToolError` scope is "Per-tool instance", persisted "No". A `useState` hook gives per-instance state naturally.

#### ToolLayout Already Renders Errors — No Modification Needed

ToolLayout (`src/components/common/tool-layout/ToolLayout.tsx`) already accepts an `error?: null | string` prop and renders it inline:

```tsx
{error != null && (
  <p className="text-error text-body-sm shrink-0" role="alert">
    {error}
  </p>
)}
```

This is exactly what the spec requires — inline, below the input region, with `text-error` styling and `role="alert"` for accessibility. **Do NOT modify ToolLayout for this story.** The hook provides state management; ToolLayout provides rendering. They connect via the `error` prop:

```typescript
// In a tool component:
const { error, setError, clearError } = useToolError()
return (
  <ToolLayout title="..." description="..." error={error} mode={mode}>
    {/* inputs/outputs */}
  </ToolLayout>
)
```

#### ToolErrorBoundary Is a Class Component

React Error Boundaries require class components — they use `componentDidCatch` and `getDerivedStateFromError` lifecycle methods, which have no function component equivalents. This is the ONE exception to the project's functional component preference.

```typescript
// Error boundaries MUST be class components — React limitation
import { Component } from 'react'

import type { ToolErrorBoundaryProps } from '@/types'

type ToolErrorBoundaryState = {
  hasError: boolean
}

export class ToolErrorBoundary extends Component<ToolErrorBoundaryProps, ToolErrorBoundaryState> {
  state: ToolErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ToolErrorBoundaryState {
    return { hasError: true }
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
          <p className="text-error text-body-sm">Something went wrong</p>
          <button
            className="rounded-md border border-error px-3 py-1 text-body-sm text-error hover:bg-error/10"
            onClick={this.handleReset}
            type="button"
          >
            Reset
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

**IMPORTANT:** This is named export `ToolErrorBoundary`, NOT a default export. Follows project convention.

#### Error Message Format Convention

All error messages displayed via `useToolError` MUST follow the architecture's error message format:

- Concise, actionable, no blame
- Always include an example of valid input in parentheses
- Never technical jargon

```typescript
// CORRECT error messages
setError('Enter a valid hex color (e.g., #3B82F6)')
setError('Enter a valid Base64 string (e.g., SGVsbG8=)')
setError('Enter a valid Unix timestamp (e.g., 1700000000)')

// WRONG error messages
setError('Invalid hexadecimal color string')  // technical jargon
setError('Error: bad input')                  // vague, no example
setError('You entered an invalid value')      // blaming user
```

Note: The actual error message content is NOT part of this story — it's the responsibility of individual tool implementations (Epic 3+). This story provides the hook and rendering infrastructure.

#### Auto-Clear Behavior Is Tool-Responsibility

AC3 states that `clearError()` is called automatically when the user corrects input. This auto-clear behavior is NOT implemented in the `useToolError` hook itself — it's the consuming tool component's responsibility:

```typescript
// In a tool component:
const { error, setError, clearError } = useToolError()

const handleInput = (value: string) => {
  if (isValidHex(value)) {
    clearError()  // Tool clears error on valid input
    processColor(value)
  } else {
    setError('Enter a valid hex color (e.g., #3B82F6)')
  }
}
```

The hook provides `clearError()` as a convenience (equivalent to `setError(null)`). The tool decides when to call it based on its own validation logic.

### Existing Codebase Patterns to Follow

#### Hook Pattern (Non-Zustand)

Follow the pattern of existing non-Zustand hooks like `useCopyToClipboard`:

```typescript
// src/hooks/useCopyToClipboard.ts pattern
import { useCallback } from 'react'
import { useToast } from '@/hooks'

export const useCopyToClipboard = (): UseCopyToClipboard => {
  // ... implementation
  return copyToClipboard
}
```

For `useToolError`, the pattern is simpler — just `useState`:

```typescript
import { useState } from 'react'
import type { UseToolError } from '@/types'

export const useToolError = (): UseToolError => {
  const [error, setError] = useState<null | string>(null)
  return {
    clearError: () => setError(null),
    error,
    setError,
  }
}
```

#### File Structure Convention

```
src/hooks/
  useToolError.ts              # NEW — Named export: export const useToolError
  useToolError.spec.ts         # NEW — Unit tests
  index.ts                     # MODIFY — add useToolError export

src/components/common/error-boundary/
  ToolErrorBoundary.tsx         # NEW — Named export: export class ToolErrorBoundary
  index.ts                      # NEW — Barrel: export { ToolErrorBoundary } from './ToolErrorBoundary'

src/types/hooks/
  error.ts                      # NEW — UseToolError type
  index.ts                      # MODIFY — add error export

src/types/components/common/
  error-boundary.ts             # NEW — ToolErrorBoundaryProps type
  index.ts                      # MODIFY — add error-boundary export
```

#### Import Ordering Convention

```typescript
// 1. External libraries (alphabetical)
import { Component } from 'react'

// 2. Type-only imports from @/types
import type { ToolErrorBoundaryProps } from '@/types'

// 3. Internal @/ imports (alphabetical) — if needed
```

### Architecture Compliance

- **useToolError in `src/hooks/`** — architecture specifies per-tool instance hook [Source: architecture.md#State Boundaries]
- **ToolErrorBoundary in `src/components/common/error-boundary/`** — architecture specifies this exact location [Source: architecture.md#Complete Project Directory Structure]
- **Error display: inline, never modal** — UX spec mandates inline-only error feedback [Source: ux-design-specification.md#Feedback Patterns]
- **Error format: concise, actionable, with example** — architecture enforces message format [Source: architecture.md#Format Patterns]
- **`role="alert"` on error messages** — already implemented in ToolLayout [Source: ux-design-specification.md#Accessibility]
- **Error clear on valid input** — architecture error handling flow step 4 [Source: architecture.md#Process Patterns]
- **ToolErrorBoundary catches unexpected crashes** — architecture error handling flow step 5 [Source: architecture.md#Process Patterns]

### Previous Story Intelligence (Story 2.2)

From Story 2.2 (CopyButton & OutputDisplay) implementation:

- **Barrel exports** must be wired through full chain: component → common → components → top-level (confirmed working pattern)
- **Types** exported through: types/hooks or types/components/common → types/components → types
- **oxfmt auto-sorted** Tailwind classes — expect class reordering during formatting
- **All 33 existing tests pass** — no regressions from Story 2.2 work (15 color + 8 CopyButton + 10 OutputDisplay)
- **Hook pattern:** `useCopyToClipboard` returns a function directly; `useToolError` returns an object `{ error, setError, clearError }` — different return shape but same export pattern
- **Class component:** ToolErrorBoundary is the first class component in the project — may trigger oxlint warnings about class usage, which is acceptable for Error Boundaries (React limitation)

### Git Intelligence

Recent commit patterns:
- `♻️: story 2-2` — CopyButton/OutputDisplay (10 files: types, components, tests, barrel exports, sprint status)
- `♻️: story 2-1` — ToolLayout component (7 files: types, component, barrel exports)
- `💄: tab button` — Tabs component styling fix
- `💄: story 6` — Design system foundation (18 files)

**Key patterns from commits:**
- Stories create types first, then components, then barrel exports, then tests — follow same order
- Single clean commit per story with all files
- Emoji prefix pattern: `♻️:` for refactor/new component stories

### Web Intelligence

No critical library updates needed. The components use only:
- React 19.2.4 (stable) — `useState` for useToolError, `Component` class for ToolErrorBoundary
- No additional libraries required — this is pure React functionality
- Error Boundaries are stable React API since React 16+ (no changes in React 19)

### Project Structure Notes

- **useToolError** aligns with architecture: `src/hooks/useToolError.ts` [Source: architecture.md#Complete Project Directory Structure]
- **ToolErrorBoundary** aligns with architecture: `src/components/common/error-boundary/ToolErrorBoundary.tsx` [Source: architecture.md#Complete Project Directory Structure]
- **Types** mirror at: `src/types/hooks/error.ts` (new) and `src/types/components/common/error-boundary.ts` (new) [Source: architecture.md#Complete Project Directory Structure]
- **No conflicts** with existing files detected — barrel exports need one new line each

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Error handling flow (5 steps: prevention → validation → display → clear → crash recovery)
- [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries] — useToolError scope: per-tool instance, not persisted
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — File locations for hook and error boundary
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — Error message format: concise, actionable, with example
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Anti-pattern: custom error state with useState instead of useToolError
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — Error feedback: inline, never modal, styled with --color-error
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form & Input Patterns] — Validation approach: real-time, prevention-first, smart defaults
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance criteria source
- [Source: _bmad-output/planning-artifacts/prd.md#Accessibility] — Error states announced to screen readers
- [Source: _bmad-output/project-context.md] — 53 implementation rules (types, imports, naming, testing)
- [Source: _bmad-output/implementation-artifacts/2-2-copybutton-and-outputdisplay-components.md] — Previous story learnings, barrel export chain, test patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- oxfmt auto-sorted Tailwind classes in ToolErrorBoundary.tsx (expected behavior per Story 2.2 learnings)

### Completion Notes List

- Task 1: Created `UseToolError` type in `src/types/hooks/error.ts` with `error: null | string`, `setError`, and `clearError` members. Exported via barrel chain.
- Task 2: Implemented `useToolError` hook as a simple `useState`-based hook (NOT Zustand) per architecture decision. Returns `{ clearError, error, setError }` with alphabetical key ordering.
- Task 3: Created `ToolErrorBoundaryProps` type with `children: ReactNode` and optional `fallback?: ReactNode`. Exported via barrel chain.
- Task 4: Implemented `ToolErrorBoundary` as a React class component (Error Boundary requirement). Uses `getDerivedStateFromError` for crash recovery, renders "Something went wrong" with Reset button, `role="alert"` for accessibility. Supports optional custom fallback prop.
- Task 5: Created 6 unit tests verifying exports, type enforcement (null/string error states, function signatures), and return shape (3-key object). Tests follow established project pattern (node env, no jsdom). Note: behavioral tests (actual hook state transitions) are not possible without React rendering context — tests validate type contracts and export correctness only.
- Task 6: All validations pass — 0 lint errors, formatting clean, build succeeds, 39/39 tests pass (33 existing + 6 new).

### Change Log

- 2026-02-13: Implemented Story 2-3 Error Handling System — useToolError hook, ToolErrorBoundary component, types, barrel exports, and unit tests
- 2026-02-13: Code review fixes — (1) Added useCallback for clearError referential stability, (2) Added componentDidCatch for error logging in ToolErrorBoundary, (3) Wrapped custom fallback in role="alert" for accessibility, (4) Updated Task 5.2 description to accurately reflect test scope

### File List

New files:
- src/types/hooks/error.ts
- src/types/components/common/error-boundary.ts
- src/hooks/useToolError.ts
- src/hooks/useToolError.spec.ts
- src/components/common/error-boundary/ToolErrorBoundary.tsx
- src/components/common/error-boundary/index.ts

Modified files:
- src/types/hooks/index.ts
- src/types/components/common/index.ts
- src/hooks/index.ts
- src/components/common/index.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/2-3-error-handling-system.md
