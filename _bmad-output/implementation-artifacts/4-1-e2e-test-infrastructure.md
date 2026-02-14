# Story 4.1: E2E Test Infrastructure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **contributor**,
I want **a Playwright E2E test setup with helper utilities**,
So that **I can write browser-level tests that validate tool behavior in a real browser environment**.

**Epic:** Epic 4 — Quality Infrastructure & Contributor Experience
**Dependencies:** Epic 1 (TOOL_REGISTRY — complete), Epic 3 (all tool refactors — complete)
**Story Key:** 4-1-e2e-test-infrastructure

## Acceptance Criteria

### AC1: Playwright Configuration

**Given** `playwright.config.ts` at the project root
**When** a developer runs the E2E test command
**Then** Playwright launches a browser and executes tests against the local dev server on port 5173
**And** the configuration uses the project's TypeScript setup with `@/` path alias support

### AC2: E2E Directory Structure

**Given** the `e2e/` directory structure
**When** a developer inspects it
**Then** it contains: `helpers/selectors.ts` (shared test selectors), `helpers/fixtures.ts` (shared test data), and at least one example tool E2E test

### AC3: Shared Test Selectors

**Given** `e2e/helpers/selectors.ts`
**When** imported by a test
**Then** it provides reusable selectors for common elements (tool inputs, outputs, copy buttons, toast notifications, sidebar items, command palette)

### AC4: Example Tool E2E Test

**Given** the E2E test infrastructure
**When** a contributor writes a new tool E2E test
**Then** they follow the pattern: one file per tool as `e2e/{tool-key}.spec.ts`
**And** at least one example test exists demonstrating the pattern (e.g., `e2e/color-converter.spec.ts`)

### AC5: Package Scripts

**Given** `package.json` scripts
**When** a developer runs E2E tests
**Then** `pnpm test:e2e` runs all Playwright tests
**And** `pnpm test:e2e:ui` opens the Playwright UI mode for interactive debugging
**And** `pnpm test:e2e:headed` runs tests in headed browser mode

### AC6: CI-Ready Configuration

**Given** the Playwright configuration
**When** tests run in a CI environment (detected via `CI` env var)
**Then** tests run in headless mode with no retries
**And** an HTML reporter is generated for artifact upload
**When** tests run locally
**Then** tests run with the Playwright HTML reporter and 0 retries by default

## Tasks / Subtasks

- [x] Task 1: Install Playwright and configure project (AC: #1, #5)
  - [x] 1.1 Install `@playwright/test` as a dev dependency via `pnpm add -D @playwright/test`
  - [x] 1.2 Run `pnpm exec playwright install --with-deps chromium` to install only the Chromium browser (minimize CI footprint; add Firefox/WebKit later if needed)
  - [x] 1.3 Create `playwright.config.ts` at project root with: baseURL `http://localhost:5173`, webServer launching `pnpm dev`, Chromium project, reporter config (HTML for CI, list for local)
  - [x] 1.4 Add TypeScript path alias support — create `e2e/tsconfig.json` extending root config with `@/` paths
  - [x] 1.5 Add scripts to `package.json`: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`
  - [x] 1.6 Add to `.gitignore`: `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`

- [x] Task 2: Create E2E helper utilities (AC: #2, #3)
  - [x] 2.1 Create `e2e/helpers/selectors.ts` — export selector constants for: sidebar navigation, command palette, tool inputs (TextInput, TextAreaInput, SelectInput, UploadInput), tool outputs, CopyButton, toast notifications, FieldForm labels, error messages, Card containers
  - [x] 2.2 Create `e2e/helpers/fixtures.ts` — export test data constants: valid/invalid color values, valid/invalid Base64 strings, sample image data URLs, timestamp values, px/rem conversion pairs, tool registry keys for navigation

- [x] Task 3: Write example tool E2E test (AC: #4)
  - [x] 3.1 Create `e2e/color-converter.spec.ts` — test the Color Converter tool with scenarios:
    - Navigate to `/tools/color-converter` and verify tool renders
    - Enter valid hex color → verify RGB and HSL outputs appear
    - Enter invalid hex → verify error message appears
    - Click CopyButton → verify clipboard interaction (or toast appears)
    - Verify tool title and description render from registry
  - [x] 3.2 Create `e2e/home.spec.ts` — test dashboard basics:
    - Navigate to `/` → verify 6 tool cards render
    - Click sidebar toggle → verify sidebar opens
    - Verify command palette opens on Cmd+K

- [x] Task 4: Verify E2E tests run successfully (AC: #1, #5, #6)
  - [x] 4.1 Run `pnpm test:e2e` — all tests pass against dev server
  - [x] 4.2 Run `pnpm test:e2e:ui` — Playwright UI mode opens successfully
  - [x] 4.3 Run existing checks: `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test` — no regressions

## Dev Notes

### CRITICAL: Playwright Setup for This Project

This is a **greenfield E2E infrastructure** story — no Playwright exists in the project yet. The project currently has 299 passing unit tests (Vitest, node env) but zero E2E tests. The architecture mandates a two-level testing strategy: unit tests for logic + E2E tests for user journeys.

#### Key Project Constraints for E2E Setup

1. **pnpm only** — Never use `npm` or `npx`. Use `pnpm add -D` for installation and `pnpm exec playwright` for CLI commands.
2. **ESM only** — `"type": "module"` in package.json. Playwright config must use ESM syntax (`import`/`export`).
3. **TypeScript strict mode** — Config file should be `.ts` not `.js`.
4. **Dev server port 5173** — Vite dev server runs on this port. Playwright's `webServer` should launch `pnpm dev` and wait for this port.
5. **No data-testid attributes exist** — The codebase currently has zero `data-testid` attributes. E2E tests should use accessible selectors first (role, label, text content), falling back to CSS selectors matching the component structure. DO NOT add `data-testid` attributes to existing components in this story — that's a separate concern.
6. **Radix UI components** — Sidebar, command palette, dialogs, tabs, toasts all use Radix UI primitives which render with specific `data-state` attributes and ARIA roles. Playwright selectors should leverage these.

#### Playwright Configuration Specifics

```typescript
// playwright.config.ts — Key decisions:
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Why Chromium-only initially:**
- Minimizes CI time and disk space (Chromium ~400MB vs all browsers ~1.5GB)
- This story is infrastructure setup — browser matrix expansion is a follow-up if needed
- The architecture doc lists "E2E tests (Playwright)" without mandating multi-browser

#### Selector Strategy (NO data-testid)

Since the codebase has zero `data-testid` attributes, use this selector priority:

1. **ARIA roles** — `page.getByRole('button', { name: 'Copy' })`, `page.getByRole('textbox')`, `page.getByRole('navigation')`
2. **Labels** — `page.getByLabel('Hex Color')`, `page.getByLabel('Base Font Size')`
3. **Text content** — `page.getByText('Color Converter')`, `page.getByText('Copied to clipboard')`
4. **Placeholder** — `page.getByPlaceholder('#3B82F6')`
5. **CSS selectors (last resort)** — `page.locator('.toast-container')`, `page.locator('[data-state="open"]')`

The `e2e/helpers/selectors.ts` file should export **factory functions** that return Playwright locators, not raw strings. This keeps selectors type-safe and refactorable.

#### E2E Test File Pattern

```typescript
// e2e/{tool-key}.spec.ts
import { expect, test } from '@playwright/test'

test.describe('Color Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/color-converter')
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /color converter/i })).toBeVisible()
  })

  test('converts hex to RGB and HSL', async ({ page }) => {
    await page.getByPlaceholder('#3B82F6').fill('#3B82F6')
    // ... verify outputs
  })
})
```

### CRITICAL: E2E TypeScript Configuration

Create a separate `e2e/tsconfig.json` so Playwright tests don't interfere with the app build:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "baseUrl": "..",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["./**/*.ts"]
}
```

**Important:** The `e2e/` directory is NOT included in `tsconfig.app.json`'s `include` array (it only includes `src`), so no conflicts. But the Playwright tests may not need `@/` imports at all — they're black-box tests against the running app, not importing source code.

### CRITICAL: Package.json Script Additions

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed"
}
```

**Note:** `pnpm exec` is implicit when running scripts defined in `package.json`. The `playwright` binary from `@playwright/test` is available in the local `node_modules/.bin/`.

### CRITICAL: Gitignore Additions

Playwright generates artifacts that must NOT be committed:

```
# Playwright
test-results/
playwright-report/
blob-report/
playwright/.cache/
```

**Note:** A `test-results/` directory already exists at the project root (likely from a previous aborted setup). Ensure it's in `.gitignore`.

### Architecture Compliance

- **No ToolLayout modifications** — This story does not modify any tool components
- **No new source components** — All new files go in `e2e/` directory (outside `src/`)
- **Only `playwright.config.ts` at root** — Single new root file, matching architecture doc specification
- **Named exports** — All E2E helper modules use named exports [Source: project-context.md#Anti-Patterns]
- **`type` not `interface`** — Any TypeScript types in E2E helpers use `type` keyword [Source: project-context.md#Language-Specific Rules]
- **`Array<T>` not `T[]`** — If any arrays are typed [Source: project-context.md#Language-Specific Rules]
- **pnpm only** — All installation and execution via pnpm [Source: project-context.md#Package Management]
- **ESM only** — Config and test files use `import`/`export` [Source: project-context.md#Module System]

### Library & Framework Requirements

- **@playwright/test 1.58.x** — Latest stable version. Install with `pnpm add -D @playwright/test`
- **Chromium browser binary** — Installed via `pnpm exec playwright install --with-deps chromium`
- **No other new dependencies** — Playwright is self-contained; no additional test utilities needed
- **Zero impact on existing bundle** — `@playwright/test` is devDependency only, never imported by application code
- **Compatible with Node >= 24.5.0** — Playwright 1.58 supports Node 18+ (well within project requirement)

### File Structure Requirements

**Files to CREATE:**

```
playwright.config.ts                    — Playwright configuration (project root)
e2e/
  tsconfig.json                         — TypeScript config for E2E tests
  helpers/
    selectors.ts                        — Shared reusable selectors/locator helpers
    fixtures.ts                         — Shared test data constants
  color-converter.spec.ts               — Example tool E2E test
  home.spec.ts                          — Dashboard/navigation E2E test
```

**Files to MODIFY:**

```
package.json                            — Add test:e2e scripts, add @playwright/test devDependency
.gitignore                              — Add Playwright artifact directories
```

**Files NOT to modify:**
- `src/**/*` — No source code changes. E2E tests are black-box.
- `vite.config.ts` — Dev server config is already correct (port 5173)
- `vitest.config.ts` — Unit test config is separate, no conflicts
- `tsconfig.app.json` — Does not include `e2e/` directory, no changes needed
- Any tool components — This story is infrastructure only

### Testing Requirements

**E2E Test Coverage for this story:**

1. **Color Converter tool test** (`e2e/color-converter.spec.ts`):
   - Tool page loads at `/tools/color-converter`
   - Title and description visible
   - Hex input → RGB/HSL output conversion works
   - Invalid input shows error message
   - CopyButton interaction (toast appears)

2. **Dashboard/navigation test** (`e2e/home.spec.ts`):
   - Home page loads at `/`
   - All 6 tool cards render
   - Sidebar opens on hamburger click
   - Command palette opens on Cmd+K
   - Navigate to a tool via its dedicated route

**Verification commands:**
- `pnpm test:e2e` — All E2E tests pass
- `pnpm test` — All 299 unit tests still pass (no regressions)
- `pnpm lint` — No lint errors
- `pnpm format:check` — No format issues
- `pnpm build` — Build succeeds

### Previous Story Intelligence (Story 3-7)

From story 3-7 (Dashboard Layout Persistence Baseline):

- **299 tests passing** — 282 existing + 17 new dashboard tests
- **Build/lint/format all clean** at story 3-7 completion
- **Utility extraction pattern**: Create pure functions in `src/utils/{domain}.ts`, test co-located
- **Commit pattern**: `♻️: story 3-7` for refactor stories
- **Code review fixes applied**: Position key validation, corrupted data handling, `Object.hasOwn()` safety
- **Import ordering convention**: External → type-only → internal `@/` (alphabetical within each group)
- **No ToolLayout in use** — ToolLayout was deprecated in story 3-1; tools own their own layout
- **OutputDisplay removed** — Not needed; CopyButton remains active

### Git Intelligence

Recent commits:
```
a8150f7 ♻️: story 3-7
537bffb ♻️: story 3-6
eeca4d0 ♻️: story 3-5
247ff83 ♻️: story 3-4
dcbafc9 ♻️: story 3-3
a2a4c19 🐛: search and navigate
162e9c0 ♻️: story 3.2
b0fd290 ♻️: story 3.1
```

**Pattern**: `♻️:` prefix for refactor stories. This story is new infrastructure, so consider `🧪: story 4-1` or `✅: story 4-1` as the commit prefix.

**Epic 3 is complete** — all 7 stories done, retrospective done. Epic 4 is fresh territory (quality infrastructure).

### Latest Technical Information

**Playwright 1.58.x (February 2026):**
- Latest stable: **1.58.2** (published ~7 days ago)
- From v1.57: Playwright switched from Chromium to **Chrome for Testing** builds for both headed and headless
- New: Playwright Agents feature — LLM-guided test generation (planner, generator, healer)
- New: Token-efficient CLI mode for coding agent integration
- Requires Node.js 18+ (compatible with project's Node >= 24.5.0)
- No breaking changes affecting basic test setup
- `defineConfig` is the standard config API
- `webServer` option handles dev server lifecycle automatically

**Key Playwright APIs for this project:**
- `page.goto()` — Navigate to tool routes
- `page.getByRole()` — Primary selector strategy (Radix UI components have proper ARIA roles)
- `page.getByLabel()` — FieldForm wrapper provides labels for all tool inputs
- `page.getByText()` — For verifying output content
- `page.getByPlaceholder()` — Tools have descriptive placeholders
- `expect(locator).toBeVisible()` — Primary assertion for UI presence
- `expect(locator).toHaveText()` — Verify output values
- `page.keyboard.press('Meta+k')` — Test command palette keyboard shortcut

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — Acceptance criteria and story definition
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4] — Epic objectives: quality infrastructure and contributor experience
- [Source: _bmad-output/planning-artifacts/architecture.md#Testing: Unit + E2E] — Two-level testing strategy decision
- [Source: _bmad-output/planning-artifacts/architecture.md#E2E Test Structure] — Directory structure specification
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD: Full Quality Pipeline] — Pipeline integration requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Verification] — E2E catches tool behavior regressions
- [Source: _bmad-output/planning-artifacts/architecture.md#E2E test file naming] — `{tool-key}.spec.ts` in `e2e/`
- [Source: _bmad-output/project-context.md] — 53 project rules (pnpm, ESM, TypeScript strict, naming conventions)
- [Source: _bmad-output/project-context.md#Scripts] — Existing script patterns for package.json
- [Source: _bmad-output/implementation-artifacts/3-7-dashboard-layout-persistence-baseline.md] — Previous story: 299 tests, all clean
- [Source: src/constants/tool-registry.ts] — TOOL_REGISTRY with 6 tools, keys, and route paths
- [Source: vite.config.ts] — Dev server port 5173, prerender plugin for tool routes
- [Source: package.json] — Current dependencies, scripts, Node/pnpm versions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Clipboard permissions needed in Playwright config for CopyButton toast tests
- Command palette `getByRole('combobox')` selector too broad on home page (Radix Select comboboxes); switched to `getByPlaceholder('Search tools...')`
- `Control+k` used instead of `Meta+k` for keyboard shortcut test (headless Chromium compatibility)
- `waitForLoadState('networkidle')` needed before keyboard shortcuts on home page due to lazy-loaded tool components
- Vitest was picking up `e2e/*.spec.ts` files — added `exclude: ['e2e/**', 'node_modules/**']` to vitest.config.ts

### Completion Notes List

- Installed @playwright/test 1.58.2 with Chromium browser
- Created playwright.config.ts with baseURL localhost:5173, webServer, CI-ready reporter config, clipboard permissions
- Created e2e/tsconfig.json with @/ path alias support
- Added test:e2e, test:e2e:ui, test:e2e:headed scripts to package.json
- Added Playwright artifact directories to .gitignore
- Created e2e/helpers/selectors.ts with factory functions for sidebar, command palette, tool inputs, outputs, copy buttons, toasts, cards, error messages
- Created e2e/helpers/fixtures.ts with test data for colors, base64, timestamps, px/rem, tool registry keys/names/routes
- Created e2e/color-converter.spec.ts with 5 tests: renders title/description, hex-to-other conversion, invalid hex error, copy toast, color picker
- Created e2e/platform/home.spec.ts with 4 tests: 6 tool cards render, sidebar toggle, command palette keyboard shortcut, tool route navigation
- Added vitest.config.ts exclude for e2e/ directory to prevent Vitest/Playwright conflict
- All 9 E2E tests passing, all 299 unit tests passing, lint/format/build clean
- [Code Review] Fixed AC6: retries set to 0 (was 1 in CI), reporter set to 'html' (was 'list' locally)
- [Code Review] Moved home.spec.ts to e2e/platform/ per architecture doc structure

### File List

**New files:**
- playwright.config.ts
- e2e/tsconfig.json
- e2e/helpers/selectors.ts
- e2e/helpers/fixtures.ts
- e2e/color-converter.spec.ts
- e2e/platform/home.spec.ts

**Modified files:**
- package.json (added @playwright/test devDependency, added test:e2e scripts)
- .gitignore (added Playwright artifact directories)
- vitest.config.ts (added exclude for e2e/ directory)
- pnpm-lock.yaml (updated by pnpm add)

## Change Log

- 2026-02-14: Story 4-1 implemented — E2E test infrastructure with Playwright, helper utilities, and example tests (9 E2E tests)
- 2026-02-14: Code review fixes — AC6 compliance (retries=0, reporter=html), moved platform test to e2e/platform/ per architecture
