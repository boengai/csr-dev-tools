# Fix: Auto-Open Dialog on Tool Page

Status: done

<!-- Standalone UX enhancement — affects dialog-based tools from Stories 5.2, 6.1, 7.1, 7.2 -->

## Story

As a **user**,
I want **dialog-based tools to open their dialog immediately when I navigate to their dedicated tool page**,
So that **I don't have to click a redundant "Open" button when I've already chosen the tool via its URL**.

**Origin:** Stories 5.2 (JWT Decoder), 6.1 (JSON Formatter), 7.1 (Text Diff Checker), 7.2 (Regex Tester)
**Type:** Standalone UX enhancement
**Story Key:** fix-auto-open-dialog-on-tool-page

## Context

4 tools (JsonFormatter, JwtDecoder, RegexTester, TextDiffChecker) have an idle state that is just a single button opening a full-screen dialog. When users navigate to the dedicated tool page (`/tools/$toolKey`), that button click is redundant. On close, navigate back to home instead of showing the idle button.

On the home page (widget context), these tools keep their current behavior unchanged.

## Acceptance Criteria

### AC1: Dialog Auto-Opens on Tool Page

**Given** the user navigates to a dialog-based tool page (e.g., `/tools/json-formatter`)
**When** the page renders
**Then** the full-screen dialog opens immediately without requiring a button click

### AC2: Dialog Close Navigates Home on Tool Page

**Given** the user is on a tool page with the dialog open
**When** they close the dialog (close button or Escape key)
**Then** the app navigates to `/` (home page)
**And** the tool state is reset

### AC3: Widget Behavior Unchanged

**Given** a dialog-based tool is rendered as a widget on the home page
**When** the widget renders
**Then** the idle button is visible and the dialog does not auto-open
**And** closing the dialog resets the tool state without navigation (current behavior preserved)

### AC4: Props-Based Approach

**Given** the `ToolComponentProps` type in `src/types/constants/tool-registry.ts`
**When** a developer inspects it
**Then** it defines `autoOpen?: boolean` and `onAfterDialogClose?: () => void`
**And** `ToolRegistryEntry.component` uses `ComponentType<ToolComponentProps>`
**And** the tool page passes these props; components have no routing awareness

## Tasks / Subtasks

- [x] Task 1: Add `ToolComponentProps` type (AC: #4)
  - [x] 1.1 Add `ToolComponentProps` type with `autoOpen?: boolean` and `onAfterDialogClose?: () => void` to `src/types/constants/tool-registry.ts`
  - [x] 1.2 Update `ToolRegistryEntry.component` type to `LazyExoticComponent<ComponentType<ToolComponentProps>>`

- [x] Task 2: Update tool page to pass props (AC: #1, #2)
  - [x] 2.1 Pass `autoOpen` and `onAfterDialogClose={navigateHome}` to `<ToolComponent>` in `src/pages/tool/index.tsx`

- [x] Task 3: Update dialog-based tool components (AC: #1, #2, #3)
  - [x] 3.1 Update `JsonFormatter` to accept `ToolComponentProps`, use `autoOpen` for initial dialog state, call `onAfterDialogClose` on close
  - [x] 3.2 Update `JwtDecoder` (same pattern)
  - [x] 3.3 Update `RegexTester` (same pattern)
  - [x] 3.4 Update `TextDiffChecker` (same pattern)

- [x] Task 4: Verify (AC: #1, #2, #3)
  - [x] 4.1 TypeScript build passes (`pnpm tsc --noEmit`)
  - [x] 4.2 Lint passes (`pnpm oxlint`)

## Dev Notes

### Approach: Props over Hooks

Initial approach used a `useAutoOpenDialog` hook with `useLocation()` inside each component. Rejected in favor of props-based approach to keep components routing-unaware. The tool page owns the navigation behavior via callback props.

### Pattern Applied in Each Component

```tsx
export const ToolComponent = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {
  // ... other state ...
  const [dialogOpen, setDialogOpen] = useState(autoOpen ?? false)

  const handleReset = () => { /* clear all state */ }

  const handleAfterClose = () => {
    handleReset()
    onAfterDialogClose?.()
  }

  return (
    <>
      {/* idle button */}
      <Dialog onAfterClose={handleAfterClose} ... />
    </>
  )
}
```

### Files Modified

```
src/types/constants/tool-registry.ts                     — added ToolComponentProps, updated component type
src/pages/tool/index.tsx                                  — pass autoOpen + onAfterDialogClose
src/components/feature/data/JsonFormatter.tsx              — accept props, use autoOpen + handleAfterClose
src/components/feature/encoding/JwtDecoder.tsx             — same pattern
src/components/feature/text/RegexTester.tsx                — same pattern
src/components/feature/text/TextDiffChecker.tsx            — same pattern
```

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-15 | Created story | UX improvement: skip redundant button on tool pages |
| 2026-02-15 | Implemented and verified | Props-based approach (replaced initial hook-based approach) |
