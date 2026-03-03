import type { Page } from '@playwright/test'

// --- Sidebar Navigation ---

export const sidebar = {
  toggleButton: (page: Page) => page.getByLabel('Toggle navigation'),
  nav: (page: Page) => page.locator('nav[aria-label="Tool navigation"]'),
  toolLink: (page: Page, name: string) =>
    page.locator('nav[aria-label="Tool navigation"]').getByRole('button', { name }),
}

// --- Command Palette ---

export const commandPalette = {
  searchButton: (page: Page) => page.getByLabel('Search tools'),
  searchInput: (page: Page) => page.getByPlaceholder('Search tools...'),
  resultsList: (page: Page) => page.getByRole('listbox'),
  resultOption: (page: Page, name: string) => page.getByRole('option', { name }),
}

// --- Tool Inputs ---

export const toolInput = {
  byLabel: (page: Page, label: string) =>
    page
      .locator('fieldset')
      .filter({ has: page.locator(`label:text-is("${label}")`) })
      .locator('input'),
  textAreaByLabel: (page: Page, label: string) =>
    page
      .locator('fieldset')
      .filter({ has: page.locator(`label:text-is("${label}")`) })
      .locator('textarea'),
  selectTrigger: (page: Page, label: string) =>
    page
      .locator('fieldset')
      .filter({ has: page.locator(`label:text-is("${label}")`) })
      .locator('button'),
  uploadButton: (page: Page) => page.getByRole('button', { name: 'Upload File' }),
}

// --- CodeMirror (CodeInput) Helpers ---

export const codeInput = {
  /** Get the CodeMirror wrapper by its name (data-testid="code-input-{name}") */
  byName: (page: Page, name: string) => page.getByTestId(`code-input-${name}`),

  /** Get the editable content area of a CodeMirror editor */
  content: (page: Page, name: string) => page.getByTestId(`code-input-${name}`).locator('.cm-content'),

  /** Fill a CodeMirror editor: click, select all, then type new content */
  fill: async (page: Page, name: string, text: string) => {
    const cm = page.getByTestId(`code-input-${name}`).locator('.cm-content')
    await cm.click()
    await page.keyboard.press('Meta+A')
    await page.keyboard.insertText(text)
  },
}

/** Get the first CodeMirror content area inside a container (e.g. dialog) */
export const codeInputIn = {
  content: (container: ReturnType<Page['locator']>) => container.locator('.cm-content').first(),

  fill: async (page: Page, container: ReturnType<Page['locator']>, text: string) => {
    const cm = container.locator('.cm-content').first()
    await cm.click()
    await page.keyboard.press('Meta+A')
    await page.keyboard.insertText(text)
  },
}

// --- Copy Button ---

export const copyButton = {
  byLabel: (page: Page, label: string) => page.getByLabel(`Copy ${label} to clipboard`),
}

// --- Toast Notifications ---

export const toast = {
  message: (page: Page, text: string) => page.getByText(text, { exact: true }),
  copied: (page: Page) => page.getByText('Copied to clipboard', { exact: true }),
}

// --- Card Containers ---

export const card = {
  byTitle: (page: Page, title: string) =>
    page.locator('article').filter({ has: page.locator(`h3:text-is("${title}")`) }),
  title: (page: Page, title: string) => page.getByRole('heading', { name: title, level: 3 }),
}

// --- Error Messages (toast-based, Radix Toast uses role="status") ---

export const errorMessage = {
  any: (page: Page) => page.getByRole('status'),
  withText: (page: Page, text: string) => page.getByRole('status').filter({ hasText: text }),
}
