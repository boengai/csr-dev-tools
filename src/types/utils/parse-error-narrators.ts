export type SourceFormat = 'csv' | 'json' | 'toml' | 'xml' | 'yaml'

export type ParseErrorNarrator = {
  label: string
  get: (source: string) => Promise<string | null>
}
