import { describe, expect, it } from 'vitest'

import { formatGraphqlType, parseGraphqlSchema } from '@/utils/graphql-schema-viewer'

const COMPREHENSIVE_SDL = `
type Query {
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
  createdAt: String!
}

type Post implements Node {
  id: ID!
  title: String!
  content: String!
  author: User!
  status: PostStatus!
  tags: [String!]
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
  """Use DRAFT instead"""
  ARCHIVED @deprecated(reason: "Use DRAFT instead")
}

input CreateUserInput {
  name: String!
  email: String!
  role: Role = USER
}

scalar DateTime
`

describe('graphql-schema-viewer', () => {
  describe('parseGraphqlSchema', () => {
    it('should parse valid SDL with all type kinds', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const { schema } = result
      const typeNames = schema.types.map((t) => t.name)

      expect(typeNames).toContain('Query')
      expect(typeNames).toContain('Mutation')
      expect(typeNames).toContain('User')
      expect(typeNames).toContain('Post')
      expect(typeNames).toContain('Node')
      expect(typeNames).toContain('SearchResult')
      expect(typeNames).toContain('Role')
      expect(typeNames).toContain('PostStatus')
      expect(typeNames).toContain('CreateUserInput')
      expect(typeNames).toContain('DateTime')
    })

    it('should categorize types by kind correctly', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const { schema } = result
      const byName = Object.fromEntries(schema.types.map((t) => [t.name, t]))

      expect(byName['User'].kind).toBe('Object')
      expect(byName['Node'].kind).toBe('Interface')
      expect(byName['SearchResult'].kind).toBe('Union')
      expect(byName['Role'].kind).toBe('Enum')
      expect(byName['CreateUserInput'].kind).toBe('Input')
      expect(byName['DateTime'].kind).toBe('Scalar')
    })

    it('should return error for invalid SDL with line number', () => {
      const invalidSdl = `
type Query {
  user(: User
}`
      const result = parseGraphqlSchema(invalidSdl)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toMatch(/line/i)
    })

    it('should filter out built-in types', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const { schema } = result
      const typeNames = schema.types.map((t) => t.name)

      expect(typeNames).not.toContain('__Schema')
      expect(typeNames).not.toContain('__Type')
      expect(typeNames).not.toContain('__Directive')
      expect(typeNames).not.toContain('String')
      expect(typeNames).not.toContain('Int')
      expect(typeNames).not.toContain('Float')
      expect(typeNames).not.toContain('Boolean')
      expect(typeNames).not.toContain('ID')
    })

    it('should extract fields with arguments, non-null, and list markers', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const queryType = result.schema.types.find((t) => t.name === 'Query')
      expect(queryType?.fields).toBeDefined()

      const usersField = queryType?.fields?.find((f) => f.name === 'users')
      expect(usersField).toBeDefined()
      expect(usersField?.isList).toBe(true)
      expect(usersField?.isNonNull).toBe(true)
      expect(usersField?.typeName).toBe('User')

      const limitArg = usersField?.args.find((a) => a.name === 'limit')
      expect(limitArg).toBeDefined()
      expect(limitArg?.typeName).toBe('Int')
      expect(limitArg?.defaultValue).toBe('10')
    })

    it('should extract descriptions', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const userType = result.schema.types.find((t) => t.name === 'User')
      expect(userType?.description).toBe('A user in the system')
    })

    it('should extract enum values with descriptions and deprecation reasons', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const postStatusType = result.schema.types.find((t) => t.name === 'PostStatus')
      expect(postStatusType?.enumValues).toBeDefined()
      expect(postStatusType?.enumValues).toHaveLength(3)

      const archivedValue = postStatusType?.enumValues?.find((v) => v.name === 'ARCHIVED')
      expect(archivedValue?.deprecationReason).toBe('Use DRAFT instead')
      expect(archivedValue?.description).toBe('Use DRAFT instead')
    })

    it('should extract interface implementations and union possible types', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const { schema } = result
      const userType = schema.types.find((t) => t.name === 'User')
      expect(userType?.interfaces).toContain('Node')

      const searchResultType = schema.types.find((t) => t.name === 'SearchResult')
      expect(searchResultType?.possibleTypes).toContain('User')
      expect(searchResultType?.possibleTypes).toContain('Post')
    })

    it('should extract query/mutation/subscription root type names', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      expect(result.schema.queryTypeName).toBe('Query')
      expect(result.schema.mutationTypeName).toBe('Mutation')
      expect(result.schema.subscriptionTypeName).toBeNull()
    })

    it('should return error for empty string input', () => {
      const result = parseGraphqlSchema('')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBe('Input is empty')
    })

    it('should return error for whitespace-only input', () => {
      const result = parseGraphqlSchema('   \n  ')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBe('Input is empty')
    })

    it('should extract input object fields correctly', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const inputType = result.schema.types.find((t) => t.name === 'CreateUserInput')
      expect(inputType?.kind).toBe('Input')
      expect(inputType?.inputFields).toBeDefined()
      expect(inputType?.inputFields).toHaveLength(3)

      const nameField = inputType?.inputFields?.find((f) => f.name === 'name')
      expect(nameField?.typeName).toBe('String')
      expect(nameField?.isNonNull).toBe(true)

      const roleField = inputType?.inputFields?.find((f) => f.name === 'role')
      expect(roleField?.typeName).toBe('Role')
    })

    it('should sort types alphabetically', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const typeNames = result.schema.types.map((t) => t.name)
      const sorted = [...typeNames].sort()
      expect(typeNames).toEqual(sorted)
    })

    it('should set typeKind to the actual kind of the referenced type', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const userType = result.schema.types.find((t) => t.name === 'User')
      const roleField = userType?.fields?.find((f) => f.name === 'role')
      expect(roleField?.typeKind).toBe('Enum')

      const postsField = userType?.fields?.find((f) => f.name === 'posts')
      expect(postsField?.typeKind).toBe('Object')

      const idField = userType?.fields?.find((f) => f.name === 'id')
      expect(idField?.typeKind).toBe('Scalar')
    })

    it('should preserve formattedType from GraphQL type toString', () => {
      const result = parseGraphqlSchema(COMPREHENSIVE_SDL)
      expect(result.success).toBe(true)
      if (!result.success) return

      const queryType = result.schema.types.find((t) => t.name === 'Query')
      const usersField = queryType?.fields?.find((f) => f.name === 'users')
      expect(usersField?.formattedType).toBe('[User!]!')

      const userField = queryType?.fields?.find((f) => f.name === 'user')
      expect(userField?.formattedType).toBe('User')

      const postType = result.schema.types.find((t) => t.name === 'Post')
      const tagsField = postType?.fields?.find((f) => f.name === 'tags')
      expect(tagsField?.formattedType).toBe('[String!]')

      const limitArg = usersField?.args.find((a) => a.name === 'limit')
      expect(limitArg?.formattedType).toBe('Int')
    })
  })

  describe('formatGraphqlType', () => {
    it('should format plain type', () => {
      expect(formatGraphqlType('User', false, false)).toBe('User')
    })

    it('should format non-null type', () => {
      expect(formatGraphqlType('User', true, false)).toBe('User!')
    })

    it('should format non-null list type', () => {
      expect(formatGraphqlType('User', true, true)).toBe('[User!]!')
    })

    it('should format nullable list type', () => {
      expect(formatGraphqlType('User', false, true)).toBe('[User]')
    })
  })
})
