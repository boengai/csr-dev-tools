import { expect, test } from '@playwright/test'

import {
  badInput,
  dashboardTile,
  dialogToolFor,
  expectBadInputContract,
  expectOpenContract,
  LAYOUT_SPECS,
  noBadInputReason,
  openInDialog,
  openOnRoute,
  seedBadInput,
  seedDashboard,
} from './layout-contract'
import { LAYOUT_ERROR_FIXTURES } from './layout-fixtures'
import { CONTRACT } from './tags'
import { SHELL_LAYOUTS, toolsWithLayout } from './tools'

/**
 * The layout contract suite (docs/ux/parity.md): every Tool with a layout, on
 * its route, plus one Tool per layout in the dashboard dialog. The Tool list
 * and layouts come from the registry; the bad input from `layout-fixtures.ts`.
 */

for (const layout of SHELL_LAYOUTS) {
  const spec = LAYOUT_SPECS[layout]
  const tools = toolsWithLayout(layout)
  const fixtures = LAYOUT_ERROR_FIXTURES[layout]
  const opening =
    spec.opensWith === 'placeholder'
      ? 'opens on its empty state: status slot above the work area, placeholder output, its action beside the output'
      : 'opens with output: status slot above the work area, a value in the output, its action beside the output'

  test.describe(`${layout} layout contract`, { tag: CONTRACT }, () => {
    for (const tool of tools) {
      const { tile } = spec
      if (tile) {
        test(`${tool.key} on the dashboard: its tile is one button that opens the dialog`, async ({ page }) => {
          await seedDashboard(page, tool)
          await page.goto('/')
          await tile(dashboardTile(page, tool))
          // ...and that button opens the Tool in the dialog.
          await openInDialog(page, tool)
        })
      }

      test.describe(`${tool.key} on its route`, () => {
        test(opening, async ({ page }) => {
          await expectOpenContract(await openOnRoute(page, tool), spec)
        })

        const fixture = fixtures[tool.key]
        const bad = badInput(fixture)
        if (!bad) {
          test.skip(`shows invalid input in the status slot and clears the output (${noBadInputReason(fixture, spec)})`, () => {})
          return
        }
        test('shows invalid input in the status slot and clears the output', async ({ page }) => {
          await seedBadInput(page, bad)
          await expectBadInputContract(page, await openOnRoute(page, tool), spec, bad)
        })
      })
    }

    const dialogTool = dialogToolFor(layout)
    if (!dialogTool) return
    test.describe(`${dialogTool.key} in the dashboard dialog`, () => {
      test(opening, async ({ page }) => {
        await seedDashboard(page, dialogTool)
        await page.goto('/')
        await expectOpenContract(await openInDialog(page, dialogTool), spec)
      })

      const bad = badInput(fixtures[dialogTool.key])
      if (!bad) return
      test('shows invalid input in the status slot and clears the output', async ({ page }) => {
        await seedDashboard(page, dialogTool)
        await seedBadInput(page, bad)
        await page.goto('/')
        await expectBadInputContract(page, await openInDialog(page, dialogTool), spec, bad)
      })
    })
  })
}

test('the layout contract covers at least one Tool', { tag: CONTRACT }, () => {
  expect(SHELL_LAYOUTS.flatMap(toolsWithLayout).length).toBeGreaterThan(0)
})
