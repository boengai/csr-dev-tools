export type EnvConvertMode = 'env-to-json' | 'env-to-yaml' | 'json-to-env' | 'yaml-to-env'

export type EnvInput = { mode: EnvConvertMode; source: string }

export type EnvResult = { output: string; warnings: Array<string> }
