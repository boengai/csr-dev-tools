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
    page.locator('fieldset').filter({ has: page.locator(`label:text-is("${label}")`) }).locator('input'),
  textAreaByLabel: (page: Page, label: string) =>
    page.locator('fieldset').filter({ has: page.locator(`label:text-is("${label}")`) }).locator('textarea'),
  selectTrigger: (page: Page, label: string) =>
    page.locator('fieldset').filter({ has: page.locator(`label:text-is("${label}")`) }).locator('button'),
  uploadButton: (page: Page) => page.getByRole('button', { name: 'Upload File' }),
}

// --- Tool Outputs ---

export const toolOutput = {
  byLabel: (page: Page, label: string) =>
    page.locator('fieldset').filter({ has: page.locator(`label:text-is("${label}")`) }),
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

// --- Error Messages ---

export const errorMessage = {
  any: (page: Page) => page.getByRole('alert'),
  withText: (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text }),
}
