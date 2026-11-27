// Extract page-1 text from each output with pdf.js (legacy build, Node), to
// see whether encrypted inputs come out readable.
const pdfjs = await import(process.argv[2])
const { readFileSync } = await import('node:fs')
for (const f of process.argv.slice(3)) {
  try {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(f)), verbosity: 0 }).promise
    const page = await doc.getPage(1)
    const tc = await page.getTextContent()
    const ops = await page.getOperatorList()
    const text = tc.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').slice(0, 70)
    console.log(f.split('/').slice(-2).join('/').padEnd(44), `ops=${ops.fnArray.length}`, JSON.stringify(text))
  } catch (e) {
    console.log(f.split('/').slice(-2).join('/').padEnd(44), 'ERROR', String(e.message).slice(0, 80))
  }
}
