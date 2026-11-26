// Generates the two inputs dx and Tailwind need from the React sources, so the
// Dioxus build keeps the same head tags and the same theme:
// - dioxus/app/index.html from index.html: same head, `<title>{app_title}</title>`
//   (a literal title gets dx's title appended, issue 5979), an empty `#root`,
//   and no React entry script (dx injects its own loader).
// - dioxus/app/style/tailwind.css from src/index.css: scans the Rust sources
//   instead of src/, plus dioxus/app/style/extra.css.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const app = resolve(root, 'dioxus/app')

const replaceOnce = (text: string, from: RegExp, to: string, what: string) => {
  if (!from.test(text)) throw new Error(`[template] ${what} not found`)
  return text.replace(from, () => to)
}

let html = readFileSync(resolve(root, 'index.html'), 'utf-8')
const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]
html = replaceOnce(html, /<title>[^<]*<\/title>/, '<title>{app_title}</title>', '<title>')
html = replaceOnce(html, /\s*<script type="module" src="\/src\/main.tsx"><\/script>/, '', 'React entry script')
html = replaceOnce(html, /<div id="root"><\/div>/, '<div id="root"></div>', 'empty #root')
writeFileSync(resolve(app, 'index.html'), html)

// dx reads the title from Dioxus.toml; keep it equal to the React home title.
const toml = readFileSync(resolve(app, 'Dioxus.toml'), 'utf-8')
const tomlTitle = /^title = "(.*)"$/m.exec(toml)?.[1]
if (tomlTitle !== title) throw new Error(`[template] Dioxus.toml title "${tomlTitle}" is not index.html's "${title}"`)

let css = readFileSync(resolve(root, 'src/index.css'), 'utf-8')
css = replaceOnce(css, /@import 'tailwindcss';/, "@import 'tailwindcss' source(none);\n@source '../src';", 'tailwind import')
css += '\n' + readFileSync(resolve(app, 'style/extra.css'), 'utf-8')
writeFileSync(resolve(app, 'style/tailwind.css'), css)
console.log('[template] wrote dioxus/app/index.html and dioxus/app/style/tailwind.css')
