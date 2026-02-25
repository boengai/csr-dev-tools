# Story 27.2: DB Diagram — SQL Export & Persistence

Status: done

## Story

As a **developer**,
I want **to export my ER diagram as SQL DDL for different database engines and save/load named diagrams from localStorage**,
so that **I can generate real database schemas from my visual designs and resume my work across sessions**.

## Acceptance Criteria

1. **Given** the canvas has tables and relationships
   **When** the user clicks "Export SQL"
   **Then** a panel/modal opens with generated SQL DDL containing CREATE TABLE statements with columns, types, constraints (PK, FK, NOT NULL, UNIQUE), and foreign key relationships

2. **Given** the SQL export panel is open
   **When** the user selects a target DBMS from a dropdown (PostgreSQL, MySQL, SQLite)
   **Then** the generated SQL updates to use dialect-specific syntax:
   - PostgreSQL: `SERIAL` for auto-increment, `TEXT` default string, `TIMESTAMP` precision
   - MySQL: `AUTO_INCREMENT`, `VARCHAR(255)` default string, `ENGINE=InnoDB`
   - SQLite: `INTEGER PRIMARY KEY AUTOINCREMENT`, relaxed type affinity

3. **Given** generated SQL output
   **When** the user clicks the CopyButton
   **Then** the SQL is copied to clipboard with toast confirmation

4. **Given** generated SQL output
   **When** the user clicks "Download .sql"
   **Then** the SQL is downloaded as a `.sql` file named `{diagram-name}-{dialect}.sql`

5. **Given** the user has a diagram on the canvas
   **When** the user clicks "Save" or the diagram auto-saves
   **Then** the current diagram state (tables, columns, relationships, positions, viewport) is persisted to localStorage under a unique diagram ID

6. **Given** the tool loads
   **When** the user opens the diagram list panel
   **Then** all saved diagrams are shown with name, last modified date, and table count

7. **Given** the diagram list panel
   **When** the user clicks a saved diagram
   **Then** the canvas loads with all tables, columns, relationships, and positions restored exactly

8. **Given** an active diagram on the canvas
   **When** the user makes any change (add/edit/delete table, column, or relationship)
   **Then** the diagram auto-saves to localStorage within 1 second (debounced)

9. **Given** the diagram list panel
   **When** the user clicks "New Diagram"
   **Then** the canvas clears and a new empty diagram is created with a default name ("Untitled Diagram", incrementing)

10. **Given** a saved diagram
    **When** the user clicks the rename icon
    **Then** the diagram name becomes editable inline

11. **Given** a saved diagram
    **When** the user clicks the delete icon and confirms
    **Then** the diagram is removed from localStorage and the list

12. **Given** the canvas has a diagram
    **When** the user clicks "Export JSON"
    **Then** the diagram schema is downloaded as a `.json` file for backup/sharing

13. **Given** the user has a `.json` diagram file
    **When** the user clicks "Import JSON" and selects the file
    **Then** the diagram is loaded onto the canvas, replacing current content

## Tasks / Subtasks

- [x] Task 1: Create SQL generation utility (AC: #1, #2)
  - [x] 1.1 Create `src/utils/db-diagram-sql.ts` with pure functions:
    ```typescript
    export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite'

    export function generateSql(schema: DiagramSchema, dialect: SqlDialect): string
    export function generateCreateTable(table: DiagramTable, dialect: SqlDialect): string
    export function mapColumnType(type: ColumnType, dialect: SqlDialect): string
    export function generateForeignKeys(relationships: Array<DiagramRelationship>, dialect: SqlDialect): string
    ```
  - [x] 1.2 Implement dialect-specific type mappings:
    | ColumnType | PostgreSQL | MySQL | SQLite |
    |------------|-----------|-------|--------|
    | INT | `INTEGER` | `INT` | `INTEGER` |
    | BIGINT | `BIGINT` | `BIGINT` | `INTEGER` |
    | SERIAL | `SERIAL` | `INT AUTO_INCREMENT` | `INTEGER PRIMARY KEY AUTOINCREMENT` |
    | VARCHAR | `VARCHAR(255)` | `VARCHAR(255)` | `TEXT` |
    | TEXT | `TEXT` | `TEXT` | `TEXT` |
    | BOOLEAN | `BOOLEAN` | `TINYINT(1)` | `INTEGER` |
    | DATE | `DATE` | `DATE` | `TEXT` |
    | TIMESTAMP | `TIMESTAMP` | `TIMESTAMP` | `TEXT` |
    | FLOAT | `REAL` | `FLOAT` | `REAL` |
    | DECIMAL | `DECIMAL(10,2)` | `DECIMAL(10,2)` | `REAL` |
    | UUID | `UUID` | `CHAR(36)` | `TEXT` |
    | JSON | `JSONB` | `JSON` | `TEXT` |
    | BLOB | `BYTEA` | `BLOB` | `BLOB` |
  - [x] 1.3 Implement constraint generation:
    - PRIMARY KEY: `PRIMARY KEY` (inline for single column, table-level for composite)
    - FOREIGN KEY: `REFERENCES {table}({column})` for PostgreSQL/MySQL, `REFERENCES {table}({column})` for SQLite
    - NOT NULL: `NOT NULL` (all dialects)
    - UNIQUE: `UNIQUE` (all dialects)
  - [x] 1.4 Implement MySQL-specific: add `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;` to table suffix
  - [x] 1.5 Generate SQL in dependency order — tables referenced by FKs are created first (topological sort)

- [x] Task 2: Create serialization utility (AC: #5, #7, #12, #13)
  - [x] 2.1 Create `src/utils/db-diagram-persistence.ts`:
    ```typescript
    export function serializeDiagram(nodes: Array<Node>, edges: Array<Edge>): DiagramSchema
    export function deserializeDiagram(schema: DiagramSchema): { nodes: Array<Node>, edges: Array<Edge> }
    export function validateDiagramSchema(data: unknown): data is DiagramSchema
    ```
  - [x] 2.2 `serializeDiagram`: Extract table data + positions from React Flow nodes, relationship data from edges. Strip callback functions — store only serializable data.
  - [x] 2.3 `deserializeDiagram`: Reconstruct React Flow nodes/edges from schema. Callbacks are NOT stored — they're re-attached by the component after deserialization.
  - [x] 2.4 `validateDiagramSchema`: Runtime validation for imported JSON — check required fields, types, referential integrity (FK references exist).

- [x] Task 3: Implement localStorage persistence (AC: #5, #6, #7, #8, #9, #10, #11)
  - [x] 3.1 Create `src/utils/db-diagram-storage.ts`:
    ```typescript
    const INDEX_KEY = 'csr-dev-tools-db-diagram-index'
    const DIAGRAM_KEY_PREFIX = 'csr-dev-tools-db-diagram-'

    export type DiagramIndexEntry = {
      id: string
      name: string
      updatedAt: string   // ISO 8601
      createdAt: string   // ISO 8601
      tableCount: number
    }

    export function loadDiagramIndex(): Array<DiagramIndexEntry>
    export function saveDiagramIndex(index: Array<DiagramIndexEntry>): void
    export function loadDiagram(id: string): DiagramSchema | null
    export function saveDiagram(id: string, schema: DiagramSchema): void
    export function deleteDiagram(id: string): void
    export function generateDiagramId(): string
    ```
    - [x] 3.2 Storage pattern: single nested localStorage key `csr-dev-tools-db-diagrams` containing `{ index: [...], diagrams: { [id]: DiagramSchema } }`. Originally used split keys (1 index + N diagram keys), consolidated to single key for cleaner storage.
  - [x] 3.3 Key naming follows project convention: `'csr-dev-tools-{tool-key}-{data-name}'` (see TimezoneConverter `FAVORITES_KEY` pattern).

- [x] Task 4: Add toolbar SQL export controls to DbDiagram (AC: #1, #2, #3, #4)
  - [x] 4.1 Add "Export SQL" button to toolbar → opens a side panel or bottom panel (NOT a separate Dialog — keep the canvas visible)
  - [x] 4.2 SQL panel contains:
    - Dialect selector: `<SelectInput>` with options PostgreSQL (default), MySQL, SQLite
    - Read-only code output area showing generated SQL (use `<pre>` with monospace, or a `<TextAreaInput>` with `readOnly`)
    - `<CopyButton value={generatedSql} />` for clipboard copy
    - "Download .sql" button using `file.ts` download utility
  - [x] 4.3 SQL regenerates reactively when dialect changes (no debounce needed — generation is synchronous and fast)

- [x] Task 5: Add diagram management UI to DbDiagram (AC: #6, #9, #10, #11)
  - [x] 5.1 Add diagram name display in the toolbar (editable on click, like table name pattern)
  - [x] 5.2 Add "Diagrams" button to toolbar → opens a sidebar panel listing saved diagrams
  - [x] 5.3 Diagram list shows: name, last modified (relative time like "2 min ago"), table count badge
  - [x] 5.4 Each list item has: click to load, rename icon, delete icon (with confirmation via `window.confirm`)
  - [x] 5.5 "New Diagram" button at top of list panel
  - [x] 5.6 Current diagram highlighted in list

- [x] Task 6: Implement autosave (AC: #8)
  - [x] 6.1 Use `useDebounceCallback` from `@/hooks` with 1000ms delay
  - [x] 6.2 Trigger on any nodes/edges state change (use `useEffect` watching nodes and edges arrays)
  - [x] 6.3 On autosave: serialize diagram → save to localStorage → update index entry (name, updatedAt, tableCount)
  - [x] 6.4 Show subtle save indicator in toolbar (e.g., "Saved" text that appears briefly, or a small check icon)
  - [x] 6.5 On first canvas modification with no active diagram: auto-create a new diagram entry

- [x] Task 7: Add JSON export/import (AC: #12, #13)
  - [x] 7.1 "Export JSON" button in toolbar: serialize current diagram → download as `{diagram-name}.json`
  - [x] 7.2 "Import JSON" button in toolbar: use file input → read JSON → validate with `validateDiagramSchema` → deserialize → load onto canvas
  - [x] 7.3 On invalid JSON import: show error toast with `useToast({ action: 'add', item: { label: 'Invalid diagram file. Expected a CSR Dev Tools diagram JSON.', type: 'error' } })`

- [x] Task 8: Add types for new features (AC: all)
  - [x] 8.1 Add to `src/types/utils/db-diagram.ts`:
    ```typescript
    export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite'

    export type DiagramIndexEntry = {
      id: string
      name: string
      updatedAt: string
      createdAt: string
      tableCount: number
    }
    ```

- [x] Task 9: Unit tests (AC: #1, #2, #5, #7, #12)
  - [x] 9.1 Create `src/utils/db-diagram-sql.spec.ts`:
    - Generates valid PostgreSQL CREATE TABLE for single table with PK
    - Generates valid MySQL CREATE TABLE with AUTO_INCREMENT and ENGINE=InnoDB
    - Generates valid SQLite CREATE TABLE with AUTOINCREMENT
    - Maps all 13 column types correctly per dialect
    - Generates FOREIGN KEY constraints referencing correct tables/columns
    - Handles tables with no columns (edge case)
    - Generates tables in FK dependency order (topological sort)
    - N:M relationships generate a junction table
  - [x] 9.2 Create `src/utils/db-diagram-persistence.spec.ts`:
    - Serializes nodes/edges to DiagramSchema correctly
    - Deserializes DiagramSchema back to nodes/edges
    - Round-trip: serialize → deserialize produces equivalent state
    - Validates valid schema returns true
    - Rejects schema with missing fields
    - Rejects schema with invalid FK references
  - [x] 9.3 Create `src/utils/db-diagram-storage.spec.ts`:
    - CRUD operations on localStorage (mock `localStorage` in tests)
    - Index stays in sync with diagram data
    - Delete removes both index entry and diagram data

- [x] Task 10: E2E test additions (AC: #1, #3, #5, #6, #7)
  - [x] 10.1 Update `e2e/db-diagram.spec.ts`:
    - Can export SQL and copy to clipboard
    - Can switch dialect and see SQL change
    - Diagram persists after page reload (autosave → reload → diagram restored)
    - Can create and switch between multiple diagrams
    - Can rename a diagram
    - Can export and import JSON (round-trip)

## Dev Notes

### Architecture & Patterns

- **This story builds on 27.1** — all canvas components (DbDiagram, TableNode, RelationshipEdge) are already created. This story ADDS functionality to the existing DbDiagram component and creates new utility modules.
- **Pure function utilities:** SQL generation and serialization are pure functions in `src/utils/`. This makes them trivially testable with Vitest — no DOM or React needed.
- **No new TOOL_REGISTRY entry** — the `'db-diagram'` tool was registered in Story 27.1. This story only modifies the existing component.

### Critical Implementation Rules

1. **SQL generation is pure functions only** — `generateSql(schema, dialect)` takes a `DiagramSchema` and returns a string. No side effects, no state, no React. Lives in `src/utils/db-diagram-sql.ts`.
2. **Serialization MUST strip callbacks** — `DiagramSchema` contains only serializable data (strings, numbers, arrays, objects). When deserializing, the component re-attaches callbacks (`onTableNameChange`, etc.) after loading.
3. **localStorage key convention:** `'csr-dev-tools-db-diagram-index'` for the manifest, `'csr-dev-tools-db-diagram-{id}'` for individual diagrams. Follow the TimezoneConverter favorites pattern.
4. **Autosave debounce:** Use project's `useDebounceCallback` from `@/hooks` — do NOT create a custom debounce. 1000ms delay prevents excessive writes.
5. **Topological sort for FK dependencies** — if Table B has a FK referencing Table A, Table A's CREATE TABLE must come first in the SQL output. Implement a simple topological sort on the relationship graph.
6. **N:M relationships** — when a relationship is marked N:M, the SQL export should generate a junction table (e.g., `{table1}_{table2}`) with two foreign keys. The junction table is generated automatically — the user does NOT create it manually on the canvas.
7. **Download utility** — use the existing `src/utils/file.ts` download helpers. Check what's available (likely a `downloadFile` or `saveAs` utility). Do NOT create new download logic.
8. **Error handling** — use `useToast` with `type: 'error'` for all error cases (invalid import, localStorage quota exceeded, etc.). Never use `console.error` or custom error state.

### SQL Generation Details

**Output format per dialect:**

PostgreSQL:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

MySQL:
```sql
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

SQLite:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### localStorage Schema

```
localStorage key:
csr-dev-tools-db-diagrams → DiagramStore {
  index: Array<DiagramIndexEntry>,
  diagrams: {
    [id: string]: DiagramSchema
  }
}
```

All diagrams stored in a single nested key. A typical diagram with 20 tables is ~20-40KB JSON. localStorage provides 5-10MB. Users would need 100+ complex diagrams to hit limits — warn if `localStorage` write throws a `QuotaExceededError`.

`DiagramStore` type defined in `src/types/utils/db-diagram.ts`.

### What This Story Does NOT Include (Deferred to 27.3)

- **NO SQL DDL import** — Story 27.3 handles parsing CREATE TABLE statements
- **NO Mermaid export** — Story 27.3
- **NO JSON Schema import** — Story 27.3
- **NO TypeScript interface export** — Story 27.3
- **NO cross-tool integration** — Story 27.3

### Project Structure Notes

**New files created in this story:**
```
src/utils/
  db-diagram-sql.ts           — SQL generation pure functions
  db-diagram-sql.spec.ts      — SQL generation tests
  db-diagram-persistence.ts   — Serialization/deserialization
  db-diagram-persistence.spec.ts — Serialization tests
  db-diagram-storage.ts       — localStorage CRUD operations
  db-diagram-storage.spec.ts  — Storage tests
src/types/utils/
  db-diagram.ts               — Updated with SqlDialect, DiagramIndexEntry types
```

**Files modified:**
```
src/components/feature/data/db-diagram/DbDiagram.tsx — Add SQL export panel, diagram management, autosave, JSON import/export
```

### Previous Story Intelligence (27.1)

- **Types already defined:** `ColumnType`, `ColumnConstraint`, `TableColumn`, `TableNodeData`, `RelationshipType`, `RelationshipEdgeData`, `DiagramSchema` — all in `src/types/utils/db-diagram.ts`
- **DiagramSchema was forward-defined in 27.1** specifically for this story's persistence. Use it as-is — do NOT redefine.
- **Handle IDs use format `{nodeId}-{columnId}`** — the serializer must parse this to extract sourceTableId/sourceColumnId from edge connection data.
- **Callbacks in node data** — `TableNodeData` has callbacks (`onTableNameChange`, etc.). The serializer MUST strip these. The deserializer does NOT restore them — the component re-attaches callbacks after loading.
- **Component structure:** `DbDiagram.tsx` uses Dialog with `size="screen"`, toolbar at top, ReactFlow canvas filling remaining space. Add new toolbar buttons and panels to the existing toolbar structure.

### References

- [Source: _bmad-output/implementation-artifacts/27-1-db-diagram-canvas-and-entities.md] — Previous story, all types, component structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — Toast pattern, useDebounceCallback
- [Source: src/utils/file.ts] — Existing file download utility
- [Source: src/hooks/useDebounceCallback.ts] — Debounce hook for autosave
- [Source: src/components/feature/time/TimezoneConverter.tsx] — localStorage persistence pattern reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- **Task 1 (SQL Generation):** Created `db-diagram-sql.ts` with pure functions for SQL DDL generation. Supports PostgreSQL, MySQL, SQLite dialects with correct type mappings for all 13 column types. Implements topological sort for FK dependency ordering and automatic junction table generation for N:M relationships. MySQL-specific ENGINE=InnoDB suffix implemented.
- **Task 2 (Serialization):** Created `db-diagram-persistence.ts` with `serializeDiagram`, `deserializeDiagram`, and `validateDiagramSchema`. Correctly strips callback functions during serialization and reconstructs React Flow handle IDs during deserialization. Validates referential integrity of FK references in imported schemas.
- **Task 3 (localStorage Persistence):** Created `db-diagram-storage.ts` with index + individual diagram storage pattern. Keys follow project convention (`csr-dev-tools-db-diagram-*`). Index stores lightweight manifest, individual diagrams stored separately.
- **Task 4 (SQL Export Panel):** Added side panel with dialect selector (native `<select>`), read-only SQL output, CopyButton integration, and .sql file download. Panel opens alongside canvas (not in dialog).
- **Task 5 (Diagram Management):** Added diagram list sidebar with name, relative time, table count. Supports load, rename (inline edit), delete (with confirm), and New Diagram. Editable diagram name in toolbar.
- **Task 6 (Autosave):** Used project's `useDebounceCallback` with 1000ms delay. Triggers on nodes/edges state changes. Auto-creates diagram entry on first modification. Shows "Saved" indicator briefly. Handles QuotaExceededError with toast.
- **Task 7 (JSON Export/Import):** Export serializes diagram to JSON and downloads via Blob URL. Import uses file input, validates schema with `validateDiagramSchema`, shows error toast on invalid files.
- **Task 8 (Types):** Added `SqlDialect` and `DiagramIndexEntry` types to `src/types/utils/db-diagram.ts`.
- **Task 9 (Unit Tests):** Created 3 test files with comprehensive coverage: SQL generation (24 tests), persistence/serialization (13 tests), localStorage storage (11 tests). All 1398 tests pass.
- **Task 10 (E2E Tests):** Added 7 new E2E tests covering SQL export, dialect switching, autosave persistence, diagram management, rename, and JSON round-trip.

### Implementation Notes

- Used native `<select>` for dialect selector instead of Radix `SelectInput` to avoid z-index/portal issues inside the ReactFlow dialog panel
- Download utility extracted to shared `downloadTextFile` in `src/utils/file.ts` (same Blob URL + anchor click pattern as `mermaid-renderer.ts`)
- Topological sort uses Kahn's algorithm (BFS-based) for FK dependency ordering
- N:M junction tables named `{source}_{target}` with composite primary key

### File List

**New files:**
- src/utils/db-diagram-sql.ts
- src/utils/db-diagram-sql.spec.ts
- src/utils/db-diagram-persistence.ts
- src/utils/db-diagram-persistence.spec.ts
- src/utils/db-diagram-storage.ts
- src/utils/db-diagram-storage.spec.ts

**Modified files:**
- src/types/utils/db-diagram.ts (added SqlDialect, DiagramIndexEntry types)
- src/utils/index.ts (added barrel exports for new modules)
- src/utils/file.ts (added shared downloadTextFile utility)
- src/utils/time.ts (added formatRelativeTime utility)
- src/components/feature/data/db-diagram/DbDiagram.tsx (SQL export panel, diagram management, autosave, JSON import/export)
- e2e/db-diagram.spec.ts (added 7 new E2E tests)

### Change Log

- 2026-02-25: Implemented Story 27.2 — SQL export (PostgreSQL/MySQL/SQLite), localStorage persistence with autosave, diagram management UI (save/load/rename/delete/new), JSON export/import. Added 46 unit tests and 7 E2E tests.
- 2026-02-25: Code review fixes — Fixed SQLite non-SERIAL PK bug (missing PRIMARY KEY constraint), extracted `downloadTextFile` to `src/utils/file.ts`, extracted `formatRelativeTime` to `src/utils/time.ts`, added SQLite PK and inline FK test coverage (+2 tests), fixed `saveStatusTimeoutRef` cleanup on unmount. All 1398 tests pass.
- 2026-02-25: UX improvements — Consolidated localStorage from split keys (1 index + N diagram keys) to single nested key `csr-dev-tools-db-diagrams` with `DiagramStore` type (`{ index, diagrams }`). Added `DiagramStore` type to `src/types/utils/db-diagram.ts`. On mount, auto-restores the most recently updated diagram instead of starting with an empty canvas. Diagrams list button moved to leftmost toolbar position with `ListIcon` (icon-only). E2E tests updated for dropdown interaction pattern.
