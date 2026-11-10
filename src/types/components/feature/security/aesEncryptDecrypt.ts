export type Mode = 'decrypt' | 'encrypt'

export type AesInput = { mode: Mode; password: string; source: string }

/** The AES Codec's modes. */
export type AesMode = AesInput['mode']
