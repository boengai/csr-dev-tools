import { expect, test } from '@playwright/test'

import { card } from './helpers/selectors'

const VALID_SDL = `type Query {
  user(id: ID!): User
  users(limit: Int = 10): [User!]!
  search(query: String!): [SearchResult!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

"""A user in the system"""
type User implements Node {
  id: ID!
  name: String!
  email: String!
  role: Role!
  posts: [Post!]!
}

type Post implements Node {
  id: ID!
  title: String!
  content: String!
  author: User!
  status: PostStatus!
}

interface Node {
  id: ID!
}

union SearchResult = User | Post

enum Role {
  ADMIN
  USER
  MODERATOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED @deprecated(reason: "Use DRAFT instead")
}

input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER
}

scalar DateTime`

const INVALID_SDL = `type Query {
  user(: User
}`

test.describe('GraphQL Schema Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/graphql-schema-viewer')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 })
  })

  test('renders tool with title and description', async ({ page }) => {
    await expect(card.title(page, 'GraphQL Schema Viewer')).toBeVisible()
    await expect(
      page.getByText(
        'Paste a GraphQL schema (SDL) and browse its types, fields, arguments, and relationships.',
        { exact: false },
      ),
    ).toBeVisible()
  })

  test('paste valid SDL → type list shows all types with correct kind badges', async ({ page }) => {
    await page.locator('textarea').fill(VALID_SDL)

    // Wait for parsing (300ms debounce + processing)
    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })

    // Verify key types are listed with correct kind badges
    await expect(page.getByLabel('Query - Object type')).toBeVisible()
    await expect(page.getByLabel('Mutation - Object type')).toBeVisible()
    await expect(page.getByLabel('Node - Interface type')).toBeVisible()
    await expect(page.getByLabel('SearchResult - Union type')).toBeVisible()
    await expect(page.getByLabel('Role - Enum type')).toBeVisible()
    await expect(page.getByLabel('CreateUserInput - Input Object type')).toBeVisible()
    await expect(page.getByLabel('DateTime - Scalar type')).toBeVisible()
  })

  test('click a type → detail panel shows fields, arguments, and descriptions', async ({ page }) => {
    await page.locator('textarea').fill(VALID_SDL)

    const detailPanel = page.locator('[aria-live="polite"]')

    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('User - Object type').click()

    // Detail panel should show User type info — scoped to aria-live panel
    await expect(detailPanel.getByText('A user in the system')).toBeVisible()
    await expect(detailPanel.getByText('Fields')).toBeVisible()
    await expect(detailPanel.getByText('name')).toBeVisible()
    await expect(detailPanel.getByText('email')).toBeVisible()
  })

  test('click a type reference → navigates to that type', async ({ page }) => {
    await page.locator('textarea').fill(VALID_SDL)

    const detailPanel = page.locator('[aria-live="polite"]')

    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('User - Object type').click()

    // Click on Role type reference in User fields
    const roleRef = detailPanel.getByLabel('Navigate to type Role!')
    await expect(roleRef).toBeVisible()
    await roleRef.click()

    // Detail panel should now show Role enum
    await expect(detailPanel.getByText('ADMIN')).toBeVisible()
    await expect(detailPanel.getByText('MODERATOR')).toBeVisible()
  })

  test('paste invalid SDL → error message with line number', async ({ page }) => {
    await page.locator('textarea').fill(INVALID_SDL)

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('alert')).toContainText(/line/i)
  })

  test('type in search box → type list filters by name', async ({ page }) => {
    await page.locator('textarea').fill(VALID_SDL)

    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })

    // Filter with "DateTime" — only matches the DateTime scalar type
    await page.getByPlaceholder('Filter types...').fill('DateTime')

    await expect(page.getByLabel('DateTime - Scalar type')).toBeVisible()
    // Other types should be hidden
    await expect(page.getByLabel('User - Object type')).not.toBeVisible()
    await expect(page.getByLabel('Query - Object type')).not.toBeVisible()
  })

  test('clear search box → all types shown again', async ({ page }) => {
    await page.locator('textarea').fill(VALID_SDL)

    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })

    // Filter
    await page.getByPlaceholder('Filter types...').fill('DateTime')
    await expect(page.getByLabel('User - Object type')).not.toBeVisible()

    // Clear filter
    await page.getByPlaceholder('Filter types...').fill('')
    await expect(page.getByLabel('User - Object type')).toBeVisible()
  })

  test('paste new SDL → previous selection is cleared, new types shown', async ({ page }) => {
    const detailPanel = page.locator('[aria-live="polite"]')

    await page.locator('textarea').fill(VALID_SDL)

    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })
    await page.getByLabel('User - Object type').click()
    await expect(detailPanel.getByText('A user in the system')).toBeVisible()

    // Paste different SDL
    await page.locator('textarea').fill('type NewType { id: ID! }')
    await expect(page.getByLabel('NewType - Object type')).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('User - Object type')).not.toBeVisible()
  })

  test('mobile viewport (375px) responsiveness', async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 })

    await expect(page.locator('textarea')).toBeVisible()

    await page.locator('textarea').fill(VALID_SDL)
    await expect(page.getByLabel('User - Object type')).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('Query - Object type')).toBeVisible()
  })
})
