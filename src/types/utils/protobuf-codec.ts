export type OutputFormat = 'base64' | 'hex' | 'raw'

export type CodecResult = { error: string; success: false } | { output: string; success: true }
