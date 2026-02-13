# Fix: Command Palette Navigate to Tool Page

Status: pending

<!-- Standalone fix — modifies behavior from Story 1.4 (Command Palette Search) -->

## Story

As a **user**,
I want **selecting a tool from the command palette to navigate me directly to that tool's dedicated page**,
So that **I can immediately start using the tool instead of scrolling to a dashboard card**.

**Origin:** Story 1.4 (Command Palette Search)
**Type:** Standalone behavior fix
**Story Key:** fix-command-palette-navigate-to-tool-page

## Acceptance Criteria

### AC1: Navigate to Tool Page on Selection

**Given** the Command Palette is open with filtered results
**When** the user selects a tool (via `Enter` key or click)
**Then** the palette closes and the app navigates to `/tools/{tool-key}`
**And** this works regardless of which route the user is currently on (home, showcase, another tool page)

### AC2: Remove Scroll-to-Card Behavior

**Given** the `handleSelectTool` function in `CommandPalette.tsx`
**When** a tool is selected
**Then** it no longer scrolls to a card on the home page
**And** it no longer triggers a highlight pulse animation

### AC3: Spec Updated

**Given** the implementation artifact `1-4-command-palette-search.md`
**When** a developer reads it
**Then** AC-3 reflects navigation to tool page instead of scroll-to-card
**And** the `handleSelectTool` code block in Dev Notes uses router navigation
**And** Task 7 (scroll-to-card with highlight pulse) is marked as superseded
**And** the Change Log records this change

## Tasks / Subtasks

### Task 1: Update handleSelectTool in CommandPalette.tsx

- [ ] **1.1** Replace the scroll-to-card + highlight pulse logic with router navigation to `tool.routePath` (i.e., `/tools/{tool-key}`)
- [ ] **1.2** Import and use TanStack Router's `useNavigate` hook for programmatic navigation
- [ ] **1.3** Ensure `handleClose()` is called before navigation (close palette, reset query, restore focus)

### Task 2: Clean Up Dead Code

- [ ] **2.1** Remove the `command-palette-highlight` CSS animation from `src/index.css` if no other feature uses it
- [ ] **2.2** Remove `data-tool-key` attributes from home page card sections if they are only used by the old scroll-to-card logic (verify sidebar doesn't use them first)

### Task 3: Update Implementation Spec

- [ ] **3.1** Update AC-3 in `1-4-command-palette-search.md` to say "navigates to the tool's dedicated page" instead of "scrolls to the selected tool with a highlight pulse"
- [ ] **3.2** Update the `handleSelectTool` code block in Dev Notes to show router navigation
- [ ] **3.3** Mark Task 7 (scroll-to-card with highlight pulse) as superseded by this fix
- [ ] **3.4** Add entry to Change Log

### Task 4: Verify

- [ ] **4.1** Verify selecting a tool from command palette navigates to `/tools/{tool-key}`
- [ ] **4.2** Verify navigation works from all routes (home, tool page, showcase)
- [ ] **4.3** Verify palette closes and query resets after selection
- [ ] **4.4** Verify no regressions in keyboard navigation (arrows, Enter, Escape)
- [ ] **4.5** Verify TypeScript build passes
- [ ] **4.6** Verify existing tests pass (`pnpm test`)

## Dev Notes

### Key File: `src/components/common/command-palette/CommandPalette.tsx`

**Current behavior (replace this):**

```typescript
const handleSelectTool = useCallback(
  (tool: ToolRegistryEntry) => {
    handleClose()
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-tool-key="${tool.key}"]`)
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        card.classList.add('command-palette-highlight')
        setTimeout(() => {
          card.classList.remove('command-palette-highlight')
        }, 500)
      }
    })
  },
  [handleClose],
)
```

**New behavior:**

```typescript
const navigate = useNavigate()

const handleSelectTool = useCallback(
  (tool: ToolRegistryEntry) => {
    handleClose()
    navigate({ to: tool.routePath })
  },
  [handleClose, navigate],
)
```

Import `useNavigate` from `@tanstack/react-router`.

### Dead Code Candidates

Before removing, verify these aren't used by other features:

- **`command-palette-highlight`** CSS animation in `src/index.css` — check if sidebar tool selection also uses this
- **`data-tool-key`** attributes on home page sections — check if sidebar or any other feature queries these

### Files to Modify

```
src/components/common/command-palette/CommandPalette.tsx  — replace handleSelectTool logic
src/index.css                                             — remove highlight pulse animation (if unused)
src/pages/home/index.tsx                                  — remove data-tool-key attributes (if unused)
_bmad-output/implementation-artifacts/1-4-command-palette-search.md — update spec
```
