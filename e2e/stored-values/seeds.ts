import type { StorageSnapshot } from './contract.ts'

/**
 * The hand-written inputs of the golden values: the older shapes the four
 * migrations read, and damaged values (issue 15's list, and the lone
 * surrogate of ADR-0032 Decision 4). `main` cannot write these, so they are
 * seeds. What each one restores to is not written here: the capture script
 * gets it from React. Only a `deliberate` entry carries a hand-written
 * value, where the Dioxus build differs from React on purpose.
 */
export type Seed = {
  /** ADR-0032 Decision 4: what the Dioxus build restores instead, and why. Hand-written. */
  deliberate?: { expected: unknown; why: string }
  id: string
  /** The key whose restored value is recorded. */
  key: string
  /** Open the Tool to restore: a migration or the handoff runs when it opens and writes. */
  open?: true
  shape: 'damaged' | 'older'
  stored: StorageSnapshot
}

const P = 'csr-dev-tools-'

const STRICT = 'ADR-0032 Decision 4: strict by type. A value the type does not hold takes its default.'
const SURROGATE = 'ADR-0032 Decision 4: an unpaired UTF-16 surrogate escape becomes U+FFFD.'

/** One raw value for one key. */
const one = (id: string, key: string, raw: string, extra: Partial<Seed> = {}): Seed => ({
  id,
  key,
  shape: 'damaged',
  stored: { [key]: raw },
  ...extra,
})

/** Damage every JSON key can take: unreadable text, and JSON of the wrong type. */
const unreadable = (tool: string, key: string): Array<Seed> => [
  one(`${tool}/unparseable`, key, '{bad'),
  one(`${tool}/null`, key, 'null'),
]

const diagram = (tables: Array<{ columns: Array<string>; id: string }>) => ({
  relationships: [] as Array<unknown>,
  tables: tables.map(({ columns, id }, i) => ({
    columns: columns.map((c) => ({
      constraints: { isForeignKey: false, isNullable: false, isPrimaryKey: c === 'id', isUnique: c === 'id' },
      id: `${id}_${c}`,
      name: c,
      type: 'INT',
    })),
    id,
    name: id,
    position: { x: 40 + i * 300, y: 40 },
  })),
})

const entry = (id: string, name: string, updatedAt?: string) => ({
  createdAt: '2026-11-01T00:00:00.000Z',
  id,
  name,
  tableCount: 1,
  ...(updatedAt === undefined ? {} : { updatedAt }),
})

const json = (value: unknown): string => JSON.stringify(value)

const layout = (value: unknown, version?: number): string =>
  json(version === undefined ? { state: { value } } : { state: { value }, version })

export const SEEDS: Array<Seed> = [
  // --- A Transformer bag (Fields) ---
  ...unreadable('json-formatter', `${P}json-formatter`),
  one('json-formatter/empty-object', `${P}json-formatter`, '{}'),
  one('json-formatter/number', `${P}json-formatter`, '42'),
  one('json-formatter/string', `${P}json-formatter`, '"str"'),
  one('json-formatter/array', `${P}json-formatter`, '[]'),
  one('json-formatter/source-number', `${P}json-formatter`, '{"source":7}'),
  one('json-formatter/extra-field', `${P}json-formatter`, '{"source":"x","extra":1}'),
  one('json-formatter/surrogate-pair', `${P}json-formatter`, String.raw`{"source":"a😀"}`),
  one('json-formatter/lone-high-surrogate', `${P}json-formatter`, String.raw`{"source":"a\ud83d"}`, {
    deliberate: { expected: { source: 'a�' }, why: SURROGATE },
  }),
  one('json-formatter/lone-low-surrogate', `${P}json-formatter`, String.raw`{"source":"\ude00b"}`, {
    deliberate: { expected: { source: '�b' }, why: SURROGATE },
  }),
  one('json-formatter/escaped-backslash', `${P}json-formatter`, String.raw`{"source":"\\ud83d"}`),
  one('css-formatter/source-only', `${P}css-formatter`, '{"source":"a{}"}'),
  one('css-formatter/tab', `${P}css-formatter`, '{"source":"a{}","mode":"minify","indent":"tab"}'),
  one('css-formatter/unknown-mode-text-indent', `${P}css-formatter`, '{"source":"a{}","mode":"zzz","indent":"9"}', {
    deliberate: { expected: { indent: 2, mode: 'beautify', source: 'a{}' }, why: STRICT },
  }),
  one('sql-formatter/unknown-dialect', `${P}sql-formatter`, '{"source":"select 1","dialect":"zzz","indent":4}', {
    deliberate: { expected: { dialect: 'sql', indent: 4, source: 'select 1' }, why: STRICT },
  }),
  one('text-sort-dedupe/unknown-sort', `${P}text-sort-dedupe`, '{"source":"b","sortMode":"zzz"}', {
    deliberate: {
      expected: { removeDuplicates: false, removeEmpty: false, sortMode: 'az', source: 'b', trimLines: false },
      why: STRICT,
    },
  }),
  one('timezone-converter/source-only', `${P}timezone-converter`, '{"source":"2026-11-10 14:30"}'),
  {
    id: 'timezone-converter/before-the-shell',
    key: `${P}timezone-converter`,
    shape: 'older',
    stored: {
      [`${P}timezone-converter`]: json({
        dateInput: '2026-11-10',
        sourceTz: 'Asia/Tokyo',
        targetTzIds: ['UTC', 'Europe/London'],
        timeInput: '14:30',
      }),
    },
  },
  one('text-diff/empty-object', `${P}text-diff`, '{}'),
  one('text-diff/modified-null', `${P}text-diff`, '{"original":"a","modified":null}'),

  // --- Generator bags (Fields) ---
  one('uuid-generator/empty-object', `${P}uuid-generator`, '{}'),
  ...unreadable('uuid-generator', `${P}uuid-generator`),
  one('uuid-generator/count-text', `${P}uuid-generator`, '{"count":"abc"}', {
    deliberate: { expected: { count: 1 }, why: STRICT },
  }),
  one('password-generator/empty-object', `${P}password-generator`, '{}'),
  one('placeholder-image-generator/empty-object', `${P}placeholder-image-generator`, '{}'),
  one('placeholder-image-generator/width-not-numeric', `${P}placeholder-image-generator`, '{"width":"abc"}'),
  one('markdown-table-generator/empty-object', `${P}markdown-table-generator`, '{}'),
  one('markdown-table-generator/grid-mismatch', `${P}markdown-table-generator`, '{"cols":3,"data":[["x"]],"rows":3}'),
  one('crontab-generator/empty-object', `${P}crontab-generator`, '{}'),

  // --- Single strings (Input) and the Value bags ---
  one('html-to-pdf/object', `${P}html-to-pdf`, '{"a":1}'),
  one('graphql-schema-viewer/number', `${P}graphql-schema-viewer-input`, '42'),
  ...unreadable('protobuf-codec', `${P}protobuf-codec-input`),
  one('timezone-favorites/object', `${P}timezone-favorites`, '{}'),
  one('timezone-favorites/mixed', `${P}timezone-favorites`, '["UTC",7,"Asia/Tokyo"]'),

  // --- Codec ---
  one('base64-codec/unknown-mode', `${P}base64-mode`, '"zzz"', { open: true }),
  one('base64-codec/mode-number', `${P}base64-mode`, '42', { open: true }),
  one('base64-codec/source-number', `${P}base64-encode-source`, '42'),

  // --- The three per-tool migrations ---
  {
    id: 'mermaid-renderer/legacy-draft',
    key: `${P}mermaid-renderer`,
    open: true,
    shape: 'older',
    stored: { [`${P}mermaid-renderer-code`]: json('flowchart TD\n  A --> B') },
  },
  {
    id: 'mermaid-renderer/legacy-draft-and-new-key',
    key: `${P}mermaid-renderer`,
    open: true,
    shape: 'older',
    stored: {
      [`${P}mermaid-renderer`]: json({ source: 'flowchart LR\n  C --> D' }),
      [`${P}mermaid-renderer-code`]: json('flowchart TD\n  A --> B'),
    },
  },
  {
    id: 'mermaid-renderer/legacy-draft-not-a-string',
    key: `${P}mermaid-renderer`,
    open: true,
    shape: 'damaged',
    stored: { [`${P}mermaid-renderer-code`]: '42' },
  },
  {
    id: 'json-schema-validator/before-the-shell',
    key: `${P}json-schema-validator`,
    open: true,
    shape: 'older',
    stored: { [`${P}json-schema-validator`]: json({ jsonData: '{"a":1}', jsonSchema: '{"type":"object"}' }) },
  },
  {
    id: 'json-schema-validator/half-migrated',
    key: `${P}json-schema-validator`,
    open: true,
    shape: 'older',
    stored: { [`${P}json-schema-validator`]: json({ jsonData: '{"a":1}', schema: '{"type":"object"}', source: '' }) },
  },
  {
    id: 'jsonpath-evaluator/legacy-bag',
    key: `${P}jsonpath-evaluator-v2`,
    open: true,
    shape: 'older',
    stored: { [`${P}jsonpath-evaluator`]: json({ expression: '$.a', jsonInput: '{"a":1}' }) },
  },
  {
    id: 'jsonpath-evaluator/legacy-default',
    key: `${P}jsonpath-evaluator-v2`,
    open: true,
    shape: 'older',
    stored: { [`${P}jsonpath-evaluator`]: json({ expression: '$.store.book[*].author', jsonInput: '' }) },
  },
  {
    id: 'jsonpath-evaluator/legacy-junk',
    key: `${P}jsonpath-evaluator-v2`,
    open: true,
    shape: 'damaged',
    stored: { [`${P}jsonpath-evaluator`]: '{bad' },
  },
  {
    id: 'jsonpath-evaluator/legacy-and-v2',
    key: `${P}jsonpath-evaluator-v2`,
    open: true,
    shape: 'older',
    stored: {
      [`${P}jsonpath-evaluator`]: json({ expression: '$.a', jsonInput: '{"a":1}' }),
      [`${P}jsonpath-evaluator-v2`]: json({ expression: '$.b', source: '{"b":2}' }),
    },
  },

  // --- The handoff ---
  {
    id: 'mermaid-renderer/handoff-over-draft',
    key: `${P}mermaid-renderer`,
    open: true,
    shape: 'older',
    stored: {
      [`${P}handoff-mermaid-renderer`]: 'erDiagram\n  users {\n    INT id\n  }',
      [`${P}mermaid-renderer`]: json({ source: 'flowchart LR\n  C --> D' }),
    },
  },

  // --- The layout store (Zustand) ---
  {
    id: 'feature_layout/version-1',
    key: 'feature_layout',
    open: true,
    shape: 'older',
    stored: {
      feature_layout: layout(
        {
          0: 'BASE64_ENCODER',
          1: 'UNIX_TIMESTAMP',
          2: 'COLOR_CONVERTER',
          3: 'PX_TO_REM',
          4: 'IMAGE_RESIZER',
          5: 'IMAGE_CONVERTOR',
        },
        1,
      ),
    },
  },
  {
    id: 'feature_layout/version-0',
    key: 'feature_layout',
    open: true,
    shape: 'older',
    stored: { feature_layout: layout({ 0: 'base64-encoder', 1: 'json-formatter', 2: null, 3: 'zzz' }, 0) },
  },
  {
    id: 'feature_layout/version-1-renamed-keys',
    key: 'feature_layout',
    open: true,
    shape: 'older',
    stored: { feature_layout: layout({ 0: 'toml-to-json-converter', 1: 'xml-to-json-converter' }, 1) },
  },
  ...unreadable('feature_layout', 'feature_layout').map((s) => ({ ...s, open: true as const })),
  one('feature_layout/no-value', 'feature_layout', json({ state: {}, version: 2 }), { open: true }),
  one('feature_layout/no-version', 'feature_layout', layout({ 0: 'uuid-generator', 1: null }), { open: true }),
  one('feature_layout/version-3', 'feature_layout', layout({ 0: 'uuid-generator' }, 3), { open: true }),
  one('feature_layout/value-null', 'feature_layout', layout(null, 2), { open: true }),
  one('feature_layout/slot-not-a-string', 'feature_layout', layout({ 0: 7, 1: 'uuid-generator' }, 2), { open: true }),
  one('feature_layout/unknown-tool', 'feature_layout', layout({ 0: 'zzz', 1: 'uuid-generator' }, 2), {
    deliberate: {
      expected: {
        state: {
          value: {
            0: 'json-formatter',
            1: 'uuid-generator',
            2: 'base64-codec',
            3: 'jwt-decoder',
            4: 'unix-timestamp',
            5: 'regex-tester',
          },
        },
        version: 2,
      },
      why: "ADR-0032 Decision 4: a layout slot naming a tool the build does not know takes that slot's default.",
    },
    open: true,
  }),

  // --- The settings store (Zustand) ---
  ...unreadable('settings', 'settings').map((s) => ({ ...s, open: true as const })),
  one('settings/empty-value', 'settings', layout({}, 0), { open: true }),
  one('settings/version-1', 'settings', layout({ showBackgroundAnimation: true }, 1), { open: true }),
  one('settings/value-null', 'settings', layout(null, 0), { open: true }),
  one('settings/not-a-boolean', 'settings', layout({ showBackgroundAnimation: 'yes' }, 0), { open: true }),

  // --- DB Diagram ---
  one('db-diagram/unparseable', `${P}db-diagrams`, '{bad', { open: true }),
  one('db-diagram/no-diagrams-object', `${P}db-diagrams`, json({ index: [] }), { open: true }),
  one(
    'db-diagram/diagram-empty-object',
    `${P}db-diagrams`,
    json({ diagrams: { d1: {} }, index: [entry('d1', 'Empty', '2026-11-02T00:00:00.000Z')] }),
    { open: true },
  ),
  one(
    'db-diagram/no-updated-at',
    `${P}db-diagrams`,
    json({
      diagrams: { d1: diagram([{ columns: ['id'], id: 'users' }]), d2: diagram([{ columns: ['id'], id: 'posts' }]) },
      index: [entry('d1', 'One'), entry('d2', 'Two')],
    }),
    { open: true },
  ),
  one(
    'db-diagram/lost-index-entry',
    `${P}db-diagrams`,
    json({ diagrams: { d1: diagram([{ columns: ['id'], id: 'users' }]) }, index: [] }),
    { open: true },
  ),
  one(
    'db-diagram/dangling-relationships',
    `${P}db-diagrams`,
    json({
      diagrams: {
        d1: {
          ...diagram([
            { columns: ['id', 'user_id'], id: 'posts' },
            { columns: ['id'], id: 'users' },
          ]),
          relationships: [
            // Its table is gone: dropped.
            {
              id: 'r1',
              relationType: '1:N',
              sourceColumnId: 'gone_id',
              sourceTableId: 'gone',
              targetColumnId: 'posts_id',
              targetTableId: 'posts',
            },
            // Its column is gone: kept.
            {
              id: 'r2',
              relationType: '1:N',
              sourceColumnId: 'users_gone',
              sourceTableId: 'users',
              targetColumnId: 'posts_user_id',
              targetTableId: 'posts',
            },
          ],
        },
      },
      index: [entry('d1', 'Blog', '2026-11-02T00:00:00.000Z')],
    }),
    { open: true },
  ),
]
