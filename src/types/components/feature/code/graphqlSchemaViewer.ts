import type { GraphqlSchemaInfo } from '@/utils'

export type GraphqlParseOutput = {
  parseError: string | null
  schema: GraphqlSchemaInfo | null
}
