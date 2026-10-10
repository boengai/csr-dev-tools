/**
 * Enforces the project rule "all types live in `src/types`" (re-exported
 * through the `@/types` barrels). Fails listing every top-level
 * `type X = …` / `interface X …` declared anywhere else under `src/`.
 *
 * Documented exceptions (not scanned):
 *   - `src/types/**` — the home of every type.
 *   - `*.d.ts` — ambient declarations (`vite-env.d.ts`, module shims).
 *   - `*.spec.ts` / `*.spec.tsx` and `src/test/**` — test-only fixture types
 *     (fake workers, sample bags) stay next to the test that uses them;
 *     moving them would leak test scaffolding into the production barrel.
 *   - Function-local types (indented, inside a function body) — they may
 *     reference local values (`typeof pdf.embedPng`) and are not part of any
 *     module's surface. Only module-scope (column-0) declarations count.
 *
 * Detection is a regex over source with comments and string / template
 * literal contents blanked out first, so sample code embedded in strings
 * (e.g. GraphQL SDL `interface Node {`) is not mistaken for a declaration.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

const SRC_DIR = join(__dirname, '..')

const DECLARATION =
  /^(?:export\s+)?(?:declare\s+)?(?:type\s+[A-Za-z_$][\w$]*\s*(?:<.*>)?\s*=|interface\s+[A-Za-z_$][\w$]*)/

const isExempt = (rel: string): boolean =>
  rel.startsWith(`types${sep}`) || rel.startsWith(`test${sep}`) || rel.endsWith('.d.ts') || /\.spec\.tsx?$/.test(rel)

/** Characters after which a `/` starts a regex literal rather than a division. */
const REGEX_PRECEDERS = new Set([
  '',
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  '}',
  ';',
  '+',
  '-',
  '*',
  '%',
  '<',
  '>',
  '~',
  '^',
])

/**
 * Blank out comments and the contents of string, template and regex literals
 * (newlines kept so line numbers survive). Template `${…}` expressions are
 * kept as code, including nested templates.
 */
function stripNonCode(source: string): string {
  let out = ''
  let i = 0
  // Stack of open template literals; each entry counts `{` depth inside its
  // current `${…}` expression (-1 = in the template's text part).
  const templates: Array<number> = []
  let lastSignificant = ''

  const blank = (ch: string) => (ch === '\n' ? '\n' : ' ')

  while (i < source.length) {
    // charAt keeps these strings ('' past the end) so the comparisons below stay simple.
    const ch = source.charAt(i)
    const next = source.charAt(i + 1)
    const inTemplateText = templates.length > 0 && templates[templates.length - 1] === -1

    if (inTemplateText) {
      if (ch === '\\') {
        out += blank(ch) + blank(next)
        i += 2
      } else if (ch === '`') {
        templates.pop()
        out += ch
        i += 1
        lastSignificant = '`'
      } else if (ch === '$' && next === '{') {
        templates[templates.length - 1] = 0
        out += '${'
        i += 2
        lastSignificant = '{'
      } else {
        out += blank(ch)
        i += 1
      }
      continue
    }

    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out += ' '
        i += 1
      }
      continue
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      for (; i < stop; i += 1) out += blank(source.charAt(i))
      continue
    }
    if (ch === '"' || ch === "'") {
      out += ch
      i += 1
      while (i < source.length && source[i] !== ch && source[i] !== '\n') {
        if (source[i] === '\\') {
          out += ' '
          i += 1
        }
        out += blank(source[i] ?? '')
        i += 1
      }
      out += source[i] ?? ''
      i += 1
      lastSignificant = ch
      continue
    }
    if (ch === '/' && REGEX_PRECEDERS.has(lastSignificant)) {
      out += ch
      i += 1
      let inClass = false
      while (i < source.length && source[i] !== '\n' && (inClass || source[i] !== '/')) {
        if (source[i] === '\\') {
          out += ' '
          i += 1
        } else if (source[i] === '[') inClass = true
        else if (source[i] === ']') inClass = false
        out += blank(source[i] ?? '')
        i += 1
      }
      out += source[i] ?? ''
      i += 1
      lastSignificant = '/'
      continue
    }
    if (ch === '`') {
      templates.push(-1)
      out += ch
      i += 1
      continue
    }
    const depth = templates.at(-1)
    if (depth !== undefined) {
      const top = templates.length - 1
      if (ch === '{') templates[top] = depth + 1
      else if (ch === '}') {
        if (depth === 0) {
          templates[top] = -1
          out += ch
          i += 1
          continue
        }
        templates[top] = depth - 1
      }
    }

    out += ch
    if (!/\s/.test(ch)) lastSignificant = /[\w$)\]]/.test(ch) ? 'x' : ch
    i += 1
  }
  return out
}

function findTypeDeclarations(source: string): Array<{ line: number; text: string }> {
  const original = source.split('\n')
  return stripNonCode(source)
    .split('\n')
    .flatMap((line, index) =>
      DECLARATION.test(line) ? [{ line: index + 1, text: (original[index] ?? line).trim() }] : [],
    )
}

const listSourceFiles = (): Array<string> =>
  (readdirSync(SRC_DIR, { recursive: true }) as Array<string>)
    .filter((rel) => /\.tsx?$/.test(rel))
    .filter((rel) => !isExempt(rel))

describe('types location rule', () => {
  it('declares no module-scope type or interface outside src/types', () => {
    const offenders = listSourceFiles().flatMap((rel) =>
      findTypeDeclarations(readFileSync(join(SRC_DIR, rel), 'utf8')).map(
        ({ line, text }) => `src/${rel}:${line}  ${text}`,
      ),
    )
    expect(offenders, 'Move these into src/types and re-export via the @/types barrels').toEqual([])
  })

  describe('detector', () => {
    it('flags module-scope type aliases and interfaces, exported or not', () => {
      const src = [
        'type A = string',
        'export type B<T extends object = {}> = T',
        'interface C { x: number }',
        'export interface D extends C {}',
        'export declare type E = number',
      ].join('\n')
      expect(findTypeDeclarations(src).map((d) => d.line)).toEqual([1, 2, 3, 4, 5])
    })

    it('ignores function-local types, type-only re-exports and inline type imports', () => {
      const src = [
        'export type { A } from "./a"',
        'import { type B } from "./b"',
        'function f() {',
        '  type Local = number',
        '}',
      ].join('\n')
      expect(findTypeDeclarations(src)).toEqual([])
    })

    it('ignores declarations inside template literals, strings and comments', () => {
      const src = [
        'const sdl = `',
        'type Query {',
        '  user: User',
        '}',
        'interface Node {',
        '  id: ID!',
        '}',
        '`',
        '// type Commented = string',
        '/*',
        'interface InBlock {}',
        '*/',
        "const s = 'type NotReal = 1'",
        'const r = /`/',
        'type AfterRegex = 1',
      ].join('\n')
      expect(findTypeDeclarations(src).map((d) => d.text)).toEqual(['type AfterRegex = 1'])
    })

    it('resumes code after a template literal with nested ${} expressions', () => {
      const src = ['const t = `a ${`b ${c}`} d`', 'type After = 1'].join('\n')
      expect(findTypeDeclarations(src).map((d) => d.line)).toEqual([2])
    })
  })
})
