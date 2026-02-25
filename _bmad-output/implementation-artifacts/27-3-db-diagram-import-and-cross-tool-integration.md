# Story 27.3: DB Diagram — Import & Cross-Tool Integration

Status: ready-for-dev

## Story

As a **developer**,
I want **to import existing SQL DDL into the diagram canvas and export my diagrams as Mermaid ER syntax or TypeScript interfaces**,
so that **I can visualize existing databases and leverage CSR Dev Tools' cross-tool ecosystem**.

## Acceptance Criteria

1. **Given** the user clicks "Import SQL"
   **When** a modal opens with a text input area and dialect selector (PostgreSQL, MySQL, SQLite)
   **Then** the user can paste SQL DDL and select the source dialect

2. **Given** the user pastes valid CREATE TABLE statements
   **When** the user clicks "Import"
   **Then** tables, columns (with types and constraints), and foreign key relationships are parsed and rendered as nodes/edges on the canvas

3. **Given** the imported SQL contains FOREIGN KEY constraints
   **When** parsed
   **Then** relationship edges are created between the correct columns with appropriate cardinality (default 1:N for FK, detect 1:1 if UNIQUE constraint on FK column)

4. **Given** the imported SQL has syntax errors or unsupported statements
   **When** parsing fails
   **Then** a clear error message shows what could not be parsed, and successfully parsed tables are still imported

5. **Given** the canvas has an existing diagram
   **When** the user imports SQL
   **Then** the user is asked whether to "Replace" (clear canvas first) or "Merge" (add alongside existing tables)

6. **Given** the canvas has tables and relationships
   **When** the user clicks "Export Mermaid"
   **Then** Mermaid ER diagram syntax is generated and displayed in a copyable output area

7. **Given** generated Mermaid output
   **When** the user clicks "Open in Mermaid Renderer"
   **Then** the Mermaid Renderer tool opens with the generated ER syntax pre-filled (via URL parameter or localStorage handoff)

8. **Given** the canvas has tables
   **When** the user clicks "Export TypeScript"
   **Then** TypeScript interface definitions are generated for each table (column names as properties, SQL types mapped to TS types)

9. **Given** generated TypeScript output
   **When** the user clicks CopyButton
   **Then** the TypeScript is copied to clipboard

10. **Given** the user clicks "Import JSON Schema"
    **When** the user pastes a valid JSON Schema with object definitions
    **Then** each schema object is converted to a table, properties become columns, `$ref` references become relationships

## Tasks / Subtasks

- [ ] Task 1: Create SQL DDL parser utility (AC: #1, #2, #3, #4)
  - [ ] 1.1 Create `src/utils/db-diagram-import.ts`:
    ```typescript
    export type ParseResult = {
      tables: Array<DiagramSchema['tables'][number]>
      relationships: Array<DiagramSchema['relationships'][number]>
      errors: Array<{ line: number; message: string }>
    }

    export function parseSqlDdl(sql: string, dialect: SqlDialect): ParseResult
    ```
  - [ ] 1.2 Implement a lightweight custom DDL parser (NO external library) that handles:
    - `CREATE TABLE name (...)` — extract table name
    - Column definitions: `name TYPE [NOT NULL] [PRIMARY KEY] [UNIQUE] [DEFAULT ...]`
    - Inline FK: `REFERENCES table(column)`
    - Table-level constraints: `PRIMARY KEY (col)`, `FOREIGN KEY (col) REFERENCES table(col)`, `UNIQUE (col)`
    - MySQL `AUTO_INCREMENT`, `ENGINE=InnoDB`
    - PostgreSQL `SERIAL`/`BIGSERIAL`
    - SQLite `AUTOINCREMENT`
    - `IF NOT EXISTS` (strip and ignore)
    - Comments: `--` line comments, `/* */` block comments (strip)
  - [ ] 1.3 Reverse-map SQL types back to `ColumnType`:
    | SQL Type (any dialect) | Maps to ColumnType |
    |----------------------|-------------------|
    | INT, INTEGER, SERIAL, AUTO_INCREMENT | INT |
    | BIGINT, BIGSERIAL | BIGINT |
    | VARCHAR(...), CHAR(...) | VARCHAR |
    | TEXT, TINYTEXT, MEDIUMTEXT, LONGTEXT | TEXT |
    | BOOLEAN, TINYINT(1), BOOL | BOOLEAN |
    | DATE | DATE |
    | TIMESTAMP, DATETIME | TIMESTAMP |
    | FLOAT, REAL, DOUBLE | FLOAT |
    | DECIMAL, NUMERIC | DECIMAL |
    | UUID, CHAR(36) | UUID |
    | JSON, JSONB | JSON |
    | BLOB, BYTEA, BINARY, VARBINARY | BLOB |
  - [ ] 1.4 Auto-layout imported tables on canvas:
    - Arrange in a grid pattern (3 columns, spacing 300px horizontal, 250px vertical)
    - Tables with FK dependencies placed to the right of their referenced tables
  - [ ] 1.5 FK cardinality detection:
    - Default: 1:N (standard FK)
    - If FK column has UNIQUE constraint: 1:1
    - N:M detection: NOT in scope (junction tables remain as regular tables)

- [ ] Task 2: Create Mermaid ER export utility (AC: #6)
  - [ ] 2.1 Create `src/utils/db-diagram-mermaid.ts`:
    ```typescript
    export function generateMermaidER(schema: DiagramSchema): string
    ```
  - [ ] 2.2 Output format:
    ```
    erDiagram
      USERS {
        int id PK
        varchar email
        timestamp created_at
      }
      POSTS {
        int id PK
        int user_id FK
        varchar title
      }
      USERS ||--o{ POSTS : "has"
    ```
  - [ ] 2.3 Relationship notation mapping:
    - 1:1 → `||--||`
    - 1:N → `||--o{`
    - N:M → `}o--o{`

- [ ] Task 3: Create TypeScript export utility (AC: #8)
  - [ ] 3.1 Create `src/utils/db-diagram-typescript.ts`:
    ```typescript
    export function generateTypeScript(schema: DiagramSchema): string
    ```
  - [ ] 3.2 SQL-to-TypeScript type mapping:
    | ColumnType | TypeScript Type |
    |-----------|----------------|
    | INT, BIGINT, SERIAL, FLOAT, DECIMAL | `number` |
    | VARCHAR, TEXT, UUID | `string` |
    | BOOLEAN | `boolean` |
    | DATE, TIMESTAMP | `Date` |
    | JSON | `Record<string, unknown>` |
    | BLOB | `Uint8Array` |
  - [ ] 3.3 Output format:
    ```typescript
    export type User = {
      id: number
      email: string
      createdAt: Date
    }

    export type Post = {
      id: number
      userId: number
      title: string
    }
    ```
  - [ ] 3.4 Column name conversion: `snake_case` → `camelCase` in TypeScript output
  - [ ] 3.5 Nullable columns: `columnName: string | null`

- [ ] Task 4: Create JSON Schema import utility (AC: #10)
  - [ ] 4.1 Create `src/utils/db-diagram-json-schema.ts`:
    ```typescript
    export function parseJsonSchema(schema: object): ParseResult
    ```
  - [ ] 4.2 Conversion rules:
    - Top-level `definitions` or `$defs` → each definition becomes a table
    - Object `properties` → columns
    - `type: "string"` → VARCHAR, `type: "integer"` → INT, `type: "number"` → FLOAT, `type: "boolean"` → BOOLEAN, `type: "array"` → JSON, `type: "object"` → JSON
    - `required` array → NOT NULL constraint
    - `$ref: "#/definitions/User"` → FK relationship to User table
    - Property named `id` or ending with `_id` → PK heuristic

- [ ] Task 5: Add import UI to DbDiagram component (AC: #1, #4, #5)
  - [ ] 5.1 Add "Import" dropdown button to toolbar with options: "From SQL", "From JSON Schema"
  - [ ] 5.2 "From SQL" opens a modal/panel with:
    - Dialect selector: `<SelectInput>` (PostgreSQL, MySQL, SQLite)
    - SQL text area: `<TextAreaInput>` with placeholder "Paste CREATE TABLE statements..."
    - "Replace existing" / "Merge with existing" toggle
    - "Import" button
    - Error display area (shows parsing errors if any)
  - [ ] 5.3 "From JSON Schema" opens a modal/panel with:
    - JSON text area: `<TextAreaInput>` with placeholder "Paste JSON Schema..."
    - "Replace existing" / "Merge with existing" toggle
    - "Import" button
  - [ ] 5.4 On successful import: call `fitView()` to center the new content

- [ ] Task 6: Add cross-tool export UI to DbDiagram component (AC: #6, #7, #8, #9)
  - [ ] 6.1 Add "Export" dropdown button to toolbar with options: "SQL" (existing from 27.2), "Mermaid", "TypeScript"
  - [ ] 6.2 Mermaid export panel: read-only output area + CopyButton + "Open in Mermaid Renderer" link button
  - [ ] 6.3 TypeScript export panel: read-only output area + CopyButton
  - [ ] 6.4 "Open in Mermaid Renderer" implementation:
    - Save Mermaid syntax to localStorage key `'csr-dev-tools-mermaid-renderer-prefill'`
    - Navigate to `/tools/mermaid-renderer` via TanStack Router
    - Mermaid Renderer checks for prefill key on mount, loads content if present, clears the key

- [ ] Task 7: Modify Mermaid Renderer for prefill support (AC: #7)
  - [ ] 7.1 In `src/components/feature/code/MermaidRenderer.tsx`:
    - On mount: check `localStorage.getItem('csr-dev-tools-mermaid-renderer-prefill')`
    - If present: set code to prefill value, clear the key, trigger render
    - If not present: use default code (existing behavior — no change)
  - [ ] 7.2 This is a minimal, non-breaking change — only adds a localStorage check on mount

- [ ] Task 8: Unit tests (AC: #1, #2, #3, #4, #6, #8, #10)
  - [ ] 8.1 Create `src/utils/db-diagram-import.spec.ts`:
    - Parses single CREATE TABLE with columns and types
    - Parses multiple CREATE TABLEs
    - Extracts PRIMARY KEY (inline and table-level)
    - Extracts FOREIGN KEY constraints and creates relationships
    - Detects 1:1 from FK + UNIQUE combination
    - Handles MySQL AUTO_INCREMENT syntax
    - Handles PostgreSQL SERIAL syntax
    - Handles SQLite AUTOINCREMENT syntax
    - Strips comments (-- and /* */)
    - Handles IF NOT EXISTS
    - Returns errors for malformed SQL (partial success)
    - Reverse-maps SQL types to ColumnType correctly
  - [ ] 8.2 Create `src/utils/db-diagram-mermaid.spec.ts`:
    - Generates valid Mermaid ER syntax
    - Maps relationship types to correct Mermaid notation
    - Handles tables with no relationships
    - Column constraints shown (PK, FK markers)
  - [ ] 8.3 Create `src/utils/db-diagram-typescript.spec.ts`:
    - Generates valid TypeScript type definitions
    - Maps SQL types to TS types correctly
    - Converts snake_case to camelCase
    - Nullable columns produce `| null` union
    - Handles tables with no columns (empty type)
  - [ ] 8.4 Create `src/utils/db-diagram-json-schema.spec.ts`:
    - Parses definitions/properties into tables/columns
    - Maps JSON Schema types to ColumnType
    - Detects $ref as FK relationship
    - Handles required array as NOT NULL
    - Handles missing or empty schema gracefully

- [ ] Task 9: E2E test additions (AC: #1, #2, #6, #8)
  - [ ] 9.1 Update `e2e/db-diagram.spec.ts`:
    - Can import SQL and see tables appear on canvas
    - Can export Mermaid and see valid output
    - Can export TypeScript and see valid output
    - Import SQL with errors shows partial results + error message

## Dev Notes

### Architecture & Patterns

- **This story builds on 27.1 and 27.2** — canvas, SQL export, and persistence are already implemented. This story adds import capabilities and cross-tool integration.
- **Custom DDL parser vs library:** Use a lightweight custom parser — NOT `node-sql-parser` (~150KB per dialect). We only need to parse `CREATE TABLE` statements, not full SQL. A regex + state machine approach handles this in ~200-300 lines and adds zero bundle weight.
- **Cross-tool handoff pattern:** Use localStorage as the communication channel between tools. This is a new pattern for the project — keep it simple: write a key, navigate, read and clear the key. No pub/sub, no events, no shared state.

### Critical Implementation Rules

1. **Custom parser, NOT external library** — `node-sql-parser` is 150KB+ per dialect. Our parser only needs CREATE TABLE support. Write a focused parser that handles the common patterns listed in Task 1.2. Edge cases in exotic SQL syntax are acceptable to skip — show a clear error for what can't be parsed.
2. **Partial success on import** — if 8 out of 10 CREATE TABLE statements parse successfully, import the 8 and show errors for the 2. Never fail the entire import because of one bad statement.
3. **Auto-layout is simple grid** — don't over-engineer layout algorithms. A 3-column grid with FK-aware ordering is sufficient. Users can drag to rearrange after import.
4. **Mermaid cross-tool handoff** — the ONLY change to MermaidRenderer is a localStorage check on mount. Do NOT add props, URL params, or shared state. Keep the coupling minimal.
5. **TypeScript export uses `type` not `interface`** — consistent with project convention (`type` over `interface` per oxlint rules).
6. **snake_case → camelCase conversion** — implement a simple `snakeToCamel(str: string): string` utility. Do NOT install a case conversion library.
7. **JSON Schema import is best-effort** — JSON Schema is complex. Support `definitions`/`$defs` with `properties`, `type`, `required`, and `$ref`. Skip advanced features (allOf, oneOf, anyOf, patternProperties). Show what can't be parsed as warnings.

### DDL Parser Design

The custom parser should use a simple state machine approach:
1. **Tokenize:** Split SQL into statements (split on `;`)
2. **Filter:** Keep only `CREATE TABLE` statements
3. **Parse table name:** Regex: `CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'\`]?(\w+)["'\`]?\s*\(`
4. **Parse column definitions:** Split body by commas, classify each as:
   - Column definition: `name TYPE [constraints...]`
   - Table constraint: `PRIMARY KEY (...)`, `FOREIGN KEY (...) REFERENCES ...`, `UNIQUE (...)`
5. **Extract types:** Regex match against known type patterns
6. **Build output:** Construct `DiagramSchema` tables and relationships

This approach is ~200-300 lines of code, zero dependencies, and handles 95% of real-world CREATE TABLE statements.

### Cross-Tool Integration Pattern

```
DB Diagram → localStorage → Mermaid Renderer
             key: 'csr-dev-tools-mermaid-renderer-prefill'
             value: generated Mermaid ER syntax string
             lifecycle: write → navigate → read → clear
```

This is intentionally one-directional and ephemeral. No bidirectional sync, no persistent link between tools.

### What This Story Does NOT Include

- **NO real-time collaboration** — strictly local-first
- **NO ALTER TABLE / DROP TABLE import** — only CREATE TABLE
- **NO view/index/trigger import** — only tables and FKs
- **NO bidirectional cross-tool sync** — one-shot handoff only

### Project Structure Notes

**New files created in this story:**
```
src/utils/
  db-diagram-import.ts          — SQL DDL parser
  db-diagram-import.spec.ts     — Parser tests
  db-diagram-mermaid.ts         — Mermaid ER export
  db-diagram-mermaid.spec.ts    — Mermaid tests
  db-diagram-typescript.ts      — TypeScript interface export
  db-diagram-typescript.spec.ts — TypeScript tests
  db-diagram-json-schema.ts     — JSON Schema import
  db-diagram-json-schema.spec.ts — JSON Schema tests
```

**Files modified:**
```
src/components/feature/data/db-diagram/DbDiagram.tsx  — Add import/export UI panels
src/components/feature/code/MermaidRenderer.tsx        — Add localStorage prefill check on mount
```

### Previous Story Intelligence (27.1 + 27.2)

- **DiagramSchema type** defined in `src/types/utils/db-diagram.ts` — use it for all import/export functions
- **SqlDialect type** added in 27.2 — reuse for import dialect selection
- **Serialization functions** in `src/utils/db-diagram-persistence.ts` — reuse `deserializeDiagram` for converting parsed SQL into canvas state
- **SQL export panel** added in 27.2 — extend the export dropdown to include Mermaid and TypeScript options alongside existing SQL export
- **Toolbar structure** established in 27.1/27.2 — add Import dropdown alongside existing Export dropdown
- **`validateDiagramSchema`** from 27.2 — reuse for JSON import validation
- **Auto-layout:** after import, call `fitView()` (from `useReactFlow()`) to center content

### References

- [Source: _bmad-output/implementation-artifacts/27-1-db-diagram-canvas-and-entities.md] — Canvas component structure, types
- [Source: _bmad-output/implementation-artifacts/27-2-db-diagram-sql-export-and-persistence.md] — SQL export, persistence, serialization
- [Source: src/components/feature/code/MermaidRenderer.tsx] — Target for prefill modification
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — Toast pattern, error handling

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
