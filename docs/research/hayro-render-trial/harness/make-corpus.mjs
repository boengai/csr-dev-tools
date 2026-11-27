// Builds the generated half of the #42 corpus into a directory (not committed).
//
//   node docs/research/hayro-render-trial/harness/make-corpus.mjs <corpusDir> <photo.jpg>
//
// Expects these downloaded files already in <corpusDir> (URLs and sha256 in
// the write-up): arxiv-attention.pdf, irs-fw9.pdf. Needs `qpdf` on PATH and
// `wasm/pkg/pdf` built (`bash wasm/scripts/build.sh --dev pdf`).
//
// Our tools' output is made by the tools' own code from src/ (identical on
// main and develop at the time of the trial), not by a re-implementation.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const [corpusDir, photoPath] = process.argv.slice(2).map((p) => resolve(p))
if (!corpusDir || !photoPath) throw new Error('usage: make-corpus.mjs <corpusDir> <photo.jpg>')
const repo = resolve(import.meta.dirname, '../../../..')
const out = (name, bytes) => {
  writeFileSync(join(corpusDir, name), bytes)
  console.log(`${name} ${bytes.length}`)
}

// ---------- PNG with alpha (hand-encoded, no image library) ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const makeAlphaPng = (w, h) => {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    for (let x = 0; x < w; x++) {
      const i = y * (w * 4 + 1) + 1 + x * 4
      const dx = (x - w / 2) / (w / 2)
      const dy = (y - h / 2) / (h / 2)
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy))
      raw[i] = Math.round(255 * (x / w))
      raw[i + 1] = Math.round(255 * (y / h))
      raw[i + 2] = 200
      raw[i + 3] = Math.round(255 * (1 - d)) // opaque centre, transparent corners
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- our tools: image-to-pdf, combine-pdf (pdf-lib) ----------
const { imagesToPdf } = await import(join(repo, 'src/utils/image-to-pdf.ts'))
const { combinePdfPages } = await import(join(repo, 'src/utils/combine-pdf.ts'))

const photo = new File([readFileSync(photoPath)], 'photo.jpg', { type: 'image/jpeg' })
const alpha = new File([makeAlphaPng(480, 320)], 'alpha.png', { type: 'image/png' })
const imageOne = await imagesToPdf([{ file: photo }, { file: alpha }, { file: photo, rotation: 90 }])
out('tool-image-to-pdf.pdf', imageOne.pdf)
const imageGrid = await imagesToPdf([{ file: photo }, { file: alpha }, { file: alpha }], { layout: 'grid-2x2' })
out('tool-image-to-pdf-grid.pdf', imageGrid.pdf)

const fw9 = new File([readFileSync(join(corpusDir, 'irs-fw9.pdf'))], 'irs-fw9.pdf')
const arxiv = new File([readFileSync(join(corpusDir, 'arxiv-attention.pdf'))], 'arxiv-attention.pdf')
const imgPdf = new File([imageOne.pdf], 'images.pdf')
const combined = await combinePdfPages([
  { file: fw9, pageIndex: 0 },
  { file: arxiv, pageIndex: 2 },
  { file: imgPdf, pageIndex: 1 },
  { file: arxiv, pageIndex: 0 },
])
out('tool-combine-pdf.pdf', combined.pdf)

// ---------- our tools: markdown-to-pdf (Typst wasm, same compile call) ----------
const pdfPkg = await import(join(repo, 'wasm/pkg/pdf/pdf.js'))
pdfPkg.initSync({ module: readFileSync(join(repo, 'wasm/pkg/pdf/pdf_bg.wasm')) })
const markdown = `# Hayro trial sample

Some **bold**, *italic*, \`inline code\` and a [link](https://example.com).

## Lists

1. First item
2. Second item
   - Nested bullet
   - Another one

> A blockquote with a little text in it.

| Column A | Column B | Column C |
|----------|---------:|:--------:|
| one      | 1        | yes      |
| two      | 22       | no       |

\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`

---

Unicode: café, naïve, Ελληνικά, Кириллица, emoji ✓ → ∑ ∞.
`
const result = pdfPkg.compile_markdown(markdown)
out('tool-markdown-to-pdf.pdf', result.pdf)
result.free()

// ---------- edge cases (pdf-lib): standard 14, rotation, CropBox ----------
{
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  let y = 800
  for (const name of Object.values(StandardFonts)) {
    const font = await doc.embedFont(name) // standard 14: referenced, not embedded
    const text =
      name === StandardFonts.Symbol
        ? 'αβγδπθω ∑∞≠'
        : name === StandardFonts.ZapfDingbats
          ? '✓✔✕✖★✈'
          : `${name}: The quick brown fox 0123`
    page.drawText(text, { font, size: 18, x: 40, y })
    y -= 34
  }
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const rotated = doc.addPage([595, 842])
  rotated.setRotation(degrees(90))
  rotated.drawText('Rotated 90 degrees, arrow points to top of page ->', { font: helv, size: 20, x: 40, y: 760 })
  rotated.drawRectangle({ x: 40, y: 40, width: 200, height: 100, color: rgb(0.9, 0.2, 0.2) })
  const cropped = doc.addPage([595, 842])
  cropped.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.2, 0.4, 0.9) })
  cropped.drawRectangle({ x: 100, y: 200, width: 300, height: 400, color: rgb(1, 1, 0.8) })
  cropped.drawText('Only this yellow box should show (CropBox)', { font: helv, size: 12, x: 110, y: 580 })
  cropped.setCropBox(100, 200, 300, 400)
  out('edge-std14-rotate-crop.pdf', await doc.save())
}

// ---------- CJK: non-embedded fonts with predefined CMaps (hand-written) ----------
{
  const ucs2 = (s) => [...s].map((ch) => ch.codePointAt(0).toString(16).padStart(4, '0')).join('')
  const fonts = [
    {
      cmap: 'UniJIS-UCS2-H',
      name: 'KozMinPr6N-Regular',
      ordering: 'Japan1',
      supplement: 6,
      text: `<${ucs2('日本語のテキスト、ひらがなカタカナ')}>`,
    },
    {
      cmap: 'UniGB-UCS2-H',
      name: 'STSong-Light',
      ordering: 'GB1',
      supplement: 4,
      text: `<${ucs2('简体中文文本测试')}>`,
    },
    {
      cmap: 'UniCNS-UCS2-H',
      name: 'MSung-Light',
      ordering: 'CNS1',
      supplement: 4,
      text: `<${ucs2('繁體中文文本測試')}>`,
    },
    {
      cmap: 'UniKS-UCS2-H',
      name: 'HYSMyeongJo-Medium',
      ordering: 'Korea1',
      supplement: 2,
      text: `<${ucs2('한국어 텍스트')}>`,
    },
    // 日本語 in Shift-JIS
    { cmap: '90ms-RKSJ-H', name: 'Ryumin-Light', ordering: 'Japan1', supplement: 2, text: '<93FA967B8CEA>' },
  ]
  const objs = []
  const add = (s) => objs.push(s) // object number = index + 1
  add('<< /Type /Catalog /Pages 2 0 R >>')
  add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  const fontRes = fonts.map((_, i) => `/F${i} ${5 + i * 3} 0 R`).join(' ')
  add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << ${fontRes} >> >> /Contents 4 0 R >>`)
  const content = fonts.map(({ text }, i) => `BT /F${i} 28 Tf 40 ${780 - i * 60} Td ${text} Tj ET`).join('\n')
  add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
  fonts.forEach(({ cmap, name, ordering, supplement }, i) => {
    const base = 5 + i * 3
    add(`<< /Type /Font /Subtype /Type0 /BaseFont /${name} /Encoding /${cmap} /DescendantFonts [${base + 1} 0 R] >>`)
    add(
      `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /${name}` +
        ` /CIDSystemInfo << /Registry (Adobe) /Ordering (${ordering}) /Supplement ${supplement} >>` +
        ` /FontDescriptor ${base + 2} 0 R /DW 1000 >>`,
    )
    add(
      `<< /Type /FontDescriptor /FontName /${name} /Flags 6 /FontBBox [-100 -200 1100 900]` +
        ' /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 >>',
    )
  })
  let body = '%PDF-1.7\n%\xe2\xe3\xcf\xd3\n'
  const offsets = []
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body, 'latin1'))
    body += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(body, 'latin1')
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  out('cjk-nonembedded-predefined-cmaps.pdf', Buffer.from(body, 'latin1'))
}

// ---------- encrypted variants of the arXiv paper (qpdf) ----------
const src = join(corpusDir, 'arxiv-attention.pdf')
const qpdf = (name, args) => {
  execFileSync('qpdf', ['--allow-weak-crypto', '--encrypt', ...args, '--', src, join(corpusDir, name)])
  console.log(name)
}
qpdf('enc-rc4-128-empty.pdf', ['--user-password=', '--owner-password=owner', '--bits=128', '--use-aes=n'])
qpdf('enc-aes-128-empty.pdf', ['--user-password=', '--owner-password=owner', '--bits=128', '--use-aes=y'])
qpdf('enc-aes-256-empty.pdf', ['--user-password=', '--owner-password=owner', '--bits=256'])

// ---------- failure modes ----------
qpdf('fail-locked-aes-256.pdf', ['--user-password=secret', '--owner-password=owner', '--bits=256'])
const arxivBytes = readFileSync(src)
out('fail-truncated.pdf', arxivBytes.subarray(0, Math.floor(arxivBytes.length / 2)))
out('fail-not-a-pdf.pdf', readFileSync(photoPath))
