# Story 4.2: CI/CD Pipeline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **contributor**,
I want **automated quality gates that run on every pull request**,
So that **I get immediate feedback on code quality and can't accidentally merge broken code**.

**Epic:** Epic 4 — Quality Infrastructure & Contributor Experience
**Dependencies:** Story 4-1 (E2E test infrastructure — complete)
**Story Key:** 4-2-ci-cd-pipeline

## Acceptance Criteria

### AC1: CI Workflow Triggers on Pull Requests

**Given** `.github/workflows/ci.yml`
**When** a pull request is opened or updated against any branch
**Then** the CI pipeline is triggered automatically

### AC2: Pipeline Runs Quality Gates in Sequence

**Given** the CI pipeline is triggered
**When** it executes
**Then** the pipeline runs in sequence: lint (`pnpm lint`) → format check (`pnpm format:check`) → unit tests (`pnpm test`) → build (`pnpm build`)
**And** each step only runs if the previous step succeeded

### AC3: Failed Steps Block PR Merge

**Given** any pipeline step fails
**When** the PR status is checked
**Then** the PR is blocked from merging with a clear failure indicator and log output
**And** the failing step name and error output are visible in the GitHub Actions UI

### AC4: Passing Pipeline Shows Green Status

**Given** all pipeline steps pass
**When** the PR status is checked
**Then** the PR shows a green success status check

### AC5: pnpm Package Management with Caching

**Given** the pipeline configuration
**When** a developer inspects it
**Then** it uses `pnpm` for package management with `--frozen-lockfile` for deterministic installs
**And** pnpm store is cached between runs for faster execution

### AC6: E2E Tests Run in Pipeline

**Given** the CI pipeline runs successfully through unit tests and build
**When** E2E tests are configured
**Then** Playwright E2E tests run in headless Chromium after the build step
**And** Playwright browser binaries are cached for faster CI runs
**And** E2E test failures block the PR from merging

## Tasks / Subtasks

- [x] Task 1: Create CI workflow file (AC: #1, #2, #4, #5)
  - [x] 1.1 Create `.github/workflows/ci.yml` with trigger on `pull_request` events (opened, synchronize, reopened)
  - [x] 1.2 Configure job with `ubuntu-latest` runner
  - [x] 1.3 Add checkout step: `actions/checkout@v4`
  - [x] 1.4 Add pnpm setup: `pnpm/action-setup@v4` with version 10
  - [x] 1.5 Add Node.js setup: `actions/setup-node@v4` with `node-version: '24'` and `cache: 'pnpm'`
  - [x] 1.6 Add dependency install: `pnpm install --frozen-lockfile`
  - [x] 1.7 Add lint step: `pnpm lint`
  - [x] 1.8 Add format check step: `pnpm format:check`
  - [x] 1.9 Add unit test step: `pnpm test`
  - [x] 1.10 Add build step: `pnpm build`

- [x] Task 2: Add E2E test step to pipeline (AC: #6)
  - [x] 2.1 Add Playwright browser install step: `pnpm exec playwright install --with-deps chromium`
  - [x] 2.2 Add E2E test step: `pnpm test:e2e` (runs after build)
  - [x] 2.3 Add Playwright report upload as artifact on failure for debugging

- [x] Task 3: Verify pipeline works (AC: #1, #2, #3, #4)
  - [x] 3.1 Ensure all existing checks still pass locally: `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm test:e2e`
  - [x] 3.2 Verify the workflow YAML is valid (no syntax errors)

## Dev Notes

### CRITICAL: This is a CI/CD Infrastructure Story — No Source Code Changes

This story creates a GitHub Actions CI workflow file. The ONLY file created is `.github/workflows/ci.yml`. No source code in `src/` is modified. No new dependencies are added. The existing quality tooling (oxlint, oxfmt, vitest, playwright) is simply orchestrated in a CI pipeline.

#### What Already Exists

1. **Quality tooling is fully set up locally:**
   - `pnpm lint` — oxlint 1.46.0 (runs, clean)
   - `pnpm format:check` — oxfmt 0.31.0 (runs, clean)
   - `pnpm test` — vitest 4.0.18 (299 passing unit tests)
   - `pnpm build` — tsc -b && vite build (succeeds)
   - `pnpm test:e2e` — playwright 1.58.2 (9 passing E2E tests)

2. **Existing GitHub Actions workflow:**
   - `.github/workflows/deploy-production.yml` — manual deployment to Cloudflare Pages via `workflow_dispatch`
   - Uses: `actions/checkout@v4`, `actions/setup-node@v4` (node 24), `pnpm/action-setup@v2`
   - **IMPORTANT:** The deploy workflow uses `pnpm/action-setup@v2` which is outdated. The new CI workflow should use `@v4`. Do NOT modify the existing deploy workflow in this story — that's out of scope.

3. **Playwright infrastructure (from story 4-1):**
   - `playwright.config.ts` configured with baseURL `http://localhost:5173`, `webServer` launching `pnpm dev`
   - Chromium-only (single browser project)
   - CI detection via `process.env.CI` — headless, 0 retries, HTML reporter
   - E2E tests in `e2e/` directory — 9 tests across `color-converter.spec.ts` and `platform/home.spec.ts`
   - `vitest.config.ts` excludes `e2e/**` to prevent conflicts

#### CI Workflow Design Decisions

**Pipeline sequence (sequential, not parallel):**
```
lint → format:check → unit tests → build → E2E tests
```

**Why sequential:**
- Fail fast — lint errors are cheapest to detect, so they run first
- Build depends on TypeScript check (`tsc -b` is part of `pnpm build`)
- E2E tests need a built app to run against (Playwright's `webServer` starts dev server, but build step validates the production build)
- The architecture doc specifies "in sequence" order

**Why include E2E tests:**
- Story 4-1 established Playwright infrastructure specifically for CI integration
- The architecture doc specifies E2E as part of the CI pipeline
- 9 E2E tests are already passing and provide real regression protection
- Without E2E in CI, the infrastructure from story 4-1 provides no automated value

**Playwright in CI specifics:**
- Must install Chromium browser binary in CI: `pnpm exec playwright install --with-deps chromium`
- `--with-deps` installs OS-level dependencies (libglib, libnss, etc.) needed on Ubuntu
- The `CI` env var is automatically set by GitHub Actions — Playwright config already handles this
- `webServer` in playwright.config.ts starts `pnpm dev` automatically for E2E tests
- Upload HTML report as artifact on failure for debugging

### CRITICAL: GitHub Actions Configuration Details

```yaml
# Key configuration points:
name: CI
on:
  pull_request:
    branches: ['*']  # All branches — not just main
    # Default types: opened, synchronize, reopened — no need to specify

permissions:
  contents: read  # Minimum permissions (principle of least privilege)

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout
      - uses: actions/checkout@v4

      # 2. pnpm setup (MUST come before setup-node for cache to work)
      - uses: pnpm/action-setup@v4
        with:
          version: 10

      # 3. Node.js setup with pnpm cache
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      # 4. Install deps (frozen lockfile for deterministic CI)
      - run: pnpm install --frozen-lockfile

      # 5. Quality gates (sequential)
      - name: Lint
        run: pnpm lint
      - name: Format Check
        run: pnpm format:check
      - name: Unit Tests
        run: pnpm test
      - name: Build
        run: pnpm build

      # 6. E2E Tests (after build)
      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps chromium
      - name: E2E Tests
        run: pnpm test:e2e

      # 7. Upload Playwright report on failure
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**CRITICAL ordering note:** `pnpm/action-setup` MUST run before `actions/setup-node` — setup-node's `cache: 'pnpm'` requires pnpm to be installed first to locate the store directory.

### Architecture Compliance

- **CI pipeline composition matches architecture doc:** lint + format check + unit tests + build + E2E tests [Source: architecture.md#CI/CD: Full Quality Pipeline]
- **Lighthouse CI is Story 4-3** — NOT included in this story. A separate workflow will handle Lighthouse [Source: epics.md#Story 4.3]
- **pnpm only** — All steps use pnpm commands [Source: project-context.md#Package Management]
- **No source code changes** — CI workflow is infrastructure only
- **Named exports, type not interface** — Not applicable (YAML file, no TypeScript)

### Library & Framework Requirements

- **No new dependencies** — The CI workflow orchestrates existing tooling
- **GitHub Actions runner:** `ubuntu-latest` (includes Node.js, git, common build tools)
- **pnpm/action-setup@v4** — Latest version (v2 used by deploy workflow is outdated but NOT modified in this story)
- **actions/setup-node@v4** — With `cache: 'pnpm'` for pnpm store caching
- **actions/checkout@v4** — Standard checkout action
- **actions/upload-artifact@v4** — For Playwright report on E2E failure
- **Playwright Chromium** — Installed in CI via `pnpm exec playwright install --with-deps chromium`

### File Structure Requirements

**Files to CREATE:**

```
.github/workflows/ci.yml    — CI pipeline workflow (pull request quality gates)
```

**Files NOT to modify:**
- `.github/workflows/deploy-production.yml` — Existing deploy workflow (out of scope)
- `package.json` — No new scripts or dependencies needed (all scripts already exist)
- `playwright.config.ts` — Already CI-ready (detects `CI` env var)
- `vitest.config.ts` — Already configured (excludes e2e/)
- `src/**/*` — No source code changes
- Any other file — This story creates exactly ONE new file

### Testing Requirements

**No new tests to write.** This story creates CI infrastructure that runs EXISTING tests:
- 299 unit tests (vitest)
- 9 E2E tests (playwright)

**Verification that CI will work (run locally before committing):**
```bash
pnpm lint           # Must pass (0 errors)
pnpm format:check   # Must pass (0 format issues)
pnpm test           # Must pass (299 tests)
pnpm build          # Must succeed (tsc + vite build)
pnpm test:e2e       # Must pass (9 E2E tests)
```

**Post-merge verification:**
- Open a test PR to verify the workflow triggers and all steps pass
- Verify GitHub shows the CI status check on the PR

### Previous Story Intelligence (Story 4-1)

From story 4-1 (E2E Test Infrastructure):

- **Playwright 1.58.2** installed with Chromium browser
- **playwright.config.ts** has CI detection: `forbidOnly: !!process.env.CI`, `retries: 0` (was fixed from 1 in code review), `workers: process.env.CI ? 1 : undefined`, `reporter: 'html'`
- **9 E2E tests passing** — color-converter.spec.ts (5 tests) + platform/home.spec.ts (4 tests)
- **vitest.config.ts** updated to exclude `e2e/**` (prevents Vitest from picking up Playwright tests)
- **Debug learnings:** Clipboard permissions needed in Playwright config, `Control+k` for keyboard shortcuts in headless Chromium, `waitForLoadState('networkidle')` needed before some interactions
- **Commit pattern:** `✨: story 4-1` (sparkle for new feature/infrastructure)

### Git Intelligence

Recent commits:
```
fd4a033 ✨: story 4-1
e1e1996 ✨: add close button to tool page Card to navigate home
35f808d 🐛: hide close button entirely when onClose is not provided
a8150f7 ♻️: story 3-7
537bffb ♻️: story 3-6
```

**Pattern:** `✨:` prefix for new features/infrastructure. This story adds CI pipeline infrastructure, so `✨: story 4-2` is appropriate.

**Epic 4 is in-progress** — story 4-1 done, 4-2 is next. All of Epics 1-3 complete.

### Latest Technical Information

**GitHub Actions (February 2026):**
- `pnpm/action-setup@v4` is the latest stable version (v2 is outdated and has issues with newer Node.js)
- `actions/setup-node@v4` with `cache: 'pnpm'` automatically caches the pnpm store using the lockfile hash as cache key
- **CRITICAL:** `pnpm/action-setup` must run BEFORE `actions/setup-node` — the cache feature requires pnpm to be installed first
- `--frozen-lockfile` is mandatory in CI for deterministic installs (fails if lockfile is out of sync)
- `ubuntu-latest` includes Node.js runtime, git, and common build tools

**Playwright 1.58.2 in CI:**
- Use `pnpm exec playwright install --with-deps chromium` to install browser + OS dependencies
- `--with-deps` is critical on Ubuntu — installs libglib, libnss, libatk, etc.
- `process.env.CI` is automatically set by GitHub Actions
- HTML reporter generates `playwright-report/` directory — upload as artifact for debugging
- Workers set to 1 in CI (from playwright.config.ts) to prevent resource contention

**pnpm Store Caching:**
- `actions/setup-node@v4` with `cache: 'pnpm'` caches the pnpm content-addressable store
- Cache key is based on `pnpm-lock.yaml` hash — invalidates when dependencies change
- Do NOT cache `node_modules` — pnpm symlinks break when cached

### Project Structure Notes

- `.github/workflows/ci.yml` is the ONLY new file — placed alongside existing `deploy-production.yml`
- No new directories created — `.github/workflows/` already exists
- Workflow file follows YAML conventions consistent with the existing `deploy-production.yml`
- Aligns with architecture doc specification: `.github/workflows/ci.yml` [Source: architecture.md#Project Structure]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — Acceptance criteria and story definition
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4] — Epic objectives: quality infrastructure and contributor experience
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD: Full Quality Pipeline] — Pipeline composition: lint + format + test + build + E2E + Lighthouse CI
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — GitHub Actions pipeline decision
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Verification] — CI quality gates prevent regressions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Directory Structure] — `.github/workflows/ci.yml` listed as NEW
- [Source: _bmad-output/project-context.md#Scripts] — pnpm lint, format:check, test, build commands
- [Source: _bmad-output/project-context.md#Package Management] — pnpm only, exact versions, --frozen-lockfile in CI
- [Source: _bmad-output/implementation-artifacts/4-1-e2e-test-infrastructure.md] — Previous story: Playwright 1.58.2 config, 9 E2E tests, CI-ready config
- [Source: .github/workflows/deploy-production.yml] — Existing deploy workflow (reference for GitHub Actions patterns)
- [Source: playwright.config.ts] — CI detection, webServer config, Chromium-only project
- [Source: package.json] — Available scripts, pnpm 10.11.0, Node >= 24.5.0

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All quality gates passed on first run.

### Completion Notes List

- Created `.github/workflows/ci.yml` with full CI pipeline: checkout → pnpm setup (v4) → Node.js 24 setup with pnpm cache → frozen-lockfile install → lint → format check → unit tests → build → Playwright browser install → E2E tests → artifact upload on failure
- Pipeline triggers on all `pull_request` events against any branch (default types: opened, synchronize, reopened)
- Correct ordering: `pnpm/action-setup@v4` runs before `actions/setup-node@v4` so pnpm cache works
- `permissions: contents: read` follows principle of least privilege
- Playwright report uploaded as artifact with 7-day retention using `if: ${{ failure() }}` — only on failure to save storage
- All local verification passed: 0 lint errors, clean formatting, 299 unit tests, successful build, 9 E2E tests

### File List

- `NEW` .github/workflows/ci.yml

## Change Log

- 2026-02-14: Created CI/CD pipeline workflow for pull request quality gates (lint, format, test, build, E2E)
- 2026-02-14: Code review fixes (6 issues) — added Playwright browser caching (AC6), removed `branches: ['*']` filter for correct all-branch matching (AC1), added concurrency group to cancel superseded runs, added 15min job timeout, changed artifact upload to failure-only, added step names for all setup actions
