# Story 4.3: Lighthouse CI Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **contributor**,
I want **automated Lighthouse scores checked on every PR**,
So that **performance, accessibility, and SEO regressions are caught before merging**.

**Epic:** Epic 4 — Quality Infrastructure & Contributor Experience
**Dependencies:** Story 4-2 (CI/CD pipeline — complete)
**Story Key:** 4-3-lighthouse-ci-integration

## Acceptance Criteria

### AC1: Lighthouse CI Workflow Triggers on Pull Requests

**Given** `.github/workflows/lighthouse.yml`
**When** a pull request is opened or updated against any branch
**Then** the Lighthouse CI pipeline is triggered automatically

### AC2: Lighthouse CI Runs Against Built Site

**Given** the Lighthouse CI pipeline is triggered
**When** it executes
**Then** it builds the site (`pnpm build`) and runs Lighthouse CI against the static `dist/` output
**And** Lighthouse runs 3 times per URL for score stability
**And** the site is served as a single-page application (client-side routing supported)

### AC3: PR Fails on Score Thresholds

**Given** Lighthouse CI results
**When** scores are computed
**Then** the PR fails if Performance < 90, Accessibility < 90, or SEO < 90
**And** Best Practices < 90 produces a warning but does not fail the PR

### AC4: Scores Visible in PR Status Checks

**Given** Lighthouse CI results
**When** scores pass all thresholds
**Then** the scores are visible in the PR status checks as a green success status
**And** Lighthouse reports are uploaded as GitHub Actions artifacts for detailed inspection

### AC5: Configuration File at Project Root

**Given** `lighthouserc.cjs` at the project root
**When** a developer inspects it
**Then** it configures: `staticDistDir` pointing to `./dist`, `isSinglePageApplication: true`, `numberOfRuns: 3`, and score assertion thresholds
**And** the file uses CommonJS format (`.cjs` extension) because the project uses `"type": "module"` in `package.json`

## Tasks / Subtasks

- [x] Task 1: Create Lighthouse CI configuration file (AC: #2, #3, #5)
  - [x] 1.1 Create `lighthouserc.cjs` at project root with CommonJS `module.exports` syntax
  - [x] 1.2 Configure `ci.collect.staticDistDir` to `'./dist'`
  - [x] 1.3 Configure `ci.collect.isSinglePageApplication` to `true` (enables client-side routing fallback)
  - [x] 1.4 Configure `ci.collect.numberOfRuns` to `3` for score stability
  - [x] 1.5 Configure `ci.assert.assertions` with score thresholds:
    - `categories:performance`: `['error', { minScore: 0.9 }]`
    - `categories:accessibility`: `['error', { minScore: 0.9 }]`
    - `categories:seo`: `['error', { minScore: 0.9 }]`
    - `categories:best-practices`: `['warn', { minScore: 0.9 }]`
  - [x] 1.6 Configure `ci.upload.target` to `'temporary-public-storage'` for shareable report links

- [x] Task 2: Create Lighthouse CI workflow file (AC: #1, #2, #4)
  - [x] 2.1 Create `.github/workflows/lighthouse.yml` with trigger on `pull_request` events
  - [x] 2.2 Configure job with `ubuntu-latest` runner
  - [x] 2.3 Add checkout step: `actions/checkout@v4`
  - [x] 2.4 Add pnpm setup: `pnpm/action-setup@v4` with version 10 (MUST come before setup-node)
  - [x] 2.5 Add Node.js setup: `actions/setup-node@v4` with `node-version: '24'` and `cache: 'pnpm'`
  - [x] 2.6 Add dependency install: `pnpm install --frozen-lockfile`
  - [x] 2.7 Add build step: `pnpm build`
  - [x] 2.8 Add Lighthouse CI step using `treosh/lighthouse-ci-action@v12` with `configPath: ./lighthouserc.cjs` and `uploadArtifacts: true`
  - [x] 2.9 Add concurrency group to cancel superseded runs: `lighthouse-${{ github.ref }}`
  - [x] 2.10 Set `permissions: contents: read` (least privilege)
  - [x] 2.11 Set job timeout: `timeout-minutes: 10`

- [x] Task 3: Verify configuration works (AC: #1, #2, #3, #4)
  - [x] 3.1 Verify `pnpm build` succeeds and `dist/` directory is produced
  - [x] 3.2 Verify `lighthouserc.cjs` is valid by running `pnpm dlx @lhci/cli@0.15.1 autorun` locally (or confirm syntax is valid)
  - [x] 3.3 Verify the workflow YAML is valid (no syntax errors)

## Dev Notes

### CRITICAL: This is a CI/CD Infrastructure Story — No Source Code Changes

This story creates a Lighthouse CI workflow and configuration file. The ONLY files created are `.github/workflows/lighthouse.yml` and `lighthouserc.cjs`. No source code in `src/` is modified. No new runtime dependencies are added.

#### What Already Exists

1. **CI pipeline (story 4-2):**
   - `.github/workflows/ci.yml` — lint + format + test + build + E2E tests
   - Uses: `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4` (node 24, pnpm cache)
   - Build produces `dist/` directory via `pnpm build` (`tsc -b && vite build`)
   - Concurrency group pattern: `ci-${{ github.ref }}` with `cancel-in-progress: true`
   - `permissions: contents: read` (least privilege)
   - `timeout-minutes: 15`

2. **Deploy workflow:**
   - `.github/workflows/deploy-production.yml` — manual deployment to Cloudflare Pages
   - Out of scope — do NOT modify

3. **Build output:**
   - `pnpm build` produces static files in `dist/`
   - Vite SPA with TanStack Router (client-side routing)
   - All tool routes are `/tools/{tool-key}` pattern
   - Static HTML/CSS/JS output — perfect for `staticDistDir`

#### Lighthouse CI Design Decisions

**Separate workflow file (not added to ci.yml):**
- The architecture doc specifies `.github/workflows/lighthouse.yml` as a separate file
- Lighthouse CI takes 1-3 minutes and adds significant time — keeping it separate prevents slowing down the fast feedback loop of lint/test/build
- Separate workflow allows independent re-runs and different failure policies
- Epics doc confirms: "Lighthouse CI is Story 4-3 — NOT included in this story [4-2]. A separate workflow will handle Lighthouse"

**Config file must be `.cjs` (NOT `.js`):**
- `package.json` has `"type": "module"` — all `.js` files are treated as ESM
- Lighthouse CI loads config via `require()` (CommonJS) — a `.js` config in an ESM project fails with `ERR_REQUIRE_ESM`
- The `.cjs` extension forces CommonJS parsing regardless of project module type
- Native ESM config (`lighthouserc.mjs`) is NOT supported by Lighthouse CI

**Why `staticDistDir` (not `startServerCommand`):**
- The build output in `dist/` is static HTML/CSS/JS — no server runtime needed
- LHCI's built-in static server is sufficient and simpler
- `isSinglePageApplication: true` ensures the server returns `index.html` for unrecognized routes (needed for TanStack Router's client-side routing)

**Why `numberOfRuns: 3`:**
- Lighthouse scores have natural variance (~±3-5 points per run)
- 3 runs provides the median score for reliability without excessive CI time
- LHCI uses the median score across runs for assertions

**Why `treosh/lighthouse-ci-action@v12`:**
- Latest stable version, bundles `@lhci/cli@0.15.1` with Lighthouse 12.6.1
- Handles LHCI installation, autorun, and artifact upload in a single step
- Widely used (2.7k+ stars), well-maintained, recommended by Lighthouse team
- `uploadArtifacts: true` persists HTML reports as GitHub Actions artifacts

**Why no explicit Chrome installation:**
- `ubuntu-latest` GitHub Actions runners include Google Chrome pre-installed
- `@lhci/cli` uses `chrome-launcher` which auto-detects system Chrome
- No `browser-actions/setup-chrome` step needed

**Score thresholds (0-1 scale, NOT 0-100):**
- Lighthouse CI uses 0-1 scale internally: score of 90 = `minScore: 0.9`
- Performance, Accessibility, SEO: `'error'` level — fails the build
- Best Practices: `'warn'` level — logs warning but doesn't block the PR
- Best Practices is `'warn'` because it includes checks outside our control (e.g., browser deprecation notices, third-party font loading timing)

**Upload target: `temporary-public-storage`:**
- Reports are uploaded to a temporary Google Cloud storage URL
- Links are shareable and visible in the GitHub Actions output
- No LHCI server setup required — zero infrastructure overhead
- Reports expire after ~7 days (sufficient for PR review)

### CRITICAL: GitHub Actions Workflow Configuration

```yaml
# Key configuration points:
name: Lighthouse CI

on:
  pull_request:
    # Default types: opened, synchronize, reopened

permissions:
  contents: read

concurrency:
  group: lighthouse-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      # 1. Checkout
      - name: Checkout
        uses: actions/checkout@v4

      # 2. pnpm setup (MUST come before setup-node for cache to work)
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      # 3. Node.js setup with pnpm cache
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      # 4. Install deps (frozen lockfile for deterministic CI)
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 5. Build the site (produces dist/)
      - name: Build
        run: pnpm build

      # 6. Run Lighthouse CI
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./lighthouserc.cjs
          uploadArtifacts: true
```

**CRITICAL ordering note:** `pnpm/action-setup` MUST run before `actions/setup-node` — setup-node's `cache: 'pnpm'` requires pnpm to be installed first to locate the store directory. (Same pattern as ci.yml from story 4-2.)

### CRITICAL: Lighthouse CI Configuration

```js
// lighthouserc.cjs
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      isSinglePageApplication: true,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

**IMPORTANT:** No semicolons in the config values (project convention), but the `module.exports` line uses standard CommonJS syntax. The `.cjs` file is exempt from the project's oxfmt formatting since it's CommonJS infrastructure, not application code.

### Architecture Compliance

- **Separate Lighthouse workflow matches architecture doc:** `.github/workflows/lighthouse.yml` listed as NEW [Source: architecture.md#Project Directory Structure]
- **Lighthouse CI is part of the CI/CD pipeline specification:** "lint + format check + unit tests + build (with pre-rendering) + E2E tests + Lighthouse CI" [Source: architecture.md#CI/CD: Full Quality Pipeline]
- **Score thresholds match PRD NFRs:** Performance 90+ (NFR7), Accessibility 90+ (NFR18), SEO 90+ (NFR23) [Source: prd.md#Non-Functional Requirements]
- **pnpm only** — All steps use pnpm commands [Source: project-context.md#Package Management]
- **No source code changes** — CI/CD infrastructure only

### Library & Framework Requirements

- **No new runtime dependencies** — Lighthouse CI is a CI-only tool, handled by the GitHub Action
- **`treosh/lighthouse-ci-action@v12`** — Latest stable GitHub Action wrapping `@lhci/cli@0.15.1` + Lighthouse 12.6.1
- **`@lhci/cli@0.15.1`** — Bundled within the GitHub Action, not installed as a project dependency
- **Chrome** — Pre-installed on `ubuntu-latest` runners, auto-detected by `chrome-launcher`
- **GitHub Actions runner:** `ubuntu-latest` (includes Chrome, Node.js, git, common build tools)
- **Same action versions as ci.yml:** `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`

### File Structure Requirements

**Files to CREATE:**

```
lighthouserc.cjs                    — Lighthouse CI configuration (CommonJS, project root)
.github/workflows/lighthouse.yml    — Lighthouse CI workflow (PR quality gate)
```

**Files NOT to modify:**
- `.github/workflows/ci.yml` — Existing CI pipeline (separate concern)
- `.github/workflows/deploy-production.yml` — Existing deploy workflow (out of scope)
- `package.json` — No new scripts or dependencies needed
- `src/**/*` — No source code changes
- Any other file — This story creates exactly TWO new files

### Testing Requirements

**No new tests to write.** This story creates CI infrastructure that measures EXISTING site quality.

**Verification that Lighthouse will work (run locally before committing):**
```bash
pnpm build                                    # Must succeed, producing dist/
pnpm dlx @lhci/cli@0.15.1 autorun            # Optional: run locally to verify config
```

**Post-merge verification:**
- Open a test PR to verify the Lighthouse workflow triggers
- Verify scores appear in PR status checks
- Verify Lighthouse report artifacts are uploaded
- Verify threshold assertions work (performance, accessibility, SEO >= 90)

### Previous Story Intelligence (Story 4-2)

From story 4-2 (CI/CD Pipeline):

- **GitHub Actions patterns established:**
  - `pnpm/action-setup@v4` BEFORE `actions/setup-node@v4` (required for cache)
  - `pnpm install --frozen-lockfile` for deterministic installs
  - `permissions: contents: read` (least privilege)
  - Concurrency group with `cancel-in-progress: true`
  - Job timeout specified
- **Workflow structure:** single job with sequential steps
- **Build step:** `pnpm build` produces `dist/` directory
- **Artifact upload:** `actions/upload-artifact@v4` for reports
- **Code review learnings:** Added concurrency group, job timeout, failure-only artifact upload, step names for all setup actions
- **Commit pattern:** `✨: story 4-2` — sparkle emoji for infrastructure features

### Git Intelligence

Recent commits:
```
ef7ad63 ✨: story 4-2
fd4a033 ✨: story 4-1
e1e1996 ✨: add close button to tool page Card to navigate home
35f808d 🐛: hide close button entirely when onClose is not provided
a8150f7 ♻️: story 3-7
```

**Pattern:** `✨:` prefix for new features/infrastructure. This story adds Lighthouse CI infrastructure, so `✨: story 4-3` is appropriate.

**Epic 4 is in-progress** — stories 4-1 and 4-2 done, 4-3 is next.

### Latest Technical Information

**Lighthouse CI (February 2026):**
- `@lhci/cli@0.15.1` is latest stable (June 2025), bundles Lighthouse 12.6.1
- `treosh/lighthouse-ci-action@v12` is latest stable GitHub Action
- **CRITICAL:** Config file must be `.cjs` for ESM projects — LHCI uses `require()` internally
- `isSinglePageApplication: true` is essential for SPAs — serves `index.html` for all unrecognized routes
- Score assertions use 0-1 scale (0.9 = 90, NOT 90)
- `temporary-public-storage` upload gives shareable report links with no infrastructure setup
- Chrome is pre-installed on `ubuntu-latest` — no extra browser setup needed
- Node 18+ required (project uses Node 24 — well above minimum)
- Reports now stored by `requestedUrl` instead of `finalUrl` (v0.15.0 change)

**Known limitations:**
- No native ESM config support (GitHub issue #973 still open)
- Lighthouse scores have natural variance (±3-5 points) — `numberOfRuns: 3` with median mitigates this
- `temporary-public-storage` reports expire after ~7 days

### Project Structure Notes

- `lighthouserc.cjs` at project root — alongside existing `.oxlintrc.json`, `.oxfmtrc.json`, etc.
- `.github/workflows/lighthouse.yml` alongside existing `ci.yml` and `deploy-production.yml`
- No new directories created
- Both files follow conventions of their respective ecosystems (GitHub Actions YAML, LHCI CommonJS config)
- Architecture doc lists both files as NEW [Source: architecture.md#Project Directory Structure]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3] — Acceptance criteria and story definition
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4] — Epic objectives: quality infrastructure and contributor experience
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD: Full Quality Pipeline] — Pipeline composition includes Lighthouse CI
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — GitHub Actions pipeline decision
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Verification] — Lighthouse CI catches performance/accessibility regressions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Directory Structure] — `lighthouserc.js` and `.github/workflows/lighthouse.yml` listed as NEW
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR7 (Performance 90+), NFR18 (Accessibility 90+), NFR23 (SEO 90+)
- [Source: _bmad-output/project-context.md#Scripts] — `pnpm build` command
- [Source: _bmad-output/project-context.md#Package Management] — pnpm only, `--frozen-lockfile` in CI
- [Source: _bmad-output/implementation-artifacts/4-2-ci-cd-pipeline.md] — Previous story: CI workflow patterns, GitHub Actions configuration, concurrency groups
- [Source: .github/workflows/ci.yml] — Existing CI workflow (reference for GitHub Actions patterns)
- [Source: package.json] — `"type": "module"` requiring `.cjs` extension for LHCI config

## Senior Developer Review (AI)

**Reviewer:** csrteam on 2026-02-14
**Outcome:** Approved with fixes applied

### Findings Summary

| # | Severity | Description | Resolution |
|---|----------|-------------|------------|
| M1 | MEDIUM | Architecture doc references `lighthouserc.js` instead of `lighthouserc.cjs` | Fixed — updated architecture.md |
| M2 | MEDIUM | Only root page tested — no tool page URLs in Lighthouse config | Fixed — added `url` array with root + `/tools/color-converter` |
| L1 | LOW | Epic definition references `lighthouserc.js` instead of `lighthouserc.cjs` | Noted — epic is upstream planning artifact |
| L2 | LOW | Task 3 verification claims lack recorded tool output | Noted |
| L3 | LOW | Category-level assertions only, no granular audit checks | Noted — future enhancement |

### Fixes Applied

1. **`lighthouserc.cjs`** — Added `url` array to `collect` config to test both root page and a representative tool page (`/tools/color-converter`), providing coverage beyond just the homepage.
2. **`_bmad-output/planning-artifacts/architecture.md`** — Corrected filename from `lighthouserc.js` to `lighthouserc.cjs` in the project directory structure section.

## Change Log

- 2026-02-14: Story 4-3 implemented — Created Lighthouse CI configuration and GitHub Actions workflow for automated performance, accessibility, and SEO quality gates on pull requests.
- 2026-02-14: Code review — Fixed 2 MEDIUM issues: added tool page URL to Lighthouse config for broader coverage, corrected architecture doc filename reference.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered. Clean implementation of two infrastructure files.

### Completion Notes List

- Created `lighthouserc.cjs` with CommonJS syntax (required for ESM project), configuring staticDistDir, SPA mode, 3 runs per URL, score assertions (performance/accessibility/SEO at error level >= 0.9, best-practices at warn level >= 0.9), and temporary-public-storage upload target.
- Created `.github/workflows/lighthouse.yml` as a separate workflow (not merged into ci.yml) triggered on pull_request events, following the same GitHub Actions patterns established in story 4-2 (pnpm setup before Node.js setup, frozen lockfile, least-privilege permissions, concurrency group, job timeout).
- Verified: `pnpm build` succeeds producing `dist/`, `lighthouserc.cjs` loads correctly via `require()`, workflow YAML structure is valid.
- No source code changes, no new runtime dependencies, no existing tests affected.

### File List

- `lighthouserc.cjs` (NEW) — Lighthouse CI configuration file (CommonJS format)
- `.github/workflows/lighthouse.yml` (NEW) — Lighthouse CI GitHub Actions workflow
- `_bmad-output/planning-artifacts/architecture.md` (MODIFIED) — Corrected `lighthouserc.js` → `lighthouserc.cjs` in project directory structure (review fix)
