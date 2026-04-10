export type OutputFormat = 'base64' | 'binary' | 'hex'

export type CodecResult = { error: string; success: false } | { output: string; success: true }
