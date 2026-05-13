export type EscapedJsonConvertMode = 'stringify' | 'parse'

export type EscapedJsonInput = { doubleEscape: boolean; mode: EscapedJsonConvertMode; source: string }
