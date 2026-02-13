# Story 1.4: Command Palette Search

Status: done

## Story

As a **user**,
I want **to press Cmd+K to open a search overlay and instantly jump to any tool by name**,
So that **I can navigate to tools with keyboard speed without browsing the sidebar or scrolling the dashboard**.

## Acceptance Criteria

**AC-1: Keyboard Shortcut Opens Palette**
**Given** the user is anywhere in the app
**When** they press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
**Then** the Command Palette opens as a centered modal with backdrop blur
**And** the search input is auto-focused

**AC-2: Real-Time Fuzzy Search**
**Given** the Command Palette is open
**When** the user types a partial tool name (e.g., "col")
**Then** results are filtered in real-time using fuzzy matching against tool names from `TOOL_REGISTRY`
**And** each result shows: tool emoji + tool name + category tag

**AC-3: Arrow Key Navigation & Selection**
**Given** the Command Palette shows filtered results
**When** the user presses `Up`/`Down` arrow keys
**Then** the highlighted result changes accordingly
**And** when the user presses `Enter`
**Then** the palette closes and navigates to the selected tool's dedicated page at `/tools/{tool-key}`

**AC-4: Dismiss Behavior & Focus Restoration**
**Given** the Command Palette is open
**When** the user presses `Escape` or clicks outside the modal
**Then** the palette closes and focus returns to the previously focused element

**AC-5: Zustand Store & Centralized Keyboard Hook**
**Given** a `useCommandPaletteStore` Zustand store and `useKeyboardShortcuts` hook
**When** the Command Palette state changes
**Then** `isOpen`, `open`, `close`, and `toggle` actions are available
**And** the keyboard shortcut is registered centrally via `useKeyboardShortcuts`

**AC-6: Accessibility (ARIA)**
**Given** the Command Palette modal
**When** a screen reader encounters it
**Then** it has `role="dialog"`, `aria-modal="true"`, `aria-label="Search tools"`
**And** the search input has `role="combobox"` with `aria-autocomplete="list"`
**And** the results list has `role="listbox"` with each result having `role="option"`
**And** `aria-activedescendant` on the combobox points to the currently highlighted result

## Tasks / Subtasks

### Task 1: Define Types

- [x] **1.1** Create `src/types/components/common/command-palette.ts` with types for `CommandPaletteProps`, `SearchInputProps`, `CommandPaletteResultItemProps`
- [x] **1.2** Add `UseCommandPaletteStore` type to `src/types/hooks/state.ts`
- [x] **1.3** Add `UseKeyboardShortcuts` type (or inline types) to `src/types/hooks/types.ts`
- [x] **1.4** Update barrel export `src/types/components/common/index.ts` to include `command-palette`

### Task 2: Create Zustand Store

- [x] **2.1** Create `src/hooks/state/useCommandPaletteStore.ts` following the exact existing Zustand pattern
- [x] **2.2** Update barrel export `src/hooks/state/index.ts`

### Task 3: Create Keyboard Shortcuts Hook

- [x] **3.1** Create `src/hooks/useKeyboardShortcuts.ts` with centralized `keydown` event registration
- [x] **3.2** Update barrel export `src/hooks/index.ts`

### Task 4: Create SearchIcon Component

- [x] **4.1** Create `src/components/common/icon/SearchIcon.tsx` matching existing icon conventions
- [x] **4.2** Update barrel export `src/components/common/icon/index.ts`

### Task 5: Build Command Palette Components

- [x] **5.1** Create `src/components/common/command-palette/SearchInput.tsx`
- [x] **5.2** Create `src/components/common/command-palette/CommandPalette.tsx`
- [x] **5.3** Create `src/components/common/command-palette/index.ts` barrel export
- [x] **5.4** Update barrel export `src/components/common/index.ts`

### Task 6: Integrate into App

- [x] **6.1** Render `CommandPalette` in `src/App.tsx` alongside `ToastProvider`
- [x] **6.2** Call `useKeyboardShortcuts()` in `src/App.tsx` (or a root-level wrapper)

### ~~Task 7: Implement Scroll-to-Card with Highlight Pulse~~ (Superseded)

> Superseded by `fix-command-palette-navigate-to-tool-page`. Selection now navigates to `/tools/{tool-key}` via router instead of scrolling to a dashboard card.

- [x] ~~**7.1** Add `data-tool-key` attribute to tool cards on the home page so they can be targeted for scroll-into-view~~
- [x] ~~**7.2** Implement scroll-to-card logic and a brief highlight pulse animation (500ms, `--color-primary` border)~~

### Task 8: Manual Testing & Verification

- [x] **8.1** Verify `Cmd+K` / `Ctrl+K` opens palette from all routes (home, showcase)
- [x] **8.2** Verify fuzzy search filters results correctly
- [x] **8.3** Verify arrow key navigation, Enter selection, Escape dismissal
- [x] **8.4** Verify focus returns to previously focused element after close
- [x] **8.5** Verify screen reader announces dialog role and combobox
- [x] **8.6** Verify palette works on mobile (touch tap on results)
- [x] **8.7** Verify no regressions on existing functionality

## Dev Notes

### Dependency: TOOL_REGISTRY (Story 1.1)

This story consumes `TOOL_REGISTRY` from Story 1.1. The registry is the data source for all search results. If Story 1.1 is not yet complete, you may need to either:
- Implement Story 1.1 first (recommended), OR
- Create a temporary mock registry array for development, then swap in the real `TOOL_REGISTRY` when ready

The registry is expected at `src/constants/tool-registry.ts` and each entry has at minimum: `key`, `name`, `category`, `emoji`. The `TOOL_REGISTRY` is an `Array<ToolRegistryEntry>`.

If Story 1.1 is not done, you can create a temporary constant like:

```typescript
// Temporary mock — replace with TOOL_REGISTRY import from Story 1.1
const MOCK_TOOLS = [
  { category: 'Image', emoji: '🖼️', key: 'image-converter', name: 'Image Converter' },
  { category: 'Time', emoji: '🕐', key: 'unix-timestamp', name: 'Unix Timestamp' },
  { category: 'Encoding', emoji: '🔤', key: 'base64-encoder', name: 'Base64 Encoder' },
  { category: 'Color', emoji: '🎨', key: 'color-converter', name: 'Color Converter' },
  { category: 'Image', emoji: '📐', key: 'image-resizer', name: 'Image Resizer' },
  { category: 'Unit', emoji: '📏', key: 'px-to-rem', name: 'PX to REM' },
]
```

---

### Project Structure Notes

**Files to CREATE:**

```
src/types/components/common/command-palette.ts    # Types for CommandPalette, SearchInput, result items
src/hooks/state/useCommandPaletteStore.ts         # Zustand store for palette open/close state
src/hooks/useKeyboardShortcuts.ts                 # Centralized keyboard shortcut handler
src/components/common/icon/SearchIcon.tsx          # Search magnifying glass SVG icon
src/components/common/command-palette/CommandPalette.tsx  # Main palette component
src/components/common/command-palette/SearchInput.tsx     # Search input subcomponent
src/components/common/command-palette/index.ts            # Barrel export
```

**Files to MODIFY:**

```
src/types/hooks/state.ts              # Add UseCommandPaletteStore type
src/types/components/common/index.ts  # Add command-palette barrel export
src/hooks/state/index.ts              # Add useCommandPaletteStore export
src/hooks/index.ts                    # Add useKeyboardShortcuts export
src/components/common/icon/index.ts   # Add SearchIcon export
src/components/common/index.ts        # Add command-palette barrel export
src/App.tsx                           # Render CommandPalette, call useKeyboardShortcuts
src/pages/home/index.tsx              # Add data-tool-key attributes to card containers for scroll targeting
```

---

### Exact Type Definitions

**`src/types/components/common/command-palette.ts`:**

```typescript
import type { ToolRegistryEntry } from '@/types/constants/tool-registry'

export type CommandPaletteProps = {
  tools: Array<ToolRegistryEntry>
}

export type SearchInputProps = {
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export type CommandPaletteResultItemProps = {
  category: string
  emoji: string
  isHighlighted: boolean
  name: string
  onMouseEnter: () => void
  onSelect: () => void
}
```

Note: If `ToolRegistryEntry` from Story 1.1 is not available yet, define a minimal local type:

```typescript
export type CommandPaletteToolEntry = {
  category: string
  emoji: string
  key: string
  name: string
}
```

**`src/types/hooks/state.ts` — add to existing file:**

```typescript
export type UseCommandPaletteStore = {
  close: () => void
  isOpen: boolean
  open: () => void
  toggle: () => void
}
```

**Update `src/types/components/common/index.ts`:**

Add `export * from './command-palette'` to the existing barrel exports.

---

### Zustand Store Pattern (Exact Implementation)

**`src/hooks/state/useCommandPaletteStore.ts`:**

```typescript
import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { UseCommandPaletteStore } from '@/types'

export const useCommandPaletteStore: UseBoundStore<StoreApi<UseCommandPaletteStore>> =
  create<UseCommandPaletteStore>()((set) => ({
    close: () => set({ isOpen: false }),
    isOpen: false,
    open: () => set({ isOpen: true }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }))
```

This follows the exact same pattern as `useToast` and `usePersistFeatureLayout`:
- Import `create`, `StoreApi`, `UseBoundStore` from `zustand`
- Import the type from `@/types`
- Use the `UseBoundStore<StoreApi<T>>` annotation on the export
- Use `create<T>()((set) => ({...}))` double-invocation pattern
- Properties in alphabetical order (project convention from oxfmt)

**Update `src/hooks/state/index.ts`:**

```typescript
export * from './useCommandPaletteStore'
export * from './useToast'
```

---

### Keyboard Shortcuts Hook Implementation

**`src/hooks/useKeyboardShortcuts.ts`:**

```typescript
import { useEffect } from 'react'

import { useCommandPaletteStore } from '@/hooks'

export const useKeyboardShortcuts = () => {
  const toggleCommandPalette = useCommandPaletteStore((state) => state.toggle)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        toggleCommandPalette()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleCommandPalette])
}
```

Key design decisions:
- `event.preventDefault()` is critical to prevent the browser's default `Cmd+K` behavior (focuses the browser address bar in some browsers)
- Uses `event.metaKey` for Mac (`Cmd` key) and `event.ctrlKey` for Windows/Linux
- The hook is called once at the App level — it registers a global `keydown` listener
- Future shortcuts (e.g., sidebar toggle) can be added to this same hook
- Uses Zustand selector `(state) => state.toggle` to minimize re-renders

**Update `src/hooks/index.ts`:**

```typescript
export * from './persist'
export * from './state'
export * from './useCopyToClipboard'
export * from './useDebounce'
export * from './useDebounceCallback'
export * from './useKeyboardShortcuts'
```

---

### SearchIcon Component

**`src/components/common/icon/SearchIcon.tsx`:**

Follow the exact same pattern as `CopyIcon.tsx`, `XIcon.tsx`, etc.:

```typescript
export const SearchIcon = ({ size }: { size?: number }) => {
  return (
    <svg
      fill="none"
      height={size ?? '1em'}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size ?? '1em'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
```

This uses the Lucide icon convention (same as all existing icons in the project). The magnifying glass icon is standard for search.

**Update `src/components/common/icon/index.ts`:**

Add `export * from './SearchIcon'` in alphabetical order among the existing exports.

---

### Command Palette Component Implementation

**`src/components/common/command-palette/CommandPalette.tsx`:**

Architecture overview:
1. Uses Radix Dialog primitives (Root, Portal, Overlay, Content) for accessibility foundations (focus trapping, Escape key, click-outside)
2. Motion for entrance/exit animations (fade + scale, consistent with existing Dialog.tsx)
3. Internal state for search query, filtered results, and highlighted index
4. Consumes `useCommandPaletteStore` for open/close state
5. Consumes `TOOL_REGISTRY` for search data source

```typescript
import { Content, Overlay, Portal, Root } from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ToolRegistryEntry } from '@/types'

import { useCommandPaletteStore } from '@/hooks'
import { TOOL_REGISTRY } from '@/constants'

import { SearchInput } from './SearchInput'
```

**Internal state management:**

```typescript
const [query, setQuery] = useState('')
const [highlightedIndex, setHighlightedIndex] = useState(0)
const previouslyFocusedRef = useRef<HTMLElement | null>(null)
const listRef = useRef<HTMLUListElement>(null)
```

**Focus restoration pattern:**

When the palette opens, capture `document.activeElement` as the previously focused element. On close, restore focus to that element. Radix Dialog provides some focus management, but we want explicit control for the "return to previously focused element" requirement.

```typescript
// On open — capture previously focused element
useEffect(() => {
  if (isOpen) {
    previouslyFocusedRef.current = document.activeElement as HTMLElement
  }
}, [isOpen])

// On close — restore focus
const handleClose = useCallback(() => {
  close()
  setQuery('')
  setHighlightedIndex(0)
  // Defer focus restoration to after Radix Dialog cleanup
  requestAnimationFrame(() => {
    previouslyFocusedRef.current?.focus()
  })
}, [close])
```

**Fuzzy search implementation (MVP — no external library):**

For MVP, use case-insensitive substring matching. This satisfies "fuzzy matching" for the current 6 tools. If the tool count grows significantly, a more sophisticated algorithm (or `fuse.js` lazy-loaded) can replace this.

```typescript
const filteredTools = useMemo(() => {
  if (!query.trim()) return TOOL_REGISTRY
  const normalizedQuery = query.toLowerCase().trim()
  return TOOL_REGISTRY.filter(
    (tool) =>
      tool.name.toLowerCase().includes(normalizedQuery) ||
      tool.category.toLowerCase().includes(normalizedQuery),
  )
}, [query])
```

This also searches by category name, so typing "image" shows all image tools.

**Arrow key navigation:**

```typescript
const handleKeyDown = useCallback(
  (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredTools.length - 1 ? prev + 1 : 0,
        )
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredTools.length - 1,
        )
        break
      }
      case 'Enter': {
        event.preventDefault()
        if (filteredTools[highlightedIndex]) {
          handleSelectTool(filteredTools[highlightedIndex])
        }
        break
      }
    }
  },
  [filteredTools, highlightedIndex],
)
```

Note: Arrow navigation wraps around (top goes to bottom, bottom goes to top).

**Auto-scroll highlighted item into view:**

When the highlighted index changes via keyboard, ensure the highlighted `<li>` is scrolled into view within the results list:

```typescript
useEffect(() => {
  const list = listRef.current
  if (!list) return
  const highlighted = list.children[highlightedIndex] as HTMLElement | undefined
  highlighted?.scrollIntoView({ block: 'nearest' })
}, [highlightedIndex])
```

**Reset highlighted index when query changes:**

```typescript
useEffect(() => {
  setHighlightedIndex(0)
}, [query])
```

**Tool selection handler (navigate to tool page):**

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

**Radix Dialog + Motion animation structure:**

```tsx
<Root onOpenChange={(open) => { if (!open) handleClose() }} open={isOpen}>
  <Portal>
    <Overlay asChild forceMount>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </Overlay>
    <Content
      asChild
      forceMount
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed top-[20%] left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-gray-800 bg-black/90 shadow-xl backdrop-blur"
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label="Search tools"
        aria-modal="true"
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* SearchInput */}
        {/* Results list */}
        {/* Footer hint */}
      </motion.div>
    </Content>
  </Portal>
</Root>
```

**Important:** `onOpenAutoFocus={(e) => e.preventDefault()}` is used on `Content` to prevent Radix from auto-focusing the Content div itself. Instead, the `SearchInput` manages its own auto-focus via `autoFocus` prop or a `useEffect` with `inputRef.current?.focus()`.

**Results list JSX structure:**

```tsx
<ul
  aria-label="Search results"
  className="max-h-72 overflow-y-auto p-2"
  ref={listRef}
  role="listbox"
>
  {filteredTools.map((tool, index) => (
    <li
      aria-selected={index === highlightedIndex}
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
        index === highlightedIndex
          ? 'bg-primary/20 text-white'
          : 'text-gray-300 hover:bg-white/5'
      }`}
      id={`command-palette-option-${tool.key}`}
      key={tool.key}
      onClick={() => handleSelectTool(tool)}
      onMouseEnter={() => setHighlightedIndex(index)}
      role="option"
    >
      <span className="text-lg">{tool.emoji}</span>
      <span className="grow truncate">{tool.name}</span>
      <span className="text-body-xs rounded bg-gray-800 px-2 py-0.5 text-gray-400">
        {tool.category}
      </span>
    </li>
  ))}
  {filteredTools.length === 0 && (
    <li className="px-3 py-6 text-center text-gray-500">
      No tools found
    </li>
  )}
</ul>
```

**Footer keyboard hint:**

```tsx
<div className="text-body-xs flex items-center gap-4 border-t border-gray-800 px-4 py-2 text-gray-500">
  <span><kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">↑↓</kbd> navigate</span>
  <span><kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">↵</kbd> select</span>
  <span><kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-gray-400">esc</kbd> close</span>
</div>
```

---

### SearchInput Subcomponent

**`src/components/common/command-palette/SearchInput.tsx`:**

```typescript
import { useEffect, useRef } from 'react'

import type { SearchInputProps } from '@/types'

import { SearchIcon } from '../icon'

export const SearchInput = ({ onChange, placeholder = 'Search tools...', value }: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus on mount (when palette opens)
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
      <SearchIcon size={18} />
      <input
        aria-autocomplete="list"
        aria-controls="command-palette-results"
        aria-label="Search tools"
        autoComplete="off"
        className="grow bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        spellCheck="false"
        type="text"
        value={value}
      />
      {value && (
        <kbd className="text-body-xs rounded bg-gray-800 px-1.5 py-0.5 text-gray-500">
          {navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}
        </kbd>
      )}
    </div>
  )
}
```

**ARIA attributes on SearchInput:**
- `role="combobox"` — identifies the input as a combobox
- `aria-autocomplete="list"` — indicates list-based autocompletion
- `aria-controls="command-palette-results"` — links to the results `<ul>` by ID
- The parent `CommandPalette` should also set `aria-activedescendant` on this input pointing to the currently highlighted `<li>` ID: `aria-activedescendant={`command-palette-option-${filteredTools[highlightedIndex]?.key}`}`

To wire `aria-activedescendant`, the `SearchInput` needs an additional prop or the input ref needs to be lifted. The simplest approach: render the `<input>` directly in `CommandPalette.tsx` rather than abstracting it into `SearchInput`, OR pass `activeDescendantId` as a prop to `SearchInput`.

Recommended: Pass `activeDescendantId` prop:

```typescript
export type SearchInputProps = {
  activeDescendantId?: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}
```

Then on the input: `aria-activedescendant={activeDescendantId}`.

---

### Barrel Export

**`src/components/common/command-palette/index.ts`:**

```typescript
export * from './CommandPalette'
export * from './SearchInput'
```

---

### App.tsx Integration

**Modify `src/App.tsx`:**

Add the `CommandPalette` component as a sibling to `ToastProvider` and call `useKeyboardShortcuts()`:

```typescript
import { Outlet } from '@tanstack/react-router'
import { type ComponentType, lazy, Suspense } from 'react'

import { CommandPalette, NotoEmoji, ToastProvider } from '@/components'
import { useKeyboardShortcuts } from '@/hooks'

// ... existing TwinkleStarsAnimate lazy import ...

export default function App() {
  useKeyboardShortcuts()

  return (
    <>
      <main className="bg-pixel-texture relative flex grow flex-col pt-[var(--safe-area-inset-top)] pb-[var(--safe-area-inset-bottom)] [&>*:not(:first-child)]:relative">
        <Suspense fallback={<></>}>
          <TwinkleStarsAnimate />
        </Suspense>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <CommandPalette />
      <ToastProvider />
    </>
  )
}
```

Note: `CommandPalette` is rendered outside `<main>` since it is a portal-based modal overlay. It sits alongside `ToastProvider`. The `useKeyboardShortcuts()` call is at the App root so the `keydown` listener is globally active across all routes.

---

### Home Page Modification for Scroll-to-Card

**Modify `src/pages/home/index.tsx`:**

Add `data-tool-key` attribute to each card's `<section>` wrapper so `CommandPalette` can find it for scroll targeting:

Currently (line ~188-195):
```tsx
{Array.from({ length: 6 }).map((_, idx) => (
  <section
    className="tablet:w-[calc(100%/2-1rem)] laptop:aspect-auto ..."
    key={`${idx}`}
  >
```

After Story 1.1 migrates to `TOOL_REGISTRY`, each card will have a tool key. For now, the `data-tool-key` should map from the `usePersistFeatureLayout` value. The approach depends on whether Story 1.1 is complete:

**If Story 1.1 is complete:** Each card renders from `TOOL_REGISTRY` entries and naturally has a `key` field. Add `data-tool-key={tool.key}` to the `<section>`.

**If Story 1.1 is NOT complete:** Map the existing `FeatureKey` enum values to a kebab-case key for the `data-tool-key` attribute. Create a mapping utility:

```typescript
const featureKeyToToolKey: Record<string, string> = {
  BASE64_ENCODER: 'base64-encoder',
  COLOR_CONVERTER: 'color-converter',
  IMAGE_CONVERTOR: 'image-converter',
  IMAGE_RESIZER: 'image-resizer',
  PX_TO_REM: 'px-to-rem',
  UNIX_TIMESTAMP: 'unix-timestamp',
}
```

Then on the section: `data-tool-key={value[idx] ? featureKeyToToolKey[value[idx]!] : undefined}`

---

### Highlight Pulse Animation (CSS)

Add a CSS class for the highlight pulse to `src/index.css` in the `@layer utilities` block:

```css
@layer utilities {
  /* ...existing utilities... */

  .command-palette-highlight {
    animation: highlight-pulse 500ms ease-out;
  }

  @keyframes highlight-pulse {
    0% {
      box-shadow: 0 0 0 0 var(--color-primary);
    }
    50% {
      box-shadow: 0 0 0 4px var(--color-primary);
    }
    100% {
      box-shadow: 0 0 0 0 var(--color-primary);
    }
  }
}
```

This creates a 500ms pulse of `--color-primary` border glow around the card, matching the UX spec requirement ("brief highlight pulse, 500ms, `--color-primary` border"). Using CSS `box-shadow` animation ensures it does not affect layout.

---

### Motion Animation Configuration

The Command Palette entrance/exit animations match the existing Dialog.tsx pattern:

```typescript
// Overlay (backdrop)
animate={{ opacity: 1 }}
initial={{ opacity: 0 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2, ease: 'easeOut' }}

// Content (modal)
animate={{ opacity: 1, scale: 1, y: 0 }}
initial={{ opacity: 0, scale: 0.95, y: -8 }}
exit={{ opacity: 0, scale: 0.95, y: -8 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

These values are copied from `Dialog.tsx` (lines 78-82, 87-91) to maintain visual consistency. The 0.2s duration and easeOut curve are the established project convention.

For AnimatePresence wrapping (required for exit animations):

```tsx
import { AnimatePresence, motion } from 'motion/react'

// Wrap the Radix Portal contents in AnimatePresence:
<AnimatePresence>
  {isOpen && (
    <Portal forceMount>
      {/* ...Overlay + Content... */}
    </Portal>
  )}
</AnimatePresence>
```

Note: Use `forceMount` on Radix's Overlay and Content when controlling visibility via AnimatePresence, so Motion can manage the mount/unmount lifecycle.

---

### Radix Dialog Usage Details

Use Radix Dialog primitives from the already-installed `@radix-ui/react-dialog` package:

```typescript
import { Content, Overlay, Portal, Root } from '@radix-ui/react-dialog'
```

**What Radix provides (free):**
- Focus trapping inside the dialog
- `Escape` key closes the dialog
- Click-outside-to-close (via the Overlay click handler)
- Portal rendering (content renders at document body level, above all other content)
- `aria-hidden` on sibling elements while dialog is open

**What we handle ourselves:**
- `Cmd+K` / `Ctrl+K` shortcut (via `useKeyboardShortcuts`)
- Arrow key navigation within results (custom `onKeyDown` handler)
- Fuzzy search filtering
- Scroll-to-card on selection
- Focus restoration to previously focused element (Radix restores to trigger, but we have no trigger element since the palette opens via keyboard)
- Animation (Motion, not Radix's built-in animations)

**Why not use Radix Dialog's Trigger:**
The Command Palette has no visible trigger button in the current design. It opens exclusively via `Cmd+K` keyboard shortcut. Therefore, we use `Root` with controlled `open` prop bound to `useCommandPaletteStore().isOpen`, and no `<Trigger>` is rendered. This matches how the existing `Dialog.tsx` handles the `injected?.open` pattern.

---

### Accessibility Checklist (WCAG 2.1 AA)

| Requirement | Implementation |
|------------|----------------|
| Dialog role | `role="dialog"` on content wrapper |
| Modal indicator | `aria-modal="true"` on content wrapper |
| Dialog label | `aria-label="Search tools"` on content wrapper |
| Combobox role | `role="combobox"` on search input |
| Autocomplete hint | `aria-autocomplete="list"` on search input |
| Controls link | `aria-controls="command-palette-results"` linking input to results list |
| Active descendant | `aria-activedescendant` on input points to highlighted `<li>` ID |
| Listbox role | `role="listbox"` on results `<ul>` |
| Option role | `role="option"` on each result `<li>` |
| Selected state | `aria-selected="true"` on highlighted option |
| Focus trapping | Radix Dialog handles this automatically |
| Escape to close | Radix Dialog handles this automatically |
| Focus restoration | Manual — restore to `previouslyFocusedRef.current` on close |
| Keyboard nav | `ArrowUp`/`ArrowDown` navigate results, `Enter` selects |
| No focus trap escape | Tab key stays within dialog (Radix handles) |

---

### Code Convention Reminders

These are enforced by oxlint/oxfmt and must be followed:

- **No semicolons** — the project uses no semicolons
- **Single quotes** — all string literals use single quotes
- **Trailing commas** — always include trailing commas in multi-line constructs
- **120 char line width** — max line length
- **`type` over `interface`** — always use `type` for type definitions
- **`Array<T>` over `T[]`** — always use the generic form
- **`import type`** — use `import type` for type-only imports
- **Named exports** — all components and hooks use named exports (no `export default`)
- **Alphabetical ordering** — properties in objects, imports, exports are alphabetically ordered (enforced by oxfmt)
- **`@/` path alias** — all src imports use `@/` prefix
- **`motion/react`** — import from `motion/react`, never `framer-motion`
- **Barrel exports** — every directory has an `index.ts` re-exporting its contents

---

### Edge Cases to Handle

1. **Empty query** — show all tools from `TOOL_REGISTRY` (no filtering)
2. **No results** — show "No tools found" empty state message
3. **Query with leading/trailing whitespace** — trim before matching
4. **Highlighted index out of bounds** — when filtered results shrink (e.g., user types more characters), reset highlighted index to 0
5. **Rapid typing** — no debounce needed for local array filtering (it is synchronous and fast for the current tool count). If performance becomes an issue with 50+ tools, add debounce via the existing `useDebounce` hook
6. **Multiple Cmd+K presses** — toggle behavior (open then close then open)
7. **Palette opened while on non-home route** — scroll-to-card only works on the home page. If the user is on `/showcase` or a tool page, selecting a tool should navigate to the home page first, then scroll. For MVP, it is acceptable to just close the palette if the card is not found on the current page. Enhancement can be added later.
8. **Mobile touch interaction** — results must be tappable. The `onClick` handler on each `<li>` handles this. Touch targets should meet 44x44px minimum (the `py-2 px-3` padding provides sufficient height)

---

### Testing Strategy

**No unit tests** are strictly required for this story (it is primarily UI/interaction). However, if a fuzzy search utility is extracted to `src/utils/`:

```typescript
// src/utils/search.ts
export const fuzzyMatch = (query: string, target: string): boolean => {
  return target.toLowerCase().includes(query.toLowerCase().trim())
}
```

Then `src/utils/search.spec.ts` could test:
- Empty query returns true for all targets
- Exact match
- Partial match (substring)
- Case insensitivity
- Whitespace trimming
- No match returns false

**Manual testing** is the primary verification method (see Task 8).

---

### Performance Considerations

- **No external fuzzy search library** — `String.includes()` is sufficient for the current 6 tools and scales easily to 50+. Bundle impact: zero.
- **No debounce on search input** — filtering a small array is synchronous and instant. Adding debounce would make the UI feel laggy.
- **Radix Dialog Portal** — renders at document body level, so no z-index stacking issues with existing content.
- **Motion animations** — GPU-accelerated (opacity, transform). No layout-triggering properties animated.
- **Lazy rendering** — the results list only renders `filteredTools.length` items. For the current tool count, no virtualization is needed.

---

### References

- **Architecture doc:** `_bmad-output/planning-artifacts/architecture.md` — see "Platform Layout State" and "Keyboard Shortcut Pattern" sections
- **UX spec:** `_bmad-output/planning-artifacts/ux-design-specification.md` — see "Command Palette" component definition and "Journey 4: Tool Discovery via Sidebar"
- **Epics doc:** `_bmad-output/planning-artifacts/epics.md` — Story 1.4 definition
- **Existing Dialog pattern:** `src/components/common/dialog/Dialog.tsx` — reference for Radix Dialog + Motion animation integration
- **Existing Zustand store pattern:** `src/hooks/state/useToast.ts` — reference for store creation convention
- **Existing icon pattern:** `src/components/common/icon/CopyIcon.tsx` — reference for SVG icon component convention
- **Radix Dialog API:** https://www.radix-ui.com/primitives/docs/components/dialog

## Dev Agent Record

_Reserved for the implementing agent to record decisions, deviations, and completion notes._

| Field | Value |
|-------|-------|
| **Agent** | Claude Opus 4.6 |
| **Started** | 2026-02-13 |
| **Completed** | 2026-02-13 |
| **Story Points** | 5 |
| **Deviations from spec** | Minor: `SearchInput` always shows keyboard shortcut badge (not only when value is non-empty) for discoverability. Added `activeDescendantId` prop to `SearchInputProps` type as recommended in Dev Notes. Used `usePersistFeatureLayout` in `HomePage` to provide `data-tool-key` on `<section>` elements (Story 1.1 is complete). Added visible search button with `⌘K` badge in header for discoverability (spec said keyboard-only trigger). |
| **Follow-up items** | Consider extracting fuzzy search to `src/utils/search.ts` if tool count grows significantly. Consider navigating to home page when a tool is selected from a non-home route. |

### Implementation Notes

- All types defined in `src/types/` following project conventions
- Zustand store follows exact `useSidebarStore` pattern with `StoreApi` typing
- `useKeyboardShortcuts` hook registers global `Cmd+K`/`Ctrl+K` listener at App root
- `CommandPalette` uses Radix Dialog + Motion animations matching existing `Dialog.tsx` pattern
- `AnimatePresence` wraps Portal for exit animations with `forceMount` on Radix components
- Fuzzy search uses case-insensitive substring matching on name + category (no external library)
- Arrow key navigation wraps around, highlighted index resets on query change
- Focus restoration uses `requestAnimationFrame` after Radix cleanup
- `data-tool-key` attribute on home page sections enables scroll-to-card targeting
- Highlight pulse CSS animation uses `box-shadow` for zero layout impact
- Full ARIA compliance: `role="dialog"`, `aria-modal`, `role="combobox"`, `role="listbox"`, `role="option"`, `aria-activedescendant`, `aria-selected`

### Completion Notes

- TypeScript build: PASS
- Vitest tests: 15/15 PASS (0 regressions)
- oxlint: 0 errors
- oxfmt: formatted clean

## File List

### New Files
- `src/types/components/common/command-palette.ts`
- `src/hooks/state/useCommandPaletteStore.ts`
- `src/hooks/useKeyboardShortcuts.ts`
- `src/components/common/icon/SearchIcon.tsx`
- `src/components/common/command-palette/CommandPalette.tsx`
- `src/components/common/command-palette/SearchInput.tsx`
- `src/components/common/command-palette/index.ts`

### Modified Files
- `src/types/hooks/state.ts` — added `UseCommandPaletteStore` type
- `src/types/hooks/types.ts` — added `UseKeyboardShortcuts` type
- `src/types/components/common/index.ts` — added command-palette barrel export
- `src/hooks/state/index.ts` — added `useCommandPaletteStore` export
- `src/hooks/index.ts` — added `useKeyboardShortcuts` export
- `src/components/common/icon/index.ts` — added `SearchIcon` export
- `src/components/common/index.ts` — added command-palette barrel export
- `src/App.tsx` — added `CommandPalette` render, `useKeyboardShortcuts()` call, search button with `SearchIcon` in header, `useCommandPaletteStore` for open action
- `src/pages/home/index.tsx` — added `data-tool-key` attribute to sections
- `src/index.css` — added `command-palette-highlight` animation

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Implemented Command Palette with Cmd+K shortcut, fuzzy search, keyboard navigation, scroll-to-card with highlight pulse, and full ARIA accessibility |
| 2026-02-13 | Code review fixes: added `aria-expanded` on combobox, removed unused types (`CommandPaletteProps`, `CommandPaletteResultItemProps`), replaced deprecated `navigator.platform` with `navigator.userAgent`, fixed relative import to `@/` alias, guarded arrow nav on empty results, moved empty state outside listbox for ARIA correctness, documented search button deviation |
| 2026-02-14 | **Behavior change:** Tool selection now navigates to `/tools/{tool-key}` via `useNavigate` instead of scrolling to dashboard card. Removed scroll-to-card logic, `command-palette-highlight` CSS animation, and `data-tool-key` attributes from home page. See `fix-command-palette-navigate-to-tool-page.md`. |
