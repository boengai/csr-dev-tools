import { writeFileSync } from 'node:fs'

import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

import BASELINE from './a11y-baseline.json' with { type: 'json' }
import {
  applyBadInput,
  badInput,
  dashboardDialogTool,
  openInDialog,
  openOnRoute,
  seedBadInput,
  seedDashboard,
} from './layout-contract'
import { LAYOUT_ERROR_FIXTURES } from './layout-fixtures'
import { settle, TOOL_TIMEOUT, WIDGET_LOADING } from './page'
import { isShellLayout, parityTools } from './tools'

/**
 * axe on every Tool route (on open, and in the bad-input state from the layout
 * contract's fixture), the home page and the dashboard dialog
 * (docs/ux/parity.md → Accessibility). The a11y baseline lists, per page, each
 * rule React fails and on how many elements. A page fails when a rule fails
 * that is not listed, or on more elements than listed. Regenerate the baseline
 * from React with `pnpm test:parity:a11y-baseline` (e2e/parity/README.md).
 */

/** Per page, the rules it fails and on how many elements. */
type A11yBaseline = Record<string, Record<string, number>>

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const RECORD = !!process.env.PARITY_A11Y_RECORD
const baseline: A11yBaseline = BASELINE

/** Runs axe and holds the result to the baseline (or, when recording, writes it down). */
const expectNoNewViolations = async (page: Page, key: string): Promise<void> => {
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const failing = Object.fromEntries(violations.map((v) => [v.id, v.nodes.length]))

  if (RECORD) {
    writeFileSync(test.info().outputPath('a11y.json'), JSON.stringify({ [key]: failing }))
    return
  }

  const known = baseline[key] ?? {}
  const added = violations
    .filter((v) => v.nodes.length > (known[v.id] ?? 0))
    .map(
      (v) =>
        `${v.id} (${v.impact}) on ${v.nodes.length} elements, baseline ${known[v.id] ?? 0}: ${v.help}\n    ` +
        v.nodes.map((n) => n.target.join(' ')).join('\n    '),
    )
  const fewer = Object.entries(known)
    .filter(([rule, count]) => (failing[rule] ?? 0) < count)
    .map(([rule, count]) => `${rule} ${count} → ${failing[rule] ?? 0}`)
  if (fewer.length > 0) {
    test
      .info()
      .annotations.push({ description: `fails less than its baseline: ${fewer.join(', ')}`, type: 'a11y baseline' })
  }
  expect(added, `axe failures beyond the a11y baseline for "${key}"`).toEqual([])
}

test.describe('axe', () => {
  test('home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('dashboard-widget').locator('article').first()).toBeVisible({ timeout: TOOL_TIMEOUT })
    await expect(page.locator(WIDGET_LOADING), 'every widget has filled in').toHaveCount(0, { timeout: TOOL_TIMEOUT })
    await expectNoNewViolations(page, 'home')
  })

  const dialogTool = dashboardDialogTool()
  if (dialogTool) {
    test(`dashboard dialog (${dialogTool.key})`, async ({ page }) => {
      await seedDashboard(page, dialogTool)
      await page.goto('/')
      await openInDialog(page, dialogTool)
      await expectNoNewViolations(page, 'dashboard-dialog')
    })
  }

  for (const tool of parityTools()) {
    test.describe(tool.key, () => {
      test('on open', async ({ page }) => {
        await page.goto(tool.routePath)
        await expect(page.getByRole('heading', { exact: true, level: 1, name: tool.name })).toBeVisible({
          timeout: TOOL_TIMEOUT,
        })
        await expectNoNewViolations(page, `${tool.key}:open`)
      })

      const bad = isShellLayout(tool.layout) ? badInput(LAYOUT_ERROR_FIXTURES[tool.layout][tool.key]) : null
      if (!bad) return
      test('with bad input', async ({ page }) => {
        await seedBadInput(page, bad)
        await applyBadInput(page, await openOnRoute(page, tool), bad)
        await expectNoNewViolations(page, `${tool.key}:bad-input`)
      })
    })
  }
})
