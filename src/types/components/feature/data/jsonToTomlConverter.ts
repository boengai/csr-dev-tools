export type JsonTomlConvertMode = 'json-to-toml' | 'toml-to-json'

export type TomlJsonInput = { mode: JsonTomlConvertMode; source: string }
