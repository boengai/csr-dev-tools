import { writeFileSync } from 'node:fs'

import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

import type { ToolLayout } from '../../src/types/constants/tool-registry'
import BASELINE from './a11y-baseline.json' with { type: 'json' }
import { applyBadInput, badInput, DIALOG_TOOL, openInDialog, seedBadInput, seedDashboard } from './layout-contract'
import { LAYOUT_ERROR_FIXTURES } from './layout-fixtures'
import { settle } from './settle'
import { parityTools } from './tools'

/**
 * axe on every Tool route (on open, and in the bad-input state from the layout
 * contract's fixture), the home page and the dashboard dialog
 * (docs/ux/parity.md → Accessibility). A rule that fails on a page and is not
 * in the a11y baseline for that page fails the run. Regenerate the baseline
 * from React with `pnpm test:parity:a11y-baseline` (e2e/parity/README.md).
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const RECORD = !!process.env.PARITY_A11Y_RECORD
const baseline: Record<string, Array<string>> = BASELINE

/** Runs axe and holds the result to the baseline (or, when recording, writes it down). */
const expectNoNewViolations = async (page: Page, key: string): Promise<void> => {
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const rules = [...new Set(violations.map((v) => v.id))].sort()

  if (RECORD) {
    writeFileSync(test.info().outputPath('a11y.json'), JSON.stringify({ [key]: rules }))
    return
  }

  const known = new Set(baseline[key] ?? [])
  const added = violations
    .filter((v) => !known.has(v.id))
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`)
  const fixed = [...known].filter((rule) => !rules.includes(rule))
  if (fixed.length > 0) {
    test.info().annotations.push({ description: `no longer fails: ${fixed.join(', ')}`, type: 'a11y baseline' })
  }
  expect(added, `axe failures not in the a11y baseline for "${key}"`).toEqual([])
}

const hasShell = (layout: ToolLayout): layout is Exclude<ToolLayout, 'custom'> => layout !== 'custom'

test.describe('axe', () => {
  test('home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('dashboard-widget').locator('article').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('img[src*="/1f916/"]'), 'every widget has filled in').toHaveCount(0, { timeout: 15_000 })
    await expectNoNewViolations(page, 'home')
  })

  const tools = parityTools()
  const dialogTool = tools.find((tool) => Object.values(DIALOG_TOOL).includes(tool.key) && tool.layout !== 'custom')
  if (dialogTool) {
    test(`dashboard dialog (${dialogTool.key})`, async ({ page }) => {
      await seedDashboard(page, dialogTool)
      await page.goto('/')
      await openInDialog(page, dialogTool)
      await expectNoNewViolations(page, 'dashboard-dialog')
    })
  }

  for (const tool of tools) {
    test.describe(tool.key, () => {
      test('on open', async ({ page }) => {
        await page.goto(tool.routePath)
        await expect(page.getByRole('heading', { exact: true, level: 1, name: tool.name })).toBeVisible({
          timeout: 15_000,
        })
        await expectNoNewViolations(page, `${tool.key}:open`)
      })

      const bad = hasShell(tool.layout) ? badInput(LAYOUT_ERROR_FIXTURES[tool.layout][tool.key]) : null
      if (!bad) return
      test('with bad input', async ({ page }) => {
        await seedBadInput(page, bad)
        await page.goto(tool.routePath)
        const surface = page.locator('[data-slot="tool-surface"]')
        await expect(surface).toBeVisible({ timeout: 15_000 })
        await applyBadInput(page, surface, bad)
        await expectNoNewViolations(page, `${tool.key}:bad-input`)
      })
    })
  }
})
