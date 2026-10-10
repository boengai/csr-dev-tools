/**
 * FFI module types derived from wasm-bindgen's generated `.d.ts` files, so a
 * Rust signature change surfaces as a type error at the facade call site
 * instead of drifting silently. Pass these to `loadWasm<T>(name)`.
 */
export type BcryptWasm = typeof import('../../../wasm/pkg/bcrypt/bcrypt.js')
export type CertificateWasm = typeof import('../../../wasm/pkg/certificate/certificate.js')
export type ColorWasm = typeof import('../../../wasm/pkg/color/color.js')
export type CsvWasm = typeof import('../../../wasm/pkg/csv/csv.js')
export type DiffWasm = typeof import('../../../wasm/pkg/diff/diff.js')
export type FormatterWasm = typeof import('../../../wasm/pkg/formatter/formatter.js')
export type HashWasm = typeof import('../../../wasm/pkg/hash/hash.js')
export type HmacWasm = typeof import('../../../wasm/pkg/hmac/hmac.js')
export type JsonToolsWasm = typeof import('../../../wasm/pkg/json-tools/json-tools.js')
export type MarkdownWasm = typeof import('../../../wasm/pkg/markdown/markdown.js')
export type NumberBaseWasm = typeof import('../../../wasm/pkg/number-base/number-base.js')
export type ParsersWasm = typeof import('../../../wasm/pkg/parsers/parsers.js')
export type PdfWasm = typeof import('../../../wasm/pkg/pdf/pdf.js')
export type QrcodeWasm = typeof import('../../../wasm/pkg/qrcode/qrcode.js')
export type UuidWasm = typeof import('../../../wasm/pkg/uuid/uuid.js')
