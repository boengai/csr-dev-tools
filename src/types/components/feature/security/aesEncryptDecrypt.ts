export type Mode = 'decrypt' | 'encrypt'

export type AesInput = { mode: Mode; password: string; source: string }
