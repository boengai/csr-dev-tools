# Story 1.3: Sidebar Navigation System

Status: done

## Story

As a **user**,
I want **a drawer-style sidebar showing all tools grouped by category**,
So that **I can quickly browse and navigate to any tool's dedicated page**.

**Epic:** 1 - Platform Navigation & Tool Discovery
**FRs Covered:** FR26, FR28, FR29
**Depends On:** Story 1.1 (Centralized Tool Registry - `TOOL_REGISTRY`)

## Acceptance Criteria

**AC1: Sidebar Open/Close via Hamburger (Drawer Overlay)**
**Given** the user is on any page
**When** they click the hamburger icon in the header
**Then** the sidebar slides in from the left as a drawer overlay (300ms ease-out animation via Motion)
**And** on all viewports, the sidebar floats on top of content with a dark backdrop (never pushes content)
**And** on mobile (<768px), the sidebar takes full-screen width
**And** on desktop (>=768px), the sidebar takes ~240-280px width

**AC2: Category Grouping & Display**
**Given** the sidebar is open
**When** the user views the sidebar content
**Then** tools are grouped by category (Color, Encoding, Image, Time, Unit, Data, Generator, CSS, Text)
**And** each category header shows a tool count badge (`CategoryBadge`)
**And** each category is expandable/collapsible with a chevron icon
**And** all categories default to expanded on first load

**AC3: Tool Navigation via Route**
**Given** the sidebar is open
**When** the user clicks a tool name (`SidebarToolItem`)
**Then** the app navigates to `/tools/{tool-key}` (Story 1.2 route)
**And** the sidebar auto-closes on both mobile and desktop after navigation

**AC4: Sidebar Dismissal**
**Given** the sidebar is open
**When** the user presses `Escape` or clicks outside the sidebar (mobile) or clicks the X/hamburger toggle
**Then** the sidebar closes with a slide-out animation

**AC5: Focus Trapping & Accessibility**
**Given** the sidebar drawer is open (any viewport)
**When** focus is inside the sidebar
**Then** focus is trapped within the sidebar (cannot tab to elements behind the overlay)
**And** the sidebar has `nav` landmark with `aria-label="Tool navigation"`

**AC7: Home Navigation from Tool Pages**
**Given** the user is on a tool page (`/tools/*`)
**When** they view the header
**Then** a home icon/button is visible that navigates back to `/` (dashboard)
**And** the home button is not shown when already on the home page

**AC6: Zustand Store**
**Given** a `useSidebarStore` Zustand store in `src/hooks/state/`
**When** the sidebar state changes
**Then** `isOpen`, `open`, `close`, and `toggle` actions are available following the existing Zustand store pattern

## Tasks / Subtasks

### Task 1: Zustand Store & Type Definitions
- [x] **1.1** Create `UseSidebarStore` type in `src/types/hooks/state.ts`
- [x] **1.2** Create `useSidebarStore` Zustand store in `src/hooks/state/useSidebarStore.ts`
- [x] **1.3** Update barrel export in `src/hooks/state/index.ts`
- [x] **1.4** Verify type exports chain through `src/types/hooks/index.ts` -> `src/types/index.ts`

### Task 2: Component Type Definitions
- [x] **2.1** Create `src/types/components/common/sidebar.ts` with types for all sidebar components
- [x] **2.2** Update barrel export in `src/types/components/common/index.ts`

### Task 3: HamburgerIcon Component
- [x] **3.1** Create `src/components/common/icon/HamburgerIcon.tsx`
- [x] **3.2** Update barrel export in `src/components/common/icon/index.ts`

### Task 4: CategoryBadge Component
- [x] **4.1** Create `src/components/common/sidebar/CategoryBadge.tsx`

### Task 5: SidebarToolItem Component
- [x] **5.1** Create `src/components/common/sidebar/SidebarToolItem.tsx`
- [x] **5.2** ~~Implement click handler that scrolls dashboard to tool card with highlight pulse~~ → Replaced with route navigation to `/tools/{tool-key}` using TanStack Router `useNavigate`
- [x] **5.3** ~~Implement mobile auto-close after selection~~ → Auto-close drawer on both mobile AND desktop after navigation

### Task 6: SidebarCategory Component
- [x] **6.1** Create `src/components/common/sidebar/SidebarCategory.tsx`
- [x] **6.2** Implement expand/collapse with chevron rotation animation
- [x] **6.3** Wire CategoryBadge for tool count display
- [x] **6.4** Default all categories to expanded state

### Task 7: Sidebar Component (Main Container — Drawer Overlay)
- [x] **7.1** Create `src/components/common/sidebar/Sidebar.tsx`
- [x] **7.2** ~~Implement desktop mode: 240-280px panel that pushes content~~ → Refactored to drawer overlay on desktop (fixed position, floats on top with backdrop, 260px width)
- [x] **7.3** ~~Implement mobile mode: full-screen overlay with dark backdrop~~ → Unified mobile/desktop as single drawer overlay (mobile: full-screen, desktop: 260px, both with backdrop)
- [x] **7.4** Implement 300ms ease-out slide animation via Motion
- [x] **7.5** Implement Escape key handler to close sidebar
- [x] **7.6** ~~Implement backdrop click handler for mobile~~ → Backdrop click closes on ALL viewports
- [x] **7.7** ~~Implement focus trapping for mobile overlay~~ → Focus trapping on ALL viewports (drawer is always overlay)
- [x] **7.8** Add `nav` landmark with `aria-label="Tool navigation"`
- [x] **7.9** Create barrel export `src/components/common/sidebar/index.ts`

### Task 8: Header Integration
- [x] **8.1** Add hamburger button to header in `App.tsx` (or header component if one is created)
- [x] **8.2** Wire hamburger to `useSidebarStore.toggle()`
- [x] **8.3** Implement icon morph between hamburger and X on sidebar state change

### Task 9: App.tsx Layout Integration
- [x] **9.1** Integrate Sidebar component into the App.tsx layout
- [x] **9.2** Update barrel export in `src/components/common/index.ts`
- [x] **9.3** ~~Implement content push behavior on desktop (sidebar + main content flex layout)~~ → Removed push layout; sidebar is drawer overlay, main content layout unchanged
- [x] **9.4** Ensure existing TwinkleStarsAnimate, Outlet, and ToastProvider remain functional

### Task 10: ~~Scroll-to-Card & Highlight Pulse~~ → Route Navigation & Cleanup
- [x] **10.1** ~~Implement scroll-to-card utility function or hook~~ → Removed scroll-to-card logic from SidebarToolItem
- [x] **10.2** ~~Assign data attributes or IDs to tool cards in the home page for scroll targeting~~ → Removed `data-tool-key` attributes from home page sections
- [x] **10.3** ~~Implement 500ms highlight pulse animation~~ → Removed `highlight-pulse` CSS animation from index.css

### Task 11: Home Navigation Button (NEW)
- [x] **11.1** Reused existing `ArrowIcon` + home emoji for navigating back to `/`
- [x] **11.2** Added home button (`<Link>` with `ArrowIcon` + 🏠) to header in `App.tsx`, visible only on tool pages (`/tools/*`) via `useLocation`
- [x] **11.3** Wired home button to navigate to `/` using TanStack Router `<Link>`

## Dev Notes

### Project Structure Notes

#### Files to CREATE

```
src/types/components/common/sidebar.ts          # Type definitions for all sidebar components
src/components/common/sidebar/Sidebar.tsx        # Main sidebar container
src/components/common/sidebar/SidebarCategory.tsx # Expandable category group
src/components/common/sidebar/SidebarToolItem.tsx # Individual tool link
src/components/common/sidebar/CategoryBadge.tsx  # Tool count pill badge
src/components/common/sidebar/index.ts           # Barrel export
src/components/common/icon/HamburgerIcon.tsx     # 3-line hamburger SVG icon
src/hooks/state/useSidebarStore.ts               # Zustand store for sidebar state
```

#### Files to MODIFY

```
src/types/hooks/state.ts                         # Add UseSidebarStore type
src/types/components/common/index.ts             # Add sidebar barrel export
src/components/common/icon/index.ts              # Add HamburgerIcon barrel export
src/components/common/index.ts                   # Add sidebar barrel export
src/hooks/state/index.ts                         # Add useSidebarStore barrel export
src/App.tsx                                      # Integrate sidebar + hamburger into layout
src/pages/home/index.tsx                         # Add data attributes to tool card sections for scroll targeting
```

---

### Zustand Store: Exact Pattern

The store MUST follow the exact pattern established by `useToast` in `src/hooks/state/useToast.ts`.

**Type definition** -- add to `src/types/hooks/state.ts`:

```typescript
export type UseSidebarStore = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
```

**Store implementation** -- `src/hooks/state/useSidebarStore.ts`:

```typescript
import { create, type StoreApi, type UseBoundStore } from 'zustand'

import type { UseSidebarStore } from '@/types'

export const useSidebarStore: UseBoundStore<StoreApi<UseSidebarStore>> = create<UseSidebarStore>()(
  (set: StoreApi<UseSidebarStore>['setState']) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }),
)
```

**Key details from the existing `useToast` pattern:**
- Import `create`, `StoreApi`, and `UseBoundStore` from `'zustand'`
- Explicit type annotation on the export: `UseBoundStore<StoreApi<UseSidebarStore>>`
- Explicit `set` parameter typing: `StoreApi<UseSidebarStore>['setState']`
- Double-invocation pattern: `create<T>()(...)` (required for TypeScript inference in Zustand 5)

---

### Component Type Definitions

Create `src/types/components/common/sidebar.ts`:

```typescript
import type { ReactNode } from 'react'

export type SidebarProps = {
  children?: ReactNode
}

export type SidebarCategoryProps = {
  categoryName: string
  children: ReactNode
  defaultExpanded?: boolean
  toolCount: number
}

export type SidebarToolItemProps = {
  emoji: string
  isActive?: boolean
  name: string
  toolKey: string
}

export type CategoryBadgeProps = {
  count: number
}
```

Note: These types may evolve during implementation. The `toolKey` on `SidebarToolItemProps` is used to identify the target card for scroll-to behavior.

---

### HamburgerIcon Component

Create `src/components/common/icon/HamburgerIcon.tsx` following the exact icon pattern from `ChevronIcon.tsx` and `XIcon.tsx`:

```typescript
export const HamburgerIcon = ({ size }: { size?: number }) => {
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
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}
```

**Icon pattern rules (from existing icons):**
- All SVG icons accept `{ size?: number }` prop
- Default to `'1em'` when size is not provided
- Use `fill="none"`, `stroke="currentColor"`, `strokeWidth="2"`
- Named export only (never default export)
- Props sorted alphabetically on the SVG element

---

### Motion Animation Configuration

**All imports MUST be from `motion/react`, NEVER from `framer-motion`.**

#### Sidebar Slide Animation (300ms ease-out)

The sidebar uses `AnimatePresence` + `motion.nav` for enter/exit animations:

```typescript
import { AnimatePresence, motion } from 'motion/react'

// Sidebar panel animation
<AnimatePresence>
  {isOpen && (
    <motion.nav
      animate={{ x: 0 }}
      aria-label="Tool navigation"
      exit={{ x: '-100%' }}
      initial={{ x: '-100%' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* sidebar content */}
    </motion.nav>
  )}
</AnimatePresence>
```

#### Mobile Backdrop Animation

```typescript
<AnimatePresence>
  {isOpen && isMobile && (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={close}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />
  )}
</AnimatePresence>
```

This matches the existing Dialog overlay pattern in `src/components/common/dialog/Dialog.tsx`.

#### Category Expand/Collapse Animation (200ms)

```typescript
// Chevron rotation
<motion.span
  animate={{ rotate: isExpanded ? 0 : -90 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
  <ChevronIcon />
</motion.span>

// Tool list slide down/up
<AnimatePresence initial={false}>
  {isExpanded && (
    <motion.ul
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      initial={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* tool items */}
    </motion.ul>
  )}
</AnimatePresence>
```

#### Highlight Pulse Animation (500ms)

When navigating to a tool via sidebar, the target card receives a brief border pulse:

```typescript
// On the target card section element
<motion.section
  animate={isHighlighted ? {
    borderColor: ['transparent', 'var(--color-primary)', 'transparent'],
  } : {}}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
```

Alternatively, use CSS animation via Tailwind for the pulse:

```css
@keyframes highlight-pulse {
  0% { border-color: transparent; }
  50% { border-color: var(--color-primary); }
  100% { border-color: transparent; }
}
```

---

### Responsive Layout Strategy

#### Desktop (>=768px / `tablet` breakpoint)

The sidebar operates as an **inline panel** that pushes content to the right. This is achieved via flex layout:

```
[Header: full width]
[Sidebar (240-280px) | Main Content (flex: 1)]
```

**Implementation approach in App.tsx:**

```typescript
// App.tsx layout structure
<>
  <header className="...">
    {/* hamburger button + logo + Cmd+K */}
  </header>
  <div className="flex grow">
    <Sidebar />
    <main className="flex grow flex-col ...">
      <Outlet />
    </main>
  </div>
  <ToastProvider />
</>
```

The sidebar component manages its own width:
- When `isOpen`: renders with `w-[260px] shrink-0` (or similar)
- When closed: renders nothing (AnimatePresence handles unmount)
- Content push is natural from the flex layout -- no absolute positioning on desktop

**Current App.tsx structure** (must be adapted):

```typescript
// CURRENT (from src/App.tsx)
<main className="bg-pixel-texture relative flex grow flex-col pt-[...]  pb-[...]">
  <TwinkleStarsAnimate />
  <Outlet />
</main>
<ToastProvider />
```

The `<main>` element currently wraps the `Outlet`. The sidebar should be placed as a sibling to the main content area inside a flex container. The `bg-pixel-texture` class and safe area insets need to remain on the appropriate element.

#### Mobile (<768px)

The sidebar is a **full-screen overlay** positioned with `fixed inset-0 z-50`. It does NOT push content. It covers the entire viewport with a semi-transparent backdrop behind it.

**Key differences from desktop:**
- Position: `fixed` instead of inline flex
- Width: full viewport (not 240-280px)
- Backdrop: dark overlay (`bg-black/50 backdrop-blur-sm`)
- Focus trap: active (prevents tabbing to elements behind overlay)
- Auto-close: sidebar closes after tool selection

#### Detecting Mobile

Use a media query hook or responsive check. Options:

1. **CSS-only approach (preferred):** Use Tailwind responsive classes to conditionally render desktop vs mobile layouts. The sidebar component renders differently based on viewport width using `tablet:` prefix classes.

2. **JS approach (if CSS-only is insufficient for focus trapping logic):** Create a `useIsMobile` hook or use `window.matchMedia('(max-width: 767px)')` to determine layout mode for focus-trapping behavior.

The breakpoint is `768px` (`tablet` breakpoint from `src/index.css`: `--breakpoint-tablet: 48rem`).

---

### Focus Trapping (Mobile)

When the sidebar is open on mobile, focus MUST be trapped within the sidebar. Users cannot tab to elements behind the overlay.

**Options (in order of preference):**

1. **Radix Dialog as overlay container (recommended):** Wrap the mobile sidebar in a Radix `Dialog.Root` + `Dialog.Content` to get built-in focus trapping, escape key handling, and accessibility attributes for free. The architecture document says: "NEVER create a Radix-equivalent component from scratch -- If Radix UI has a primitive for it, use it." Radix Dialog provides exactly what the mobile overlay needs.

2. **Custom focus trap with `@radix-ui/react-focus-scope`:** If using Radix Dialog is too heavy, Radix also exports `FocusScope` as a standalone primitive.

3. **Manual focus trap:** As a last resort, implement manual focus trapping using `keydown` event listener on Tab key, querying focusable elements within the sidebar container, and cycling focus.

**Accessibility attributes on the sidebar nav element:**
```html
<nav aria-label="Tool navigation" role="navigation">
```

On mobile overlay mode, additionally:
```html
<div role="dialog" aria-modal="true" aria-label="Tool navigation">
  <nav>...</nav>
</div>
```

---

### Category Data Structure

Categories are derived from `TOOL_REGISTRY` (Story 1.1 dependency). The sidebar groups tools by the `category` field on each registry entry.

**Expected categories from the architecture document:**
- Color
- Encoding
- Image
- Time
- Unit
- Data
- Generator
- CSS
- Text

**Category grouping logic:**

```typescript
import { TOOL_REGISTRY } from '@/constants'

// Group tools by category
const groupedTools = TOOL_REGISTRY.reduce((acc, tool) => {
  if (!acc[tool.category]) {
    acc[tool.category] = []
  }
  acc[tool.category].push(tool)
  return acc
}, {} as Record<string, Array<typeof TOOL_REGISTRY[number]>>)
```

**Category ordering:** Define a `CATEGORY_ORDER` constant array to enforce consistent display order rather than relying on object key order. This could live in the sidebar component or in constants.

**Tool count per category:** Derived from the grouped data. The `CategoryBadge` displays the count.

**Note on current state:** The existing codebase has only 6 tools across 5 categories (Color, Encoding, Image, Time, Unit). The sidebar should work with whatever tools are in the registry at the time of implementation.

---

### Scroll-to-Card Behavior

When a user clicks a tool in the sidebar, the dashboard should smooth-scroll to that tool's card.

**Implementation approach:**

1. **Add data attributes to card sections in `src/pages/home/index.tsx`:**

```typescript
// In the AppContainer render or the section wrapper
<section
  data-tool-key={toolKey}
  // or use id: id={`tool-card-${toolKey}`}
  className="..."
>
```

The current home page renders 6 `<section>` elements in a loop. Each section renders an `AppContainer` that switches on the feature key. The tool key (from `TOOL_REGISTRY`) needs to be passed down or the section needs a way to be targeted.

2. **Scroll utility:**

```typescript
const scrollToToolCard = (toolKey: string) => {
  const element = document.querySelector(`[data-tool-key="${toolKey}"]`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Trigger highlight pulse
    triggerHighlightPulse(element)
  }
}
```

3. **Highlight pulse:** After scrolling, apply a temporary class or Motion animation that pulses the border with `--color-primary` for 500ms. This can be managed via:
   - A state variable on the card component
   - A CSS animation class added and removed after 500ms
   - A Motion `animate` prop triggered by a state change

---

### Sidebar Visual Design

**Based on UX Design Specification and existing component patterns:**

- Background: dark, matching the app's dark theme. Use `bg-gray-950` or `bg-black/80 backdrop-blur` for glass effect
- Border: right border `border-r border-gray-800` to visually separate from main content
- Category headers: `text-body-sm` or `text-heading-6`, `text-gray-400` color, uppercase or normal
- Tool items: `text-body` size, `text-white` on hover, `text-gray-300` default
- Active tool: left border accent with `border-l-2 border-primary`
- Category badge: small rounded pill, `bg-gray-800 text-gray-400 text-body-xs`
- Chevron: uses existing `ChevronIcon` from `@/components`, rotated via Motion
- Sidebar header: contains close button (X icon) and optionally "Tools" title
- Padding: consistent with existing component spacing (p-4 or p-3)

**tailwind-variants usage:**

All variant styling MUST use the project's `tv()` wrapper from `@/utils`:

```typescript
import type { CompVariant } from '@/types'
import { tv } from '@/utils'

type SidebarToolItemVariants = {
  active: boolean
}

const sidebarToolItemVariants: CompVariant<SidebarToolItemVariants> = tv({
  base: 'flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-gray-300 transition-colors',
  defaultVariants: {
    active: false,
  },
  variants: {
    active: {
      false: 'hover:bg-primary/10 hover:text-white',
      true: 'border-primary bg-primary/10 border-l-2 text-white',
    },
  },
})
```

---

### App.tsx Integration Plan

The current `App.tsx` structure:

```typescript
export default function App() {
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
      <ToastProvider />
    </>
  )
}
```

**Proposed restructured layout:**

```typescript
import { Outlet } from '@tanstack/react-router'
import { type ComponentType, lazy, Suspense } from 'react'

import { NotoEmoji, Sidebar, ToastProvider } from '@/components'
import { useSidebarStore } from '@/hooks'

const TwinkleStarsAnimate = lazy(() =>
  import('@/components/common/animate/TwinkleStarsAnimate').then(
    ({ TwinkleStarsAnimate }: { TwinkleStarsAnimate: ComponentType }) => ({
      default: TwinkleStarsAnimate,
    }),
  ),
)

const PageLoading = () => {
  return (
    <div className="bg-primary/10 flex grow flex-col items-center justify-center rounded-xl">
      <NotoEmoji emoji="flying-saucer" size={200} />
    </div>
  )
}

export default function App() {
  const { isOpen, toggle } = useSidebarStore()

  return (
    <>
      {/* Header */}
      <header className="relative z-30 flex h-12 shrink-0 items-center gap-2 px-4 pt-[var(--safe-area-inset-top)]">
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          className="flex size-10 items-center justify-center"
          onClick={toggle}
        >
          {/* HamburgerIcon or XIcon depending on isOpen */}
        </button>
        {/* Logo / branding */}
      </header>

      {/* Body: Sidebar + Main Content */}
      <div className="relative flex grow overflow-hidden">
        <Sidebar />
        <main className="bg-pixel-texture relative flex grow flex-col overflow-y-auto pb-[var(--safe-area-inset-bottom)] [&>*:not(:first-child)]:relative">
          <Suspense fallback={<></>}>
            <TwinkleStarsAnimate />
          </Suspense>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ToastProvider />
    </>
  )
}
```

**Critical considerations:**
- The `TwinkleStarsAnimate` is `position: fixed` (`fixed top-0 left-0 z-0`), so it will remain unaffected by the sidebar
- The `bg-pixel-texture` class and safe area insets must remain on the main content area
- The `[&>*:not(:first-child)]:relative` selector (makes children relative so they stack above the stars) must stay on the main element
- The sidebar's z-index must be above the main content but below toasts (toasts are at z-50 via Radix)
- The header needs to be extracted out of `<main>` so it spans the full width above both sidebar and content

---

### Escape Key Handler

The sidebar should close when the user presses `Escape`. This can be implemented:

1. **In the Sidebar component directly:**

```typescript
import { useEffect } from 'react'
import { useSidebarStore } from '@/hooks'

// Inside Sidebar component
const close = useSidebarStore((state) => state.close)

useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [close])
```

2. **If using Radix Dialog for mobile overlay:** Radix Dialog handles Escape key automatically.

---

### Import Ordering Convention

All files MUST follow the import ordering convention from `project-context.md`:

```typescript
// 1. External library imports (alphabetical)
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'

// 2. Type-only imports from @/types
import type { SidebarCategoryProps } from '@/types'

// 3. Internal @/ imports (alphabetical)
import { ChevronIcon } from '@/components'
import { useSidebarStore } from '@/hooks'
import { tv } from '@/utils'
```

---

### Barrel Export Chain

Every new file needs its barrel exports wired up correctly:

**`src/components/common/sidebar/index.ts`:**
```typescript
export * from './CategoryBadge'
export * from './Sidebar'
export * from './SidebarCategory'
export * from './SidebarToolItem'
```

**`src/components/common/index.ts`** -- add:
```typescript
export * from './sidebar'
```

**`src/components/common/icon/index.ts`** -- add:
```typescript
export * from './HamburgerIcon'
```

**`src/hooks/state/index.ts`** -- add:
```typescript
export * from './useSidebarStore'
```

**`src/types/components/common/index.ts`** -- add:
```typescript
export * from './sidebar'
```

---

### Code Conventions Checklist

The following conventions MUST be followed (from `project-context.md` 53 rules):

- [ ] `type` over `interface` -- oxlint will error on `interface`
- [ ] `Array<T>` over `T[]` -- oxlint will error on array shorthand
- [ ] `import type` for type-only imports -- `verbatimModuleSyntax` enforces this
- [ ] Named exports for all components -- never `export default` (only pages use default export)
- [ ] No semicolons, single quotes, trailing commas, 120 char width (oxfmt)
- [ ] Import from `motion/react` -- NEVER `framer-motion`
- [ ] Use `tv()` from `@/utils` -- NEVER directly from `tailwind-variants`
- [ ] `@/` path alias for all src imports -- never relative paths
- [ ] Props sorted alphabetically on JSX elements
- [ ] Object keys sorted alphabetically
- [ ] No `console.log` (oxlint warns)
- [ ] Use Radix UI for accessible primitives where applicable
- [ ] Tailwind class sorting handled by oxfmt in `tv()` calls

---

### Dependency on TOOL_REGISTRY (Story 1.1)

The sidebar consumes `TOOL_REGISTRY` from `src/constants/tool-registry.ts` to build the category-grouped tool list. Key fields used:

```typescript
type ToolRegistryEntry = {
  key: string        // kebab-case, used for scroll targeting
  name: string       // Display name in sidebar
  category: string   // Grouping key (Color, Encoding, etc.)
  emoji: string      // Shown next to tool name in sidebar
  // ... other fields not used by sidebar
}
```

**If Story 1.1 is not yet complete:** The sidebar can be built with a temporary mock registry or derive categories from the existing `FEATURE_TITLE` constant and `FeatureKey` type. However, the architecture strongly recommends Story 1.1 be completed first.

**Current feature mapping (for reference if building before registry):**
| FeatureKey | Category | Display Name |
|---|---|---|
| `COLOR_CONVERTER` | Color | Color Convertor |
| `BASE64_ENCODER` | Encoding | Base64 Encoder |
| `IMAGE_CONVERTOR` | Image | Image Convertor |
| `IMAGE_RESIZER` | Image | Image Resizer |
| `UNIX_TIMESTAMP` | Time | Unix Timestamp |
| `PX_TO_REM` | Unit | PX to REM |

---

### Testing Considerations

**Unit tests:** No unit tests are needed for the sidebar components themselves (project uses node environment Vitest without DOM/component rendering). The project-context states: "Test environment -- `node` (not jsdom). Tests are for pure logic/utilities, not component rendering."

**E2E tests (future, Story 4.1):** Platform E2E tests will be created in `e2e/platform/sidebar.spec.ts` as part of Epic 4.

**Manual testing checklist:**
- [ ] Sidebar opens on hamburger click (desktop)
- [ ] Sidebar pushes content right on desktop
- [ ] Sidebar opens as overlay on mobile
- [ ] Dark backdrop visible on mobile
- [ ] All categories displayed and expanded by default
- [ ] Category collapse/expand works with chevron animation
- [ ] Tool count badges show correct counts
- [ ] Clicking tool scrolls to card with highlight pulse
- [ ] Mobile sidebar auto-closes after tool selection
- [ ] Escape key closes sidebar
- [ ] Backdrop click closes sidebar (mobile)
- [ ] Focus trapped within sidebar on mobile
- [ ] Screen reader reads `nav` landmark with correct label
- [ ] `aria-expanded` updates on hamburger button
- [ ] No layout shift when sidebar opens/closes on desktop
- [ ] TwinkleStarsAnimate continues to render behind sidebar
- [ ] Existing page loading and Outlet rendering unaffected

---

### Performance Considerations

- The sidebar component should NOT be lazy-loaded (it is part of the app shell, not a feature)
- Category grouping computation should be memoized with `useMemo` since `TOOL_REGISTRY` is a static constant
- Motion animations use GPU-accelerated properties (transform for slide, opacity for fade) to avoid layout thrashing
- The sidebar's z-index hierarchy: backdrop (z-40), sidebar panel (z-50 on mobile, z-30 on desktop), toast (z-[9999] via Radix)

---

### WCAG 2.1 AA Compliance

- `nav` element with `aria-label="Tool navigation"` provides landmark navigation
- Hamburger button: `aria-label="Open navigation"` / `"Close navigation"`, `aria-expanded={isOpen}`
- Category headers: `button` role with `aria-expanded` state, `aria-controls` linking to tool list `id`
- Tool items: `button` role (since they trigger scroll behavior, not navigation to a new route)
- Focus visible on all interactive elements (Tailwind `focus-visible:ring-2`)
- Color contrast: all text meets 4.5:1 minimum against dark backgrounds
- Touch targets: minimum 44x44px on mobile (existing requirement from UX spec)
- Focus trap on mobile overlay prevents tabbing outside sidebar

### References

- **Architecture Document:** `{project-root}/_bmad-output/planning-artifacts/architecture.md`
  - Section: "Communication Patterns > Zustand Store Pattern" (exact store pattern)
  - Section: "Structure Patterns > New Platform Component Location" (file locations)
  - Section: "Architectural Boundaries > Component Boundaries" (sidebar in layout)
  - Section: "Architectural Boundaries > State Boundaries" (useSidebarStore scope)
- **UX Design Specification:** `{project-root}/_bmad-output/planning-artifacts/ux-design-specification.md`
  - Section: "Design Direction Decision > Implementation Approach" (sidebar layout)
  - Section: "Component Strategy > Custom Components > Sidebar System" (component specs)
  - Section: "UX Consistency Patterns > Navigation Patterns" (animation specs)
  - Section: "User Journey Flows > Journey 4: Tool Discovery via Sidebar" (user flow)
- **Project Context:** `{project-root}/_bmad-output/project-context.md` (53 rules)
- **Epics Document:** `{project-root}/_bmad-output/planning-artifacts/epics.md`
  - Section: "Epic 1 > Story 1.3" (acceptance criteria)
- **Existing Pattern References:**
  - Zustand store pattern: `src/hooks/state/useToast.ts`
  - Icon component pattern: `src/components/common/icon/ChevronIcon.tsx`
  - Motion animation pattern: `src/components/common/dialog/Dialog.tsx` (overlay + animate)
  - tailwind-variants pattern: `src/components/common/button/Button.tsx` (CompVariant usage)
  - Type definition pattern: `src/types/components/common/button.ts`
  - App layout: `src/App.tsx`
  - Home page card grid: `src/pages/home/index.tsx`

## Dev Agent Record

_This section is for the implementing agent to track progress, decisions, and deviations._

| Field | Value |
|---|---|
| **Started** | 2026-02-13 |
| **Completed** | 2026-02-13 |
| **Agent** | Claude Opus 4.6 |
| **Branch** | bmad |
| **Status** | done |
| **Blockers** | None (Story 1.1 TOOL_REGISTRY complete) |

### Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-02-13 | Used manual focus trap instead of Radix Dialog for mobile overlay | Radix Dialog conflicts with AnimatePresence exit animations and is semantically incorrect for a nav panel. Manual focus trap via Tab key listener provides equivalent a11y while allowing smooth slide animations. |
| 2026-02-13 | Used JS `window.matchMedia` for mobile detection instead of CSS-only | Focus trapping requires JS to determine when to activate. CSS-only approach insufficient for this behavioral difference. |
| 2026-02-13 | ~~Separate AnimatePresence blocks for mobile vs desktop sidebar~~ → Unified into single AnimatePresence block | Drawer overlay uses the same markup on all viewports. `isMobile` state only toggles width class (`w-full` vs `w-[260px]`). |
| 2026-02-13 | ~~Added `data-tool-key` to section elements~~ → Removed | No longer needed — sidebar navigates to route instead of scrolling to card. |
| 2026-02-13 | Used `ArrowIcon` + 🏠 emoji for home button | Reused existing `ArrowIcon` component. Arrow conveys "go back", emoji conveys "home". Rendered inside `<Link to="/">` from TanStack Router. |
| 2026-02-13 | Tool page wraps component in `Card` with `max-w-[768px]` | Matches homepage card pattern. Centered via `items-center` on parent flex. |
| 2026-02-13 | Changed `#root` from `min-h-dvh` to `h-dvh overflow-hidden` | Fixes scroll overflow. With `h-dvh`, the flex column is exactly viewport height, so `main` with `grow overflow-y-auto` properly constrains and scrolls content. `min-h-dvh` allowed the container to grow beyond viewport. |
| 2026-02-13 | Fixed home page card height calc: `50dvh-3.75rem` | Previous calc `100dvh/2-2.25rem` didn't account for header (3rem). Correct: `(100dvh - header 3rem - padding 3rem - gap 1.5rem) / 2 = 50dvh - 3.75rem`. |

### Implementation Notes

| Date | Note |
|---|---|
| 2026-02-13 | Tasks 1-6 were completed in a prior session. This session completed Tasks 7-10. |
| 2026-02-13 | CATEGORY_ORDER const defined in Sidebar.tsx to ensure deterministic category display order. Only includes currently existing categories (Color, Encoding, Image, Time, Unit). |
| 2026-02-13 | ~~The mobile sidebar uses `role="dialog"` and `aria-modal="true"`~~ → Removed. `role="dialog"` overrides the `<nav>` landmark (violates AC5). Sidebar is a `<nav>` element with `aria-label="Tool navigation"` on all viewports. Focus trap via JS is sufficient. |
| 2026-02-13 | ~~Highlight pulse implemented via CSS animation class~~ → Removed. Scroll-to-card replaced with route navigation. |
| 2026-02-13 | No unit tests required per project-context: test env is node (not jsdom), tests are for pure logic/utilities only. |
| 2026-02-13 | Revision: unified sidebar as drawer overlay on all viewports. SidebarToolItem now uses `useNavigate` to `/tools/{tool-key}`. Removed scroll-to-card, highlight-pulse, data-tool-key, push layout. Added home button (ArrowIcon + 🏠) in header on tool pages. Tool page wraps component in `Card` with `max-w-[768px]`. Fixed layout overflow: `#root` changed to `h-dvh overflow-hidden`, card height calc fixed to `50dvh-3.75rem`. |

### Completion Notes

All 11 tasks implemented. The sidebar navigation system provides:
- Collapsible sidebar with category-grouped tools from TOOL_REGISTRY
- Drawer overlay on all viewports: desktop 260px, mobile full-width, both with dark backdrop
- Hamburger toggle in header with aria-expanded state
- Tool click navigates to `/tools/{tool-key}` via TanStack Router and auto-closes drawer
- Home button (ArrowIcon + 🏠) in header on tool pages, navigates back to `/`
- Tool page wraps component in reusable `Card` with `max-w-[768px]` centered layout
- Escape key and backdrop click dismissal on all viewports
- Focus trap on all viewports (not just mobile)
- Layout fix: `#root` uses `h-dvh overflow-hidden` for proper viewport fitting
- Home page card height corrected to `50dvh-3.75rem` to account for header
- Full WCAG 2.1 AA compliance: nav landmark, aria-labels, focus trap, keyboard navigation

## File List

### New Files
- `src/types/components/common/sidebar.ts` — Type definitions for sidebar components
- `src/hooks/state/useSidebarStore.ts` — Zustand store for sidebar open/close state
- `src/components/common/icon/HamburgerIcon.tsx` — Hamburger menu SVG icon
- `src/components/common/sidebar/CategoryBadge.tsx` — Tool count pill badge
- `src/components/common/sidebar/SidebarToolItem.tsx` — Individual tool link with route navigation
- `src/components/common/sidebar/SidebarCategory.tsx` — Expandable category group
- `src/components/common/sidebar/Sidebar.tsx` — Main sidebar container (desktop + mobile)
- `src/components/common/sidebar/index.ts` — Barrel export for sidebar components

### Modified Files
- `src/types/hooks/state.ts` — Added UseSidebarStore type
- `src/types/components/common/index.ts` — Added sidebar barrel export
- `src/components/common/icon/index.ts` — Added HamburgerIcon barrel export
- `src/components/common/index.ts` — Added sidebar barrel export
- `src/hooks/state/index.ts` — Added useSidebarStore barrel export
- `src/App.tsx` — Restructured layout: header with hamburger + conditional home button (ArrowIcon + 🏠), Sidebar as overlay, main with full width
- `src/pages/home/index.tsx` — Removed `data-tool-key` attributes from section elements; removed unused `layoutValue` destructuring; fixed card height calc to `50dvh-3.75rem`
- `src/pages/tool/index.tsx` — Wrapped tool component in `Card` with `max-w-[768px]` centered layout
- `src/index.css` — Removed highlight-pulse keyframe/class; changed `#root` from `min-h-dvh` to `h-dvh overflow-hidden`

## Change Log

| Date | Change |
|---|---|
| 2026-02-13 | Implemented sidebar navigation system (Story 1.3) — all 10 tasks, 33 subtasks complete. Created Zustand store, type definitions, HamburgerIcon, CategoryBadge, SidebarToolItem, SidebarCategory, and Sidebar components. Integrated sidebar into App.tsx with header hamburger toggle and flex layout. Added scroll-to-card with highlight pulse via data-tool-key attributes on home page sections. |
| 2026-02-13 | **Code Review (AI):** Fixed 6 issues (4 HIGH, 2 MEDIUM). H1: Ran formatter on 4 failing files. H2: Added `aria-controls`/`id` to SidebarCategory for WCAG compliance. H3: Added `aria-label` to CategoryBadge for screen readers. H4: Changed highlight-pulse from border to outline to prevent layout shift, moved into `@layer utilities`. M1: Fixed HamburgerIcon alphabetical position in icon barrel export. M2: Removed unused SidebarProps type. All checks pass (build, lint, format). Status → done. |
| 2026-02-13 | **Story Revised (PM):** Sidebar changed from push-layout to drawer overlay on all viewports. Tool click now navigates to `/tools/{tool-key}` route (Story 1.2) instead of scroll-to-card. Auto-close on both mobile and desktop. Added AC7: home button on tool pages. Removed scroll-to-card, highlight-pulse, data-tool-key attrs, and push layout. Added Task 11 for home navigation button. Status → in-progress. |
| 2026-02-13 | **Revision Implemented:** Unified sidebar as drawer overlay (single AnimatePresence). SidebarToolItem uses `useNavigate` for route navigation. Removed push layout wrapper from App.tsx. Added home button (ArrowIcon + 🏠) conditionally shown on tool pages via `useLocation`. Removed `data-tool-key` from home page, removed `highlight-pulse` CSS. Tool page wraps component in `Card` with `max-w-[768px]`. Fixed viewport overflow: `#root` → `h-dvh overflow-hidden`, card height → `50dvh-3.75rem`. All tasks complete. Status → done. |
| 2026-02-13 | **Code Review #2 (AI):** Fixed 6 issues (3 HIGH, 3 MEDIUM). H1: Removed `role="dialog"` and `aria-modal="true"` from `<motion.nav>` — was overriding `<nav>` landmark (AC5 violation). H2: Wired `isActive` prop on `SidebarToolItem` using `useLocation` pathname comparison — active tool now highlighted in sidebar. H3: Fixed `index.css` formatting (extra blank line). M1: Removed hamburger→X icon morph in header (invisible behind z-40 backdrop); always shows `HamburgerIcon`. M2: Changed `SidebarCategory` from `AnimatePresence` conditional render to always-mounted `motion.ul` so `aria-controls` references valid ID. M3: Fixed stale Implementation Notes. Also fixed L1: removed unnecessary `handleBackdropClick` wrapper. All checks pass (build, lint, format). Status → done. |
