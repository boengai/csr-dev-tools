---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

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
FR32: Users can switch between light and dark themes
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
- Input processing patterns: text tools on input change with 150ms debounce; file tools on explicit button click; generators on explicit button click; live preview on input change with 150ms debounce
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

{{requirements_coverage_map}}

## Epic List

{{epics_list}}
