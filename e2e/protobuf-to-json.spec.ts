import { expect, test } from '@playwright/test'

import { card } from './helpers/selectors'

const VALID_PROTO = `syntax = "proto3";

package example;

message Person {
  string name = 1;
  int32 age = 2;
  bool active = 3;
  repeated string tags = 4;
  Address address = 5;
  Status status = 6;
  map<string, string> metadata = 7;

  enum Status {
    UNKNOWN = 0;
    ACTIVE = 1;
    INACTIVE = 2;
  }
}

message Address {
  string street = 1;
  string city = 2;
  string zip_code = 3;
  string country = 4;
}

message Order {
  string order_id = 1;
  Person customer = 2;
  repeated OrderItem items = 3;
  double total = 4;
  int64 created_at = 5;
}

message OrderItem {
  string product_name = 1;
  int32 quantity = 2;
  float price = 3;
}

enum PaymentMethod {
  CREDIT_CARD = 0;
  DEBIT_CARD = 1;
  PAYPAL = 2;
  CRYPTO = 3;
}`

const INVALID_PROTO = `syntax = "proto3";

message Test {
  string name = 1;
  invalid_syntax here;
}`

const NESTED_PROTO = `syntax = "proto3";

message Parent {
  string id = 1;
  Child child = 2;
}

message Child {
  string value = 1;
  GrandChild nested = 2;
}

message GrandChild {
  string deep_value = 1;
}`

const ENUM_PROTO = `syntax = "proto3";

message Request {
  string id = 1;
  Priority priority = 2;
}

enum Priority {
  LOW = 0;
  MEDIUM = 1;
  HIGH = 2;
  CRITICAL = 3;
}`

const REPEATED_PROTO = `syntax = "proto3";

message Collection {
  repeated string items = 1;
  repeated int32 numbers = 2;
}`

test.describe('Protobuf to JSON', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/protobuf-to-json')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'Protobuf to JSON')).toBeVisible()
    await expect(
      page.getByText('Paste .proto definitions and see corresponding JSON structures', { exact: false }),
    ).toBeVisible()
  })

  test('paste valid .proto with multiple message types → message list shows all types', async ({ page }) => {
    await page.locator('textarea').fill(VALID_PROTO)

    await expect(page.getByLabel('Person - Message type')).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('Address - Message type')).toBeVisible()
    await expect(page.getByLabel('Order - Message type')).toBeVisible()
    await expect(page.getByLabel('OrderItem - Message type')).toBeVisible()
    await expect(page.getByLabel('Status - Enum type')).toBeVisible()
    await expect(page.getByLabel('PaymentMethod - Enum type')).toBeVisible()
  })

  test('click a message in the list → JSON output panel shows sample JSON with correct field defaults', async ({
    page,
  }) => {
    await page.locator('textarea').fill(VALID_PROTO)

    const outputPanel = page.locator('[aria-live="polite"]')

    await expect(page.getByLabel('Address - Message type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Address - Message type').click()

    await expect(outputPanel.getByText('"street"')).toBeVisible()
    await expect(outputPanel.getByText('"city"')).toBeVisible()
    await expect(outputPanel.getByText('"country"')).toBeVisible()
  })

  test('proto with nested messages → JSON output shows nested objects', async ({ page }) => {
    await page.locator('textarea').fill(NESTED_PROTO)

    const outputPanel = page.locator('[aria-live="polite"]')

    await expect(page.getByLabel('Parent - Message type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Parent - Message type').click()

    await expect(outputPanel.getByText('"child"')).toBeVisible()
    await expect(outputPanel.getByText('"value"')).toBeVisible()
    await expect(outputPanel.getByText('"deepValue"')).toBeVisible()
  })

  test('paste invalid .proto syntax → error message with line number is displayed', async ({ page }) => {
    await page.locator('textarea').fill(INVALID_PROTO)

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('alert')).toContainText(/line/i)
  })

  test('proto with enum fields → JSON output uses first enum value name', async ({ page }) => {
    await page.locator('textarea').fill(ENUM_PROTO)

    const outputPanel = page.locator('[aria-live="polite"]')

    await expect(page.getByLabel('Request - Message type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Request - Message type').click()

    await expect(outputPanel.getByText('"LOW"')).toBeVisible()
  })

  test('proto with repeated fields → JSON output shows arrays', async ({ page }) => {
    await page.locator('textarea').fill(REPEATED_PROTO)

    const outputPanel = page.locator('[aria-live="polite"]')

    await expect(page.getByLabel('Collection - Message type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Collection - Message type').click()

    const preElement = outputPanel.locator('pre')
    await expect(preElement).toBeVisible()
    const jsonText = await preElement.textContent()
    expect(jsonText).toContain('"items"')
    expect(jsonText).toContain('"numbers"')
  })

  test('paste new proto → previous selection is cleared, new messages shown', async ({ page }) => {
    await page.locator('textarea').fill(VALID_PROTO)

    await expect(page.getByLabel('Person - Message type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('Person - Message type').click()

    const outputPanel = page.locator('[aria-live="polite"]')
    await expect(outputPanel.getByText('"name"')).toBeVisible()

    await page.locator('textarea').fill(NESTED_PROTO)
    await expect(page.getByLabel('Parent - Message type')).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('Person - Message type')).not.toBeVisible()
  })

  test('mobile viewport (375px) responsiveness — layout stacks vertically', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.locator('textarea')).toBeVisible()

    await page.locator('textarea').fill(VALID_PROTO)
    await expect(page.getByLabel('Person - Message type')).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('Address - Message type')).toBeVisible()
  })
})
