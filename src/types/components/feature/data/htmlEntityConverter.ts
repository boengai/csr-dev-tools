export type HtmlEntityConvertMode = 'encode' | 'decode'

export type EntityMode = 'named' | 'numeric'

export type HtmlEntityInput = { entityMode: EntityMode; mode: HtmlEntityConvertMode; source: string }
