---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

<!-- DEPRECATION NOTICE (story 3-1): ToolLayout and OutputDisplay were deprecated and removed.
     Each tool owns its own layout. CopyButton remains active. References to ToolLayout/OutputDisplay
     in epic dependencies and story ACs below are outdated — ignore them during implementation. -->

# csr-dev-tools - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for csr-dev-tools, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can process any supported conversion/transformation entirely in the browser without server communication
FR2: Users can upload files (images, text) from their device for processing
FR3: Users can download or copy processed output to their clipboard or device
FR4: Users can see processing results within 500ms without page reload
FR5: Users can convert colors between HEX, RGB, and HSL formats
FR6: Users can input colors via text input or visual color picker
FR7: Users can copy converted color values to clipboard
FR8: Users can encode and decode Base64 strings
FR9: Users can encode and decode URLs
FR10: Users can decode JWT tokens to view header and payload
FR11: Users can convert images between PNG, JPG, WebP, GIF, BMP, and AVIF formats (where browser-supported)
FR12: Users can resize images with custom width and height dimensions
FR13: Users can compress JPEG and WebP images using a quality slider (1-100) and see the resulting file size before downloading
FR14: Users can crop images using freeform selection or common aspect ratio presets (16:9, 4:3, 1:1, 3:2)
FR15: Users can convert between Unix timestamps and human-readable dates
FR16: Users can convert between PX and REM units with configurable base font size
FR17: Users can format and validate JSON with syntax highlighting
FR18: Users can convert between JSON and YAML formats
FR19: Users can convert between JSON and CSV formats
FR20: Users can compare two text inputs and see line-by-line differences highlighted
FR21: Users can test regular expressions against sample text with live match highlighting
FR22: Users can generate UUIDs (single or bulk)
FR23: Users can generate random passwords with configurable length (8-128 characters) and toggle inclusion of uppercase, lowercase, digits, and symbols
FR24: Users can generate hash values (MD5, SHA-1, SHA-256, SHA-512) from text input
FR25: Users can visually generate CSS box-shadow values with live preview
FR26: Users can browse all available tools from a central dashboard
FR27: Users can navigate directly to any tool via unique URL
FR28: Users can search or filter tools by name or category
FR29: Users can access any tool on mobile devices down to 375px viewport width with touch-friendly layout
FR30: Users can customize their dashboard layout via drag-and-drop
FR31: Users can have their layout preferences persist across sessions
~~FR32: Users can switch between light and dark themes~~ — **NOT PLANNED:** Dark-only theme
FR33: Contributors can add a new tool by following the CONTRIBUTING guide, which documents the required file structure (component, route, constants, tests) and a PR checklist
FR34: Contributors can run the development environment locally with standard tooling
FR35: Contributors can run tests to validate their changes against existing tool regression stories
FR36: Developers can reference a documented feature spec for each existing tool covering inputs, outputs, supported formats, and edge cases
FR37: Developers can run regression test stories for each existing tool covering happy paths, edge cases, and error states
FR38: Users can see a one-line tool description and placeholder text or tooltips on each input field explaining accepted formats and values

### NonFunctional Requirements

NFR1: Tool processing operations (color conversion, encoding, unit conversion) complete in under 100ms as measured by browser Performance API timing
NFR2: Image processing operations (resize, convert, compress) complete in under 3 seconds for files up to 10MB as measured by automated benchmark tests
NFR3: First Contentful Paint under 1.5 seconds on a 10 Mbps connection
NFR4: Largest Contentful Paint under 2.5 seconds
NFR5: Total Blocking Time under 200ms
NFR6: Cumulative Layout Shift under 0.1
NFR7: Lighthouse Performance score of 90+
NFR8: Adding new tools does not increase initial page load time
NFR9: Zero network requests for tool processing — all operations execute in the browser
NFR10: No cookies, localStorage tracking, or analytics scripts
NFR11: No third-party scripts that transmit user data
NFR12: File uploads are never persisted beyond the browser session and no upload data is transmitted externally
NFR13: All dependencies audited for known vulnerabilities via automated tooling
NFR14: WCAG 2.1 AA compliance across all tools and platform pages
NFR15: All interactive elements operable via keyboard alone
NFR16: Color contrast ratios meet AA minimums (4.5:1 text, 3:1 large text)
NFR17: Screen reader compatibility for all tool inputs, outputs, and error states
NFR18: Lighthouse Accessibility score of 90+
NFR19: Tool output correctness verified by automated regression tests
NFR20: All existing tools maintain 100% regression test pass rate before any release
NFR21: Application functions offline after initial load
NFR22: No runtime errors on supported browsers (Chrome, Firefox, Safari, Edge latest 2)
NFR23: Lighthouse SEO score of 90+
NFR24: Each tool page has unique title, meta description, and Open Graph tags
NFR25: Semantic HTML with proper heading hierarchy on all pages

### Additional Requirements

**From Architecture:**

- Brownfield project — no starter template needed. Existing MVP with 6 tools is the foundation.
- Centralized TOOL_REGISTRY in `src/constants/tool-registry.ts` as single source of truth for all tools (metadata, routes, lazy imports, SEO)
- Hybrid routing: tools live on dashboard (inline cards) AND have dedicated routes (`/tools/{tool-slug}`) for SEO and direct access
- Build-time pre-rendering via Vite plugin for per-tool SEO (static HTML generation per tool route)
- Separate Zustand stores per concern: `useSidebarStore`, `useCommandPaletteStore`
- Standardized error handling: `useToolError` hook + per-tool `ToolErrorBoundary`
- Shared validation utilities in `src/utils/validation.ts` (e.g., `isValidHex`, `isValidBase64`)
- Testing strategy: unit tests (Vitest, node env) for logic + E2E tests (Playwright) for user journeys — no component testing layer
- CI/CD pipeline: lint + format check + unit tests + build (with pre-rendering) + E2E tests + Lighthouse CI
- ToolLayout standardization — all tools use `ToolLayout` wrapper component for consistent rendering
- Code splitting per route via `lazyRouteComponent()` — each tool is its own chunk
- Tool component modes: card (dashboard) vs. page (dedicated route) via `mode` variant
- Implementation sequence: (1) Tool Registry, (2) Per-tool routes, (3) ToolLayout, (4) Sidebar + Command Palette, (5) Pre-rendering, (6) Validation utilities, (7) Error handling, (8) E2E + Lighthouse CI
- Input processing patterns: text tools on input change with 300ms debounce; file tools on explicit button click; generators on explicit button click; live preview on input change with 300ms debounce
- Loading state patterns: no spinners — use progress bars or skeleton states only. ProgressBar only for operations >300ms.
- Keyboard shortcuts: `Cmd+K` / `Ctrl+K` for Command Palette toggle (reserved). Centralized `useKeyboardShortcuts` hook.
- CONTRIBUTING.md required for contributor onboarding (FR33)

**From UX Design:**

- Sidebar system: collapsible panel on left (~240-280px on desktop), full-screen overlay on mobile. Categories with tool count badges. Hamburger toggle in header.
- Command Palette: `Cmd+K`/`Ctrl+K` keyboard-triggered search overlay with fuzzy filtering, arrow key navigation, Enter to select
- Standardized tool layout template (ToolLayout): header → input region → output region → action bar. Mobile stacks vertically.
- CopyButton component: icon morphs clipboard→check (300ms), reverts after 2s. Toast "Copied to clipboard".
- OutputDisplay component: formatted read-only output with integrated copy. `aria-live="polite"`. Variants: single, table, code.
- Dark-first theme with OKLCH color space. Space/Universe theme identity. Space Mono typography.
- Motion animations: sidebar slide (300ms ease-out), palette fade, button morphs via Motion library
- Real-time output for text tools (no "Convert" button needed); explicit action buttons for file tools and generators
- Error prevention first: constrain inputs, disable invalid options, smart defaults. Inline errors only, never modal.
- Error message format: concise, actionable, no blame. Always include example of valid input.
- Button hierarchy: primary (filled, max ONE per tool), secondary (outlined), tertiary (text-only), destructive (outlined error color)
- File upload zone: dashed border, upload icon, accepted formats listed. Drag-and-drop + click.
- Processing state: input locked (opacity 0.7) during processing, cancelable for long operations
- Card highlight pulse when navigating via sidebar or Command Palette (500ms, --color-primary border)
- Toast conventions: copy success = "Copied to clipboard", download success = "Downloaded [filename]", duration 2.5s auto-dismiss
- Responsive design: 375px min viewport, 44x44px touch targets, mobile-first breakpoints
- Zero-onboarding: every tool is self-explanatory via visible labels, smart placeholders, format hints
- Accessibility: Radix UI for accessible primitives, focus trapping in modals, `Escape` closes overlays, all elements keyboard-accessible

### FR Coverage Map

FR1: Epic 2 - Browser-only processing (ToolLayout enforces client-side pattern)
FR2: Epic 2 - File upload capability (UploadInput standardization)
FR3: Epic 2 - Download/copy output (CopyButton, OutputDisplay)
FR4: Epic 2 - Sub-500ms processing results (real-time output pattern)
FR5: Epic 3 - Color conversion between HEX, RGB, HSL (existing tool baseline)
FR6: Epic 3 - Color input via text or picker (existing tool enhancement)
FR7: Epic 3 - Copy color values to clipboard (existing tool baseline)
FR8: Epic 3 - Base64 encode/decode (existing tool baseline)
FR9: Epic 5 - URL encode/decode (new tool)
FR10: Epic 5 - JWT token decoding (new tool)
FR11: Epic 3 - Image format conversion (existing tool baseline)
FR12: Epic 3 - Image resize (existing tool baseline)
FR13: Epic 10 - Image compression with quality control (new capability)
FR14: Epic 10 - Image cropping with aspect ratio presets (new capability)
FR15: Epic 3 - Unix timestamp conversion (existing tool baseline)
FR16: Epic 3 - PX to REM conversion (existing tool baseline)
FR17: Epic 6 - JSON format/validate with syntax highlighting (new tool)
FR18: Epic 6 - JSON to YAML conversion (new tool)
FR19: Epic 6 - JSON to CSV conversion (new tool)
FR20: Epic 7 - Text diff comparison (new tool)
FR21: Epic 7 - Regex testing with live highlighting (new tool)
FR22: Epic 8 - UUID generation (new tool)
FR23: Epic 8 - Password generation (new tool)
FR24: Epic 8 - Hash generation (new tool)
FR25: Epic 9 - CSS box-shadow visual generator (new tool)
FR26: Epic 1 - Central dashboard browsing (tool registry + dashboard)
FR27: Epic 1 - Direct URL navigation per tool (hybrid routing)
FR28: Epic 1 - Search/filter tools by name or category (command palette + sidebar)
FR29: Epic 1 - Mobile access at 375px with touch-friendly layout (responsive sidebar)
FR30: Epic 3 - Dashboard drag-and-drop customization (existing feature baseline)
FR31: Epic 3 - Persistent layout preferences (existing feature baseline)
~~FR32: Epic 1 - Light/dark theme toggle (theme system)~~ — **NOT PLANNED**
FR33: Epic 4 - CONTRIBUTING guide with file structure and PR checklist
FR34: Epic 4 - Local development environment setup
FR35: Epic 4 - Test validation for contributor changes
FR36: Epic 3 - Feature spec documentation per existing tool
FR37: Epic 3 - Regression test stories per existing tool
FR38: Epic 2 - Tool descriptions, placeholders, and format tooltips

## Epic List

### Epic 1: Platform Navigation & Tool Discovery
Users can discover, search, and navigate to all tools via a categorized sidebar, command palette (Cmd+K), and dedicated URLs — on any device.
**FRs covered:** FR26, FR27, FR28, FR29
**Depends on:** None — builds on existing MVP foundation

### Epic 2: Standardized Tool Experience
Users get a consistent, self-explanatory, accessible tool interface with instant feedback, clear error handling, and one-click output capture across every tool.
**FRs covered:** FR1, FR2, FR3, FR4, FR38
**Depends on:** Epic 1 (TOOL_REGISTRY for tool metadata and descriptions)

### Epic 3: Existing Tool Baseline & Enhancement
Users get documented, regression-tested, and enhanced versions of all 6 existing tools — refactored to the standardized layout with improved UX.
**FRs covered:** FR5, FR6, FR7, FR8, FR11, FR12, FR15, FR16, FR30, FR31, FR36, FR37
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Epic 4: Quality Infrastructure & Contributor Experience
Contributors can add new tools following clear documented patterns, with automated CI/CD quality gates protecting the codebase.
**FRs covered:** FR33, FR34, FR35
**Depends on:** Epic 1 (TOOL_REGISTRY for contributor workflow documentation)

### Epic 5: Encoding & Decoding Tools
Users can encode/decode URLs and decode JWT tokens to inspect headers and payloads.
**FRs covered:** FR9, FR10
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Epic 6: Data & Format Tools
Users can format/validate JSON and convert between JSON, YAML, and CSV formats.
**FRs covered:** FR17, FR18, FR19
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Epic 7: Text Analysis Tools
Users can compare text side-by-side to spot differences and test regex patterns with live match highlighting.
**FRs covered:** FR20, FR21
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Epic 8: Generator Tools
Users can generate UUIDs, secure passwords, and cryptographic hash values.
**FRs covered:** FR22, FR23, FR24
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Epic 9: CSS Visual Tools
Users can visually create CSS box-shadow values with a live preview and copy the CSS output.
**FRs covered:** FR25
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Epic 10: Advanced Image Tools
Users can compress images with quality control and crop images using freeform or preset aspect ratios.
**FRs covered:** FR13, FR14
**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay). Recommended after Epic 3 Stories 3.3/3.4 (Image tool baseline)

---

## Epic 1: Platform Navigation & Tool Discovery

Users can discover, search, and navigate to all tools via a categorized sidebar, command palette (Cmd+K), and dedicated URLs — on any device.

**Depends on:** None — builds on existing MVP foundation

### Story 1.1: Centralized Tool Registry

As a **user**,
I want **all tools organized through a single registry that powers the dashboard**,
So that **I can browse a consistent, up-to-date tool catalog from the central dashboard**.

**Acceptance Criteria:**

**Given** the application source code
**When** a developer inspects `src/constants/tool-registry.ts`
**Then** a `TOOL_REGISTRY` array exists containing entries for all 6 existing tools (Color Converter, Base64 Encoder, Image Converter, Image Resizer, Unix Timestamp, PX to REM)
**And** each entry includes: `key` (kebab-case), `name`, `category`, `emoji`, `description`, `seo` (title + description), `routePath`, and `component` (lazy import)

**Given** the home page dashboard
**When** the page renders
**Then** tool cards are generated from `TOOL_REGISTRY` instead of manual `FEATURE_TITLE` constants and hardcoded lazy imports
**And** existing drag-and-drop layout and persistent preferences continue to work unchanged

**Given** a `ToolRegistryEntry` type defined in `src/types/constants/tool-registry.ts`
**When** a registry entry is created
**Then** TypeScript enforces all required fields are present with correct types

**Given** the existing 6 tools
**When** the registry is consumed by the dashboard
**Then** all 6 tools render and function identically to the pre-registry behavior (no regression)

### Story 1.2: Dedicated Tool Routes & SEO

As a **user**,
I want **to navigate directly to any tool via a unique URL and find tools through search engines**,
So that **I can bookmark specific tools and discover them via Google**.

**Acceptance Criteria:**

**Given** the `TOOL_REGISTRY` exists
**When** the router configuration is loaded
**Then** each tool has a dedicated route at `/tools/{tool-key}` generated from the registry
**And** each route lazy-loads only that tool's component chunk

**Given** a user navigates to `/tools/color-converter`
**When** the page renders
**Then** the Color Converter tool is displayed in full-page mode via `ToolLayout`
**And** the page has a unique `<title>` tag: "Color Converter - CSR Dev Tools"
**And** the page has a unique `<meta name="description">` tag
**And** the page has Open Graph tags (`og:title`, `og:description`)

**Given** a build-time pre-rendering plugin is configured in `vite.config.ts`
**When** `pnpm build` runs
**Then** static HTML is generated for each tool route with correct meta tags embedded
**And** search engine crawlers receive fully-rendered HTML with SEO metadata

**Given** a user is on a dedicated tool page
**When** they use the browser back button
**Then** they return to their previous page with scroll position restored

### Story 1.3: Sidebar Navigation System

As a **user**,
I want **a collapsible sidebar showing all tools grouped by category**,
So that **I can quickly browse and navigate to any tool without scrolling the dashboard**.

**Acceptance Criteria:**

**Given** the user is on the dashboard
**When** they click the hamburger icon in the header
**Then** the sidebar slides in from the left (300ms ease-out animation via Motion)
**And** on desktop, the sidebar takes ~240-280px and pushes the dashboard content to the right
**And** on mobile (< 768px), the sidebar opens as a full-screen overlay with dark backdrop

**Given** the sidebar is open
**When** the user views the sidebar content
**Then** tools are grouped by category (Color, Encoding, Image, Time, Unit, Data, Generator, CSS, Text)
**And** each category header shows a tool count badge (`CategoryBadge`)
**And** each category is expandable/collapsible with a chevron icon
**And** all categories default to expanded on first load

**Given** the sidebar is open
**When** the user clicks a tool name (`SidebarToolItem`)
**Then** the dashboard scrolls to that tool's card with a brief highlight pulse (500ms, `--color-primary` border)
**And** on mobile, the sidebar closes automatically after selection

**Given** the sidebar is open
**When** the user presses `Escape` or clicks outside the sidebar (mobile) or clicks the X/hamburger toggle
**Then** the sidebar closes with a slide-out animation

**Given** the sidebar is open on mobile
**When** focus is inside the sidebar
**Then** focus is trapped within the sidebar (cannot tab to elements behind the overlay)
**And** the sidebar has `nav` landmark with `aria-label="Tool navigation"`

**Given** a `useSidebarStore` Zustand store in `src/hooks/state/`
**When** the sidebar state changes
**Then** `isOpen`, `open`, `close`, and `toggle` actions are available following the existing Zustand store pattern

### Story 1.4: Command Palette Search

As a **user**,
I want **to press Cmd+K to open a search overlay and instantly jump to any tool by name**,
So that **I can navigate to tools with keyboard speed without browsing the sidebar or scrolling the dashboard**.

**Acceptance Criteria:**

**Given** the user is anywhere in the app
**When** they press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
**Then** the Command Palette opens as a centered modal with backdrop blur
**And** the search input is auto-focused

**Given** the Command Palette is open
**When** the user types a partial tool name (e.g., "col")
**Then** results are filtered in real-time using fuzzy matching against tool names from `TOOL_REGISTRY`
**And** each result shows: tool emoji + tool name + category tag

**Given** the Command Palette shows filtered results
**When** the user presses `↑`/`↓` arrow keys
**Then** the highlighted result changes accordingly
**And** when the user presses `Enter`
**Then** the palette closes and the dashboard scrolls to the selected tool with a highlight pulse

**Given** the Command Palette is open
**When** the user presses `Escape` or clicks outside the modal
**Then** the palette closes and focus returns to the previously focused element

**Given** a `useCommandPaletteStore` Zustand store and `useKeyboardShortcuts` hook
**When** the Command Palette state changes
**Then** `isOpen`, `open`, `close`, and `toggle` actions are available
**And** the keyboard shortcut is registered centrally via `useKeyboardShortcuts`

**Given** the Command Palette modal
**When** a screen reader encounters it
**Then** it has `role="dialog"`, `aria-modal="true"`, `aria-label="Search tools"`
**And** the search input has `role="combobox"` with `aria-autocomplete="list"`

### ~~Story 1.5: Theme Toggle~~ — NOT PLANNED

> **Decision:** Dark-only theme. The space/universe visual identity is inherently dark. No light theme variant will be implemented. FR32 is dropped.

### Story 1.6: Design System Foundation — Apply UX Direction

As a **user**,
I want **the application's visual identity to reflect the approved Space/Universe design direction**,
So that **every component and tool renders with the cohesive cosmic theme defined in the UX Design Specification**.

**Acceptance Criteria:**

**Given** `src/index.css` with existing `@theme` design tokens
**When** the tokens are updated
**Then** the primary brand color is `oklch(0.55 0.22 310)` (cosmic magenta-purple)
**And** the secondary brand color is `oklch(0.65 0.12 260)` (nebula blue-violet)
**And** the full neutral scale uses cool space-blue tinted grays (hue 270, low chroma 0.008) matching the UX spec values exactly

**Given** the semantic color tokens
**When** they are updated
**Then** info is `oklch(0.6 0.15 240)`, warning is `oklch(0.75 0.15 85)`, success is `oklch(0.65 0.18 165)`, error is `oklch(0.6 0.2 15)`

**Given** the background gradient
**When** it is updated
**Then** it uses the 6-stop gradient from the UX spec: void black → midnight blue → deep space purple → nebula purple → distant nebula magenta → nebula edge glow

**Given** `index.html` font loading
**When** the font reference is updated
**Then** Space Mono is loaded from Google Fonts (regular 400, bold 700, italic variants)
**And** the `@theme` font-family token references `'Space Mono', monospace`
**And** Google Sans Code references are removed

**Given** the shadow scale tokens
**When** they are updated
**Then** the 4-step scale (`--shadow-sm` through `--shadow-xl`) matches the UX spec's crisper, tighter shadow values

**Given** the border radius tokens
**When** they are defined
**Then** `--radius-sm` is `4px` (small elements) and `--radius-card` is `6px` (cards/containers) per the 32-bit subtle influence

**Given** all token updates are applied
**When** the existing 6 tools and dashboard render
**Then** there are no visual regressions in layout or functionality — only the color palette, typography, and shadows change
**And** all text meets WCAG 2.1 AA contrast minimums (4.5:1 body text, 3:1 large text) against the updated backgrounds

**Dependencies:** None — this is a foundational story. Stories 2.1 (ToolLayout) and 2.2 (CopyButton/OutputDisplay) depend on these tokens being in place.

**Scope note:** This story covers design *tokens* only — the CSS custom properties and font. Dark theme only (no light variant). Component-level styling is Epic 2.

---

## Epic 2: Standardized Tool Experience

Users get a consistent, self-explanatory, accessible tool interface with instant feedback, clear error handling, and one-click output capture across every tool.

**Depends on:** Epic 1 (TOOL_REGISTRY for tool metadata and descriptions)

### Story 2.1: ToolLayout Component

As a **user**,
I want **every tool to follow the same spatial layout pattern**,
So that **I can immediately understand any tool's interface without re-learning where inputs, outputs, and actions are**.

**Acceptance Criteria:**

**Given** a `ToolLayout` component in `src/components/common/tool-layout/`
**When** a tool component uses `ToolLayout` as its wrapper
**Then** it renders in a consistent structure: tool header (title + one-line description) → input region → output region → action bar

**Given** a tool is rendered in card mode (dashboard)
**When** the `mode` variant is `"card"`
**Then** the tool renders in a compact layout suitable for the dashboard grid

**Given** a tool is rendered in page mode (dedicated route)
**When** the `mode` variant is `"page"`
**Then** the tool renders in a full-page layout with expanded workspace

**Given** a tool is viewed on mobile (< 768px)
**When** the viewport is narrow
**Then** the ToolLayout stacks regions vertically: input → output → actions
**And** all tap targets are at least 44x44px

**Given** the `ToolLayout` component
**When** a screen reader encounters it
**Then** it renders as a `<section>` with `aria-label` matching the tool name
**And** tab order follows the logical flow: input → output → actions

**Given** `ToolLayout` types defined in `src/types/components/common/tool-layout.ts`
**When** a developer creates a new tool
**Then** TypeScript enforces required props: `title`, `description`, `error` (from `useToolError`), `mode`, and `children`

### Story 2.2: CopyButton & OutputDisplay Components

As a **user**,
I want **to copy any tool output with a single click and see results in a clean, formatted display**,
So that **I can quickly capture outputs and paste them directly into my code**.

**Acceptance Criteria:**

**Given** a `CopyButton` component in `src/components/common/button/`
**When** the user clicks it
**Then** the associated value is copied to the clipboard
**And** the icon morphs from clipboard to check mark (300ms transition)
**And** a toast appears: "Copied to clipboard" (auto-dismiss 2.5s)
**And** the icon reverts to clipboard after 2 seconds

**Given** `CopyButton` has two variants
**When** rendered as `icon-only`
**Then** it shows only the icon (compact, for inline use next to output values)
**When** rendered as `labeled`
**Then** it shows icon + "Copy" text (for action bars)

**Given** `CopyButton` with nothing to copy
**When** the output value is empty
**Then** the button is disabled

**Given** an `OutputDisplay` component in `src/components/common/output/`
**When** it receives a value
**Then** it renders the formatted result with an adjacent `CopyButton`

**Given** `OutputDisplay` has three variants
**When** variant is `single` — it shows one copyable value (e.g., "rgb(59, 130, 246)")
**When** variant is `table` — it shows multiple key-value pairs each with their own `CopyButton`
**When** variant is `code` — it shows a monospace code block with syntax-appropriate formatting

**Given** the output value changes
**When** a new value is computed
**Then** the `OutputDisplay` shows a brief highlight flash (200ms background pulse via Motion)
**And** screen readers are notified via `aria-live="polite"`

### Story 2.3: Error Handling System

As a **user**,
I want **clear, inline error feedback when I enter invalid input — and never a modal or blocking dialog**,
So that **I can quickly correct my input and continue working without disruption**.

**Acceptance Criteria:**

**Given** a `useToolError` hook in `src/hooks/`
**When** a tool component calls `useToolError()`
**Then** it receives `error` (string | null), `setError(message)`, and `clearError()` functions

**Given** a tool has an error state set via `setError`
**When** `ToolLayout` renders
**Then** the error message appears inline below the relevant input, styled with `--color-error`
**And** the message is concise, actionable, and includes an example of valid input (e.g., "Enter a valid hex color (e.g., #3B82F6)")

**Given** a tool has an active error
**When** the user corrects the input to a valid value
**Then** `clearError()` is called automatically and the error message disappears

**Given** a `ToolErrorBoundary` component in `src/components/common/error-boundary/`
**When** an unexpected JavaScript error occurs within a tool
**Then** the error boundary catches it and displays "Something went wrong" with a Reset button
**And** the error does not crash the entire application — only the affected tool

**Given** the error handling system
**When** an error message is displayed
**Then** it is never a modal dialog, never an alert box, and never a blocking overlay

### Story 2.4: Input Validation Utilities

As a **developer**,
I want **shared validation functions for common input formats**,
So that **I can validate user input consistently across all tools without duplicating logic**.

**Acceptance Criteria:**

**Given** `src/utils/validation.ts`
**When** a developer imports validation functions
**Then** the following validators are available: `isValidHex`, `isValidRgb`, `isValidHsl`, `isValidBase64`, `isValidUrl`, `isValidJson`, `isValidJwt`, `isValidUuid`, `isValidTimestamp`
**And** each returns a `boolean`

**Given** a validation function
**When** called with valid input
**Then** it returns `true`
**When** called with invalid input
**Then** it returns `false`
**And** it never throws an exception

**Given** `src/utils/validation.spec.ts`
**When** tests are run via `pnpm test`
**Then** all validation functions have test coverage for valid inputs, invalid inputs, and edge cases (empty string, null-like values, boundary values)

**Given** corresponding types in `src/types/utils/validation.ts`
**When** TypeScript compiles
**Then** all validator function signatures are properly typed

### Story 2.5: Tool Descriptions, Placeholders & Tooltips

As a **user**,
I want **every tool to show a one-line description and have input fields with clear placeholder text explaining accepted formats**,
So that **I can use any tool instantly without reading documentation**.

**Acceptance Criteria:**

**Given** any tool rendered via `ToolLayout`
**When** the tool header displays
**Then** a one-line description is shown below the tool title (sourced from `TOOL_REGISTRY` description field)

**Given** any text input field in a tool
**When** the field is empty
**Then** placeholder text shows the expected format (e.g., `#3B82F6` for hex input, `1700000000` for timestamp, `SGVsbG8=` for Base64)

**Given** any input field in a tool
**When** the field has a visible label via `FieldForm` wrapper
**Then** the label clearly describes what input is expected
**And** labels are always visible above the input — never placeholder-only labels

**Given** any select dropdown in a tool
**When** it renders
**Then** it has a sensible default pre-selected (most common option first)
**And** there is no empty "Choose an option" placeholder state

---

## Epic 3: Existing Tool Baseline & Enhancement

Users get documented, regression-tested, and enhanced versions of all 6 existing tools — refactored to the standardized layout with improved UX.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Story 3.1: Color Converter — Refactor, Spec & Tests

As a **user**,
I want **the Color Converter tool to use the standardized layout with documented behavior and regression tests**,
So that **I can rely on consistent, tested color conversion between HEX, RGB, and HSL formats**.

**Acceptance Criteria:**

**Given** the existing `ColorConvertor` component
**When** it is refactored
**Then** it uses `ToolLayout` wrapper, `useToolError` for error handling, and `CopyButton`/`OutputDisplay` for output
**And** it is registered in `TOOL_REGISTRY` with complete metadata

**Given** a user inputs a valid HEX value (e.g., `#3B82F6`)
**When** the value is entered
**Then** RGB and HSL conversions appear in real-time (debounced 300ms) in the output region
**And** each output value has an adjacent `CopyButton`

**Given** a user inputs a color via the visual color picker
**When** a color is selected
**Then** all format outputs (HEX, RGB, HSL) update immediately

**Given** a user inputs an invalid color value
**When** validation fails
**Then** an inline error appears: "Enter a valid hex color (e.g., #3B82F6)"

**Given** a feature spec document
**When** a developer reads it
**Then** it covers: supported input formats (HEX 3/6/8-digit, RGB, HSL), output formats, edge cases (with/without #, shorthand hex, out-of-range values), and expected behavior

**Given** regression test stories in `src/utils/color.spec.ts`
**When** `pnpm test` runs
**Then** all happy paths, edge cases, and error states pass

### Story 3.2: Base64 Encoder — Refactor, Spec & Tests

As a **user**,
I want **the Base64 tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably encode and decode Base64 strings with a consistent interface**.

**Acceptance Criteria:**

**Given** the existing `EncodingBase64` component
**When** it is refactored
**Then** it uses `ToolLayout`, `useToolError`, `CopyButton`/`OutputDisplay`
**And** it is registered in `TOOL_REGISTRY`

**Given** a user pastes text into the encode input
**When** the value is entered
**Then** the Base64-encoded output appears in real-time (debounced 300ms)

**Given** a user pastes a Base64 string into the decode input
**When** the value is entered
**Then** the decoded plaintext appears in real-time

**Given** a user pastes an invalid Base64 string for decoding
**When** validation fails
**Then** an inline error appears: "Enter a valid Base64 string (e.g., SGVsbG8=)"

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: standard encoding, Unicode handling, empty input, whitespace handling, invalid decode input, and large string performance

### Story 3.3: Image Converter — Refactor, Spec & Tests

As a **user**,
I want **the Image Converter tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert images between formats with a consistent interface**.

**Acceptance Criteria:**

**Given** the existing `ImageConvertor` component
**When** it is refactored
**Then** it uses `ToolLayout`, `useToolError`, `OutputDisplay`, and standardized file upload zone
**And** it is registered in `TOOL_REGISTRY`

**Given** a user uploads an image file
**When** the file is loaded
**Then** the filename and dimensions are displayed
**And** a format selection dropdown offers: PNG, JPG, WebP, GIF, BMP, AVIF (where browser-supported)

**Given** a user selects a target format and clicks "Convert"
**When** processing completes
**Then** the converted image is available for download
**And** a `ProgressBar` appears only if processing exceeds 300ms
**And** a toast confirms: "Downloaded {filename}"

**Given** a user uploads an unsupported file type
**When** validation fails
**Then** an inline error appears with accepted formats listed

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: supported format conversions, large file handling (up to 10MB), invalid file types, and mobile upload behavior

### Story 3.4: Image Resizer — Refactor, Spec & Tests

As a **user**,
I want **the Image Resizer tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably resize images with custom dimensions and a consistent interface**.

**Acceptance Criteria:**

**Given** the existing `ImageResizer` component
**When** it is refactored
**Then** it uses `ToolLayout`, `useToolError`, and standardized file upload zone
**And** it is registered in `TOOL_REGISTRY`

**Given** a user uploads an image
**When** the file is loaded
**Then** current dimensions (width x height) are displayed
**And** width and height input fields are pre-filled with current dimensions

**Given** a user enters target dimensions and clicks "Resize"
**When** processing completes
**Then** the resized image is available for download with filename format `resized-image.{ext}`
**And** a `ProgressBar` appears only if processing exceeds 300ms

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: upscale, downscale, aspect ratio behavior, large file handling, minimum dimensions, and mobile upload behavior

### Story 3.5: Unix Timestamp Converter — Refactor, Spec & Tests

As a **user**,
I want **the Unix Timestamp tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert between timestamps and human-readable dates with a consistent interface**.

**Acceptance Criteria:**

**Given** the existing `TimeUnixTimestamp` component
**When** it is refactored
**Then** it uses `ToolLayout`, `useToolError`, `CopyButton`/`OutputDisplay`
**And** it is registered in `TOOL_REGISTRY`

**Given** a user enters a Unix timestamp (e.g., `1700000000`)
**When** the value is entered
**Then** the human-readable date/time appears in real-time (debounced 300ms)

**Given** a user enters a human-readable date
**When** the value is entered
**Then** the corresponding Unix timestamp appears in real-time

**Given** an invalid timestamp input
**When** validation fails
**Then** an inline error appears: "Enter a valid Unix timestamp (e.g., 1700000000)"

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: seconds vs milliseconds, negative timestamps (pre-1970), current time, date-to-timestamp, edge cases (epoch 0, far future)

### Story 3.6: PX to REM Converter — Refactor, Spec & Tests

As a **user**,
I want **the PX to REM tool to use the standardized layout with documented behavior and regression tests**,
So that **I can reliably convert between PX and REM units with a consistent interface**.

**Acceptance Criteria:**

**Given** the existing `UnitPxToRem` component
**When** it is refactored
**Then** it uses `ToolLayout`, `useToolError`, `CopyButton`/`OutputDisplay`
**And** it is registered in `TOOL_REGISTRY`

**Given** a user enters a PX value
**When** the value is entered
**Then** the REM equivalent appears in real-time (debounced 300ms)
**And** a configurable base font size (default 16px) is available

**Given** a user changes the base font size
**When** the base is adjusted
**Then** all conversions update immediately to reflect the new base

**Given** a feature spec and regression tests
**When** tests run
**Then** coverage includes: standard conversion (16px = 1rem), custom base sizes, decimal values, zero, negative values, and large values

### Story 3.7: Dashboard Layout Persistence Baseline

As a **user**,
I want **my dashboard tool card arrangement to persist and work reliably with the new registry-based system**,
So that **my personalized layout is preserved across sessions after the registry migration**.

**Acceptance Criteria:**

**Given** the existing `usePersistFeatureLayout` hook
**When** the dashboard renders tools from `TOOL_REGISTRY`
**Then** drag-and-drop card reordering continues to function
**And** layout preferences persist across browser sessions via localStorage

**Given** a user with an existing saved layout (pre-registry)
**When** they load the app after the registry migration
**Then** their layout preferences are preserved or gracefully migrated
**And** no layout data is lost

**Given** new tools are added to `TOOL_REGISTRY` in the future
**When** the dashboard loads
**Then** new tools appear in the grid without disrupting the user's existing arrangement

---

## Epic 4: Quality Infrastructure & Contributor Experience

Contributors can add new tools following clear documented patterns, with automated CI/CD quality gates protecting the codebase.

**Depends on:** Epic 1 (TOOL_REGISTRY for contributor workflow documentation)

### Story 4.1: E2E Test Infrastructure

As a **contributor**,
I want **a Playwright E2E test setup with helper utilities**,
So that **I can write browser-level tests that validate tool behavior in a real browser environment**.

**Acceptance Criteria:**

**Given** `playwright.config.ts` at the project root
**When** a developer runs the E2E test command
**Then** Playwright launches a browser and executes tests against the local dev server

**Given** the `e2e/` directory structure
**When** a developer inspects it
**Then** it contains: `helpers/selectors.ts` (shared test selectors), `helpers/fixtures.ts` (shared test data), and at least one example tool E2E test

**Given** `e2e/helpers/selectors.ts`
**When** imported by a test
**Then** it provides reusable selectors for common elements (tool inputs, outputs, copy buttons, toast notifications)

**Given** the E2E test infrastructure
**When** a contributor writes a new tool E2E test
**Then** they follow the pattern: one file per tool as `e2e/{tool-key}.spec.ts`

### Story 4.2: CI/CD Pipeline

As a **contributor**,
I want **automated quality gates that run on every pull request**,
So that **I get immediate feedback on code quality and can't accidentally merge broken code**.

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml`
**When** a pull request is opened or updated
**Then** the pipeline runs in sequence: lint (`pnpm lint`) → format check (`pnpm format:check`) → unit tests (`pnpm test`) → build (`pnpm build`)

**Given** any pipeline step fails
**When** the PR status is checked
**Then** the PR is blocked from merging with a clear failure indicator and log output

**Given** all pipeline steps pass
**When** the PR status is checked
**Then** the PR shows a green success status

**Given** the pipeline configuration
**When** a developer inspects it
**Then** it uses `pnpm` for package management and caches `node_modules` for faster runs

### Story 4.3: Lighthouse CI Integration

As a **contributor**,
I want **automated Lighthouse scores checked on every PR**,
So that **performance, accessibility, and SEO regressions are caught before merging**.

**Acceptance Criteria:**

**Given** `.github/workflows/lighthouse.yml` and `lighthouserc.js`
**When** a PR is opened or updated
**Then** Lighthouse CI runs against the built site

**Given** Lighthouse CI results
**When** scores are computed
**Then** the PR fails if Performance < 90, Accessibility < 90, or SEO < 90

**Given** Lighthouse CI results
**When** scores pass thresholds
**Then** the scores are visible in the PR status checks

### Story 4.4: CONTRIBUTING Guide & Developer Documentation

As a **contributor**,
I want **a clear guide explaining how to add a new tool step-by-step**,
So that **I can contribute a tool without needing to ask the maintainer for help**.

**Acceptance Criteria:**

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

**Given** the CONTRIBUTING guide
**When** a contributor follows it end-to-end
**Then** the new tool appears in the dashboard selection dialog, has a dedicated route, shows in the sidebar and command palette, and passes all quality gates

**Given** the CONTRIBUTING guide
**When** it references code patterns
**Then** it includes a PR checklist: registry entry added, ToolLayout used, useToolError used, unit tests written, E2E test written, all existing tests pass

---

## Epic 5: Encoding & Decoding Tools

Users can encode/decode URLs and decode JWT tokens to inspect headers and payloads.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Story 5.1: URL Encoder/Decoder

As a **user**,
I want **to encode and decode URL strings in the browser**,
So that **I can quickly prepare or inspect URL-encoded values for web development**.

**Acceptance Criteria:**

**Given** the URL Encoder/Decoder tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with encode and decode modes (tabs or toggle)

**Given** a user pastes a plain string into the encode input (e.g., `hello world&foo=bar`)
**When** the value is entered
**Then** the URL-encoded output appears in real-time (debounced 300ms): `hello%20world%26foo%3Dbar`
**And** a `CopyButton` is adjacent to the output

**Given** a user pastes a URL-encoded string into the decode input
**When** the value is entered
**Then** the decoded plaintext appears in real-time

**Given** an invalid encoded string (e.g., `%ZZ`)
**When** decoding fails
**Then** an inline error appears: "Enter a valid URL-encoded string (e.g., hello%20world)"

**Given** the tool component
**When** it is implemented
**Then** it uses `useToolError`, shared validation (`isValidUrl`), and all processing is 100% client-side
**And** unit tests cover: standard encoding, special characters, Unicode, empty input, already-encoded input, and double-encoding edge cases

### Story 5.2: JWT Decoder

As a **user**,
I want **to paste a JWT token and see the decoded header and payload**,
So that **I can quickly inspect token contents for debugging without using an external service**.

**Acceptance Criteria:**

**Given** the JWT Decoder tool registered in `TOOL_REGISTRY` under the Encoding category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a single text input for the JWT token

**Given** a user pastes a valid JWT token (3 Base64URL-encoded segments separated by dots)
**When** the value is entered
**Then** the decoded header and payload are displayed as formatted JSON in separate `OutputDisplay` sections (variant: `code`)
**And** each section has a `CopyButton`
**And** the signature section is shown but noted as "not verified" (client-side only, no secret)

**Given** the decoded payload contains standard claims
**When** the output renders
**Then** `exp` (expiration) and `iat` (issued at) timestamps are shown with human-readable date equivalents alongside the raw values

**Given** a user pastes an invalid JWT (wrong format, not 3 segments, invalid Base64URL)
**When** validation fails
**Then** an inline error appears: "Enter a valid JWT token (e.g., eyJhbG...)"

**Given** the tool implementation
**When** it processes a token
**Then** zero network requests are made — decoding is entirely client-side (Base64URL decode, JSON parse)
**And** unit tests cover: valid tokens, expired tokens, tokens with various claims, invalid formats, and malformed segments

---

## Epic 6: Data & Format Tools

Users can format/validate JSON and convert between JSON, YAML, and CSV formats.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Story 6.1: JSON Formatter/Validator

As a **user**,
I want **to paste JSON and see it formatted with syntax highlighting, or get clear validation errors**,
So that **I can quickly clean up and validate JSON for my development work**.

**Acceptance Criteria:**

**Given** the JSON Formatter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a `TextAreaInput` for raw JSON and an `OutputDisplay` (variant: `code`) for formatted output

**Given** a user pastes valid JSON
**When** the value is entered
**Then** formatted, indented JSON with syntax highlighting appears in real-time (debounced 300ms)
**And** a `CopyButton` copies the formatted JSON

**Given** a user pastes invalid JSON
**When** validation fails
**Then** an inline error appears indicating the parse error location (e.g., "Invalid JSON: Unexpected token at position 42")

**Given** the formatted output
**When** the user copies it
**Then** the copied text is properly indented with 2-space indentation and no trailing whitespace

**Given** the tool implementation
**When** it processes JSON
**Then** all parsing and formatting uses native `JSON.parse` / `JSON.stringify` — no server calls
**And** unit tests cover: valid JSON (objects, arrays, nested), invalid JSON, empty input, large JSON, special characters, and Unicode

### Story 6.2: JSON to YAML Converter

As a **user**,
I want **to convert JSON to YAML and YAML to JSON**,
So that **I can quickly switch between configuration formats for different tools and platforms**.

**Acceptance Criteria:**

**Given** the JSON↔YAML Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with tabs or toggle for JSON→YAML and YAML→JSON modes

**Given** a user pastes valid JSON in JSON→YAML mode
**When** the value is entered
**Then** the YAML equivalent appears in real-time (debounced 300ms) in the output
**And** a `CopyButton` copies the YAML output

**Given** a user pastes valid YAML in YAML→JSON mode
**When** the value is entered
**Then** the JSON equivalent appears in real-time, formatted with 2-space indentation

**Given** invalid input in either mode
**When** parsing fails
**Then** an inline error appears describing the issue

**Given** the tool implementation
**When** it converts formats
**Then** a client-side YAML library is used (code-split, lazy-loaded — does not increase initial bundle)
**And** unit tests cover: simple objects, nested structures, arrays, special YAML features (anchors, multiline strings), and edge cases

### Story 6.3: JSON to CSV Converter

As a **user**,
I want **to convert JSON arrays to CSV and CSV to JSON**,
So that **I can quickly transform data between formats for spreadsheets and APIs**.

**Acceptance Criteria:**

**Given** the JSON↔CSV Converter tool registered in `TOOL_REGISTRY` under the Data category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with tabs or toggle for JSON→CSV and CSV→JSON modes

**Given** a user pastes a JSON array of objects
**When** the value is entered
**Then** a CSV output appears with headers derived from object keys
**And** a `CopyButton` and download option are available

**Given** a user pastes CSV text
**When** the value is entered
**Then** a JSON array of objects appears with keys from the CSV header row

**Given** the JSON input is not an array of flat objects
**When** conversion is attempted
**Then** an inline error explains: "JSON must be an array of objects (e.g., [{\"name\": \"Alice\"}])"

**Given** the tool implementation
**When** it processes data
**Then** CSV handling covers: quoted fields, commas within values, newlines within quoted fields, and header row detection
**And** unit tests cover: simple arrays, nested objects (flattened), empty arrays, single-row, special characters in values

---

## Epic 7: Text Analysis Tools

Users can compare text side-by-side to spot differences and test regex patterns with live match highlighting.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Story 7.1: Text Diff Checker

As a **user**,
I want **to paste two text blocks and see line-by-line differences highlighted**,
So that **I can quickly identify changes between two versions of code or text**.

**Acceptance Criteria:**

**Given** the Text Diff Checker tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with two side-by-side `TextAreaInput` fields (stacked on mobile) for "Original" and "Modified" text

**Given** a user enters text in both input fields
**When** both fields have content
**Then** a line-by-line diff is computed and displayed below the inputs
**And** added lines are highlighted in green (`--color-success` tint)
**And** removed lines are highlighted in red (`--color-error` tint)
**And** unchanged lines are shown in default styling

**Given** the diff output
**When** the user clicks "Copy Diff"
**Then** the diff output is copied to clipboard in a standard unified diff format

**Given** the tool implementation
**When** it computes diffs
**Then** it uses a proven open-source diff library (code-split, lazy-loaded)
**And** processing completes within the 500ms target for typical text sizes
**And** unit tests cover: identical texts, completely different texts, single line changes, multiline changes, empty inputs, and large texts

### Story 7.2: Regex Tester

As a **user**,
I want **to test a regular expression against sample text and see matches highlighted in real-time**,
So that **I can iterate on regex patterns quickly without switching to a terminal or external tool**.

**Acceptance Criteria:**

**Given** the Regex Tester tool registered in `TOOL_REGISTRY` under the Text category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a `TextInput` for the regex pattern, a `TextAreaInput` for the test string, and an output region for highlighted matches

**Given** a user enters a valid regex pattern and test string
**When** both fields have content
**Then** all matches are highlighted in the test string in real-time (debounced 300ms)
**And** a match count is displayed (e.g., "3 matches found")

**Given** the regex pattern input
**When** the user types
**Then** common flags are available via toggles: global (g), case-insensitive (i), multiline (m)

**Given** a user enters an invalid regex pattern
**When** the pattern cannot be compiled
**Then** an inline error appears: "Invalid regex pattern"

**Given** the match results
**When** the user views them
**Then** each match group is distinguishable (e.g., capture groups shown separately)
**And** a `CopyButton` copies all match results

**Given** the tool implementation
**When** it processes regex
**Then** it uses native JavaScript `RegExp` — no server calls
**And** unit tests cover: simple patterns, capture groups, flags, invalid patterns, no matches, Unicode, and patterns that could cause catastrophic backtracking (with timeout protection)

---

## Epic 8: Generator Tools

Users can generate UUIDs, secure passwords, and cryptographic hash values.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Story 8.1: UUID Generator

As a **user**,
I want **to generate UUIDs with a single click or in bulk**,
So that **I can quickly get unique identifiers for my development work**.

**Acceptance Criteria:**

**Given** the UUID Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a "Generate" button and an output region

**Given** the user clicks "Generate"
**When** a single UUID is requested
**Then** a valid v4 UUID is displayed in the `OutputDisplay` with a `CopyButton`

**Given** the user selects bulk generation
**When** they specify a count (e.g., 10) and click "Generate"
**Then** the requested number of UUIDs are displayed, each on its own line with individual `CopyButton`s
**And** a "Copy All" secondary button copies all UUIDs

**Given** the tool loads
**When** the page renders
**Then** one UUID is pre-generated as a smart default so the output is immediately useful

**Given** the tool implementation
**When** UUIDs are generated
**Then** it uses `crypto.randomUUID()` (Web Crypto API) — no server calls
**And** unit tests cover: UUID v4 format validation, uniqueness across bulk generation, and bulk count limits

### Story 8.2: Password Generator

As a **user**,
I want **to generate random passwords with configurable length and character types**,
So that **I can quickly create secure passwords for development and testing**.

**Acceptance Criteria:**

**Given** the Password Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with configuration options and a "Generate" button

**Given** the configuration options
**When** the user views them
**Then** they can set: length (8-128 characters via slider or input), and toggle inclusion of: uppercase letters, lowercase letters, digits, and symbols

**Given** the user clicks "Generate"
**When** a password is generated
**Then** it is displayed in `OutputDisplay` with a `CopyButton`
**And** it respects all selected configuration options

**Given** the user disables all character type toggles
**When** no character types are selected
**Then** at least one toggle remains enabled (prevent impossible state)

**Given** the tool loads
**When** the page renders
**Then** a password is pre-generated with smart defaults (16 chars, all types enabled)

**Given** the tool implementation
**When** passwords are generated
**Then** it uses `crypto.getRandomValues()` for cryptographically secure randomness — no `Math.random()`
**And** unit tests cover: length constraints, character type filtering, minimum 1 character of each enabled type, edge cases (length 8, length 128), and all-types-disabled prevention

### Story 8.3: Hash Generator

As a **user**,
I want **to generate hash values from text input using common algorithms**,
So that **I can quickly compute checksums and hashes for verification and development**.

**Acceptance Criteria:**

**Given** the Hash Generator tool registered in `TOOL_REGISTRY` under the Generator category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a `TextAreaInput` for text and algorithm selection (MD5, SHA-1, SHA-256, SHA-512)

**Given** a user enters text and selects an algorithm
**When** the input changes
**Then** the hash value is computed and displayed in real-time (debounced 300ms) in `OutputDisplay`
**And** a `CopyButton` copies the hex-encoded hash

**Given** multiple algorithms are available
**When** the user selects a different algorithm
**Then** the output updates immediately for the current input text

**Given** the tool loads with empty input
**When** no text is entered
**Then** the output shows dashes or "—" (empty state per UX pattern)

**Given** the tool implementation
**When** hashes are computed
**Then** SHA algorithms use the Web Crypto API (`crypto.subtle.digest`) — no server calls
**And** MD5 uses a lightweight client-side library (code-split, lazy-loaded)
**And** unit tests cover: known hash values for test vectors, empty input, Unicode text, large input, and all 4 algorithms

---

## Epic 9: CSS Visual Tools

Users can visually create CSS box-shadow values with a live preview and copy the CSS output.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay)

### Story 9.1: CSS Box Shadow Generator

As a **user**,
I want **to visually configure CSS box-shadow properties and see a live preview**,
So that **I can design box shadows interactively and copy the CSS code directly into my stylesheet**.

**Acceptance Criteria:**

**Given** the Box Shadow Generator tool registered in `TOOL_REGISTRY` under the CSS category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with input controls and a live preview region

**Given** the input controls
**When** the user adjusts them
**Then** the following properties are configurable: horizontal offset, vertical offset, blur radius, spread radius, color (with alpha), and inset toggle
**And** each property uses an appropriate input (sliders for numeric values, color input for color)

**Given** any input value changes
**When** the user adjusts a control
**Then** the live preview updates in real-time (debounced 300ms) showing a box with the configured shadow
**And** the CSS output string updates simultaneously (e.g., `box-shadow: 4px 4px 8px 0px rgba(0, 0, 0, 0.25)`)

**Given** the CSS output
**When** the user clicks `CopyButton`
**Then** the complete `box-shadow` CSS property value is copied to clipboard

**Given** the tool loads
**When** the page renders
**Then** a sensible default shadow is applied (e.g., `4px 4px 8px 0px rgba(0, 0, 0, 0.25)`) so the preview is immediately visible

**Given** the tool implementation
**When** it generates CSS
**Then** all processing is client-side — live DOM style manipulation for preview
**And** unit tests cover: CSS string generation for all property combinations, inset toggle, zero values, negative offsets, and color format output

---

## Epic 10: Advanced Image Tools

Users can compress images with quality control and crop images using freeform or preset aspect ratios.

**Depends on:** Epic 1 (TOOL_REGISTRY), Epic 2 (ToolLayout, useToolError, CopyButton, OutputDisplay). Recommended after Epic 3 Stories 3.3/3.4 (Image tool baseline)

### Story 10.1: Image Compression

As a **user**,
I want **to compress JPEG and WebP images using a quality slider and see the resulting file size before downloading**,
So that **I can optimize images for web use while controlling the quality-size tradeoff**.

**Acceptance Criteria:**

**Given** the Image Compression tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a file upload zone, quality slider, and output region

**Given** a user uploads a JPEG or WebP image
**When** the file is loaded
**Then** the original file size and dimensions are displayed
**And** a quality slider (1-100) is shown with a default value of 80

**Given** a user adjusts the quality slider
**When** the value changes
**Then** a compressed preview is generated
**And** the estimated output file size is displayed next to the original size (e.g., "2.4 MB → 890 KB")

**Given** the user clicks "Download"
**When** the compressed image is ready
**Then** the file downloads with filename format `compressed-{original-name}.{ext}`
**And** a `ProgressBar` appears only if compression exceeds 300ms

**Given** a user uploads a non-JPEG/WebP image
**When** an unsupported format is detected
**Then** an inline error appears: "Image compression supports JPEG and WebP formats"

**Given** the tool implementation
**When** it compresses images
**Then** it uses the Canvas API for re-encoding at the specified quality — no server calls
**And** processing completes within 3 seconds for files up to 10MB
**And** unit tests cover: JPEG compression, WebP compression, quality range validation, file size reduction verification, and unsupported format handling

### Story 10.2: Image Cropping

As a **user**,
I want **to crop images using freeform selection or common aspect ratio presets**,
So that **I can quickly trim images to exact dimensions for different use cases**.

**Acceptance Criteria:**

**Given** the Image Cropping tool registered in `TOOL_REGISTRY` under the Image category
**When** the user navigates to it
**Then** it renders via `ToolLayout` with a file upload zone, cropping canvas, aspect ratio selector, and output region

**Given** a user uploads an image
**When** the file is loaded
**Then** the image is displayed in a cropping canvas with a draggable/resizable selection region

**Given** the aspect ratio selector
**When** the user views options
**Then** presets are available: Freeform, 16:9, 4:3, 1:1, 3:2
**And** selecting a preset constrains the selection region to that ratio

**Given** the user adjusts the crop selection
**When** they drag the selection handles or reposition the selection
**Then** the cropped preview updates in real-time

**Given** the user clicks "Crop & Download"
**When** the crop is applied
**Then** the cropped image downloads with filename format `cropped-{original-name}.{ext}`
**And** a `ProgressBar` appears only if processing exceeds 300ms

**Given** the tool on mobile
**When** the viewport is narrow
**Then** the cropping canvas is touch-friendly with minimum 44x44px handles
**And** pinch-to-zoom is not intercepted by the cropping interaction

**Given** the tool implementation
**When** it crops images
**Then** it uses the Canvas API for pixel-level cropping — no server calls
**And** unit tests cover: freeform crop dimensions, preset aspect ratio enforcement, edge cases (crop to full image, crop to minimum size), and mobile touch interaction

---

## Epic 11: Technical Debt Cleanup

Address accumulated HIGH and MEDIUM priority technical debt from Epics 1-10. WCAG accessibility audit, async state guard hardening, and input validation consistency.

**Depends on:** None (all stories are independent cleanup of existing code)

### Story 11.1: WCAG Accessibility Audit & Fix

As a **user relying on assistive technology**,
I want **all 19 tools to have proper ARIA attributes on interactive controls and dynamic output regions**,
So that **I receive screen reader announcements when results change and can navigate all controls meaningfully**.

**Acceptance Criteria:**

**Given** all 19 tool components
**When** they render dynamic output
**Then** each has `aria-live="polite"` on its primary output container

**Given** icon-only interactive controls (buttons, toggles)
**When** they render
**Then** each has `aria-label` describing its purpose

**Given** tool output containers
**When** they represent distinct content regions
**Then** they have `role="region"` with an `aria-label`

**Given** error message containers
**When** they render
**Then** all 19 tools consistently use `role="alert"`

**Given** tools with existing correct ARIA attributes
**When** modifications are made
**Then** zero regressions — existing attributes are preserved

### Story 11.2: Async State Guard Hardening

As a **user interacting with tools that process input asynchronously**,
I want **all async/debounced tools to discard stale results when my input changes during processing**,
So that **I always see results that match my current input, never outdated results from a previous operation**.

**Acceptance Criteria:**

**Given** all 12 tools using `useDebounceCallback` or async processing
**When** they are audited
**Then** each is classified as: guarded (has sessionRef), needs guard (async risk without protection), or no guard needed (synchronous API)

**Given** tools classified as "needs guard"
**When** session guards are added
**Then** the `sessionRef` generation counter pattern prevents stale state updates

**Given** the Hash Generator's multi-trigger pattern
**When** verified
**Then** all race conditions (text change, algorithm change, simultaneous change) are handled correctly

**Given** all 4 image tools
**When** a new file is uploaded or input is rejected
**Then** ALL related state (source, result, metadata, error) is cleared

### Story 11.3: Input Validation Consistency

As a **user entering whitespace-only or edge-case input into text-based tools**,
I want **consistent behavior across all tools when my input is empty or whitespace-only**,
So that **I get clear, predictable feedback rather than confusing error messages or silent failures**.

**Acceptance Criteria:**

**Given** `JsonFormatter` empty-input detection
**When** the user enters whitespace-only input
**Then** it uses `val.trim().length === 0` consistent with `JsonToCsvConverter` and `JsonToYamlConverter`

**Given** encoding tools (`EncodingBase64`, `UrlEncoder`)
**When** whitespace is entered
**Then** they intentionally treat whitespace as valid input (no trim) — confirmed correct

**Given** the `ProgressBar` component
**When** imported by consumers
**Then** it is available via `@/components/common` barrel export

**Given** the `DiffChange` type
**When** imported
**Then** it is co-located in `src/types/` (not `src/utils/`)
