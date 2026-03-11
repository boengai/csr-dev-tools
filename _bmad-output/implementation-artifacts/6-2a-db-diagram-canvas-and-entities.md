# Story 27.1: DB Diagram — Canvas, Table Entities & Relationships

Status: done

## Story

As a **developer**,
I want **to visually create entity-relationship diagrams by adding table nodes, defining columns, and drawing relationships on an interactive canvas**,
so that **I can design and visualize database schemas directly in CSR Dev Tools without leaving my toolbox**.

## Acceptance Criteria

1. **Given** the tool loads
   **When** the canvas initializes
   **Then** an empty canvas is displayed with pan/zoom controls, a minimap, and a dotted grid background

2. **Given** the user clicks "Add Table"
   **When** the button is clicked
   **Then** a new table node appears on the canvas with a default name ("table_1", incrementing) and one default `id` column (type: INT, PK: true)

3. **Given** a table node on the canvas
   **When** the user clicks the table name
   **Then** the name becomes editable inline (press Enter or blur to confirm)

4. **Given** a table node on the canvas
   **When** the user clicks "Add Column" on the node
   **Then** a new column row is added with editable name, type dropdown, and toggles for PK/FK/Nullable/Unique

5. **Given** column type selection
   **When** the user opens the type dropdown
   **Then** common SQL types are available: INT, BIGINT, SERIAL, VARCHAR, TEXT, BOOLEAN, DATE, TIMESTAMP, FLOAT, DECIMAL, UUID, JSON, BLOB

6. **Given** two table nodes on the canvas
   **When** the user drags from a source column handle to a target column handle
   **Then** a relationship edge is created between the two columns with a default "1:N" cardinality label

7. **Given** a relationship edge exists
   **When** the user clicks the edge cardinality label
   **Then** a dropdown allows selecting: 1:1, 1:N, N:M

8. **Given** a table node or column
   **When** the user clicks a delete button (X icon)
   **Then** the item is removed (with connected edges also removed for deleted columns)

9. **Given** the canvas has tables and relationships
   **When** the user interacts with the canvas
   **Then** standard interactions work: pan (drag empty space), zoom (scroll/pinch), select (click node), multi-select (shift+click), delete selected (Delete key)

10. **Given** the canvas has content
    **When** the user clicks "Fit View"
    **Then** the viewport adjusts to show all nodes

## Tasks / Subtasks

- [x] Task 1: Install @xyflow/react and set up foundation (AC: #1)
  - [x] 1.1 Install `@xyflow/react` package
  - [x] 1.2 Add `'db-diagram'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [x] 1.3 Add registry entry to `TOOL_REGISTRY` in `src/constants/tool-registry.ts`
  - [x] 1.4 Create `src/components/feature/data/db-diagram/` directory structure

- [x] Task 2: Define types (AC: all)
  - [x] 2.1 Create `src/types/utils/db-diagram.ts`
  - [x] 2.2 Export from barrel: add `export * from './db-diagram'` to `src/types/utils/index.ts`

- [x] Task 3: Create TableNode custom node component (AC: #2, #3, #4, #5, #8)
  - [x] 3.1 Create `src/components/feature/data/db-diagram/TableNode.tsx`
  - [x] 3.2 Define `nodeTypes` object outside component: `{ tableNode: TableNodeComponent }`

- [x] Task 4: Create RelationshipEdge custom edge component (AC: #6, #7)
  - [x] 4.1 Create `src/components/feature/data/db-diagram/RelationshipEdge.tsx`
  - [x] 4.2 Define `edgeTypes` object outside component: `{ relationship: RelationshipEdgeComponent }`

- [x] Task 5: Create main DbDiagram component (AC: #1, #2, #6, #9, #10)
  - [x] 5.1 Create `src/components/feature/data/db-diagram/DbDiagram.tsx`
  - [x] 5.2 Implement `onConnect` callback
  - [x] 5.3 Implement table CRUD operations
  - [x] 5.4 Implement relationship cardinality change via CustomEvent
  - [x] 5.5 ReactFlow container sizing with flex layout

- [x] Task 6: Create barrel export and index (AC: all)
  - [x] 6.1 Create `src/components/feature/data/db-diagram/index.ts` exporting `DbDiagram`
  - [x] 6.2 Update `src/components/feature/data/index.ts` to include db-diagram export

- [x] Task 7: Import React Flow CSS (AC: #1)
  - [x] 7.1 Import `@xyflow/react/dist/style.css` in the DbDiagram component file

- [x] Task 8: Unit tests (AC: all)
  - [x] 8.1 Create `src/utils/db-diagram.spec.ts` with 8 tests for generateId, createDefaultColumn, createDefaultTable
  - [x] 8.2 React Flow canvas interactions covered by E2E

- [x] Task 9: E2E test (AC: #1, #2, #3, #4, #8)
  - [x] 9.1 Create `e2e/db-diagram.spec.ts` with 6 tests
  - [x] 9.2 Add `data-testid` attributes to key interactive elements

## Dev Notes

### Architecture & Patterns

- **Category:** `'Data'` — alongside JSON/YAML/CSV converters
- **Dialog pattern:** Use the CssAnimationBuilder pattern — button on card opens full-screen Dialog. This tool NEEDS full screen for canvas interaction.
- **ReactFlow dark mode:** Set `colorMode="dark"` on `<ReactFlow>` component. Override CSS variables if needed to match OKLCH dark theme.
- **No shared ToolLayout:** Each tool owns its layout. DbDiagram renders its own structure inside Dialog.

### Critical Implementation Rules

1. **Define `nodeTypes` and `edgeTypes` OUTSIDE the component** — React Flow re-mounts nodes on every render if these objects change reference. This is the #1 React Flow performance footgun.
2. **Import React Flow CSS in the component file**, not globally — keeps it scoped to the lazy-loaded chunk per NFR8 (no bundle bloat).
3. **Use `useNodesState` and `useEdgesState`** from @xyflow/react — these are optimized hooks that handle immutable updates correctly. Do NOT use plain useState for nodes/edges.
4. **Handle IDs must be unique per node** — use `columnId` as the handle ID. Format: `{nodeId}-{columnId}` for global uniqueness in `sourceHandle`/`targetHandle` connection params.
5. **Each column needs BOTH source and target handles** — left side = target (receives FK), right side = source (creates FK reference). This allows bidirectional relationship drawing.
6. **ReactFlow parent container MUST have explicit dimensions** — `<ReactFlow>` renders nothing if its parent has `height: auto`. Use `flex-1` inside a flex column with defined height. Inside the `size="screen"` Dialog, this means `<div className="flex h-full flex-col">`.
7. **Use `useReactFlow()` for viewport operations** — `screenToFlowPosition()` for placing new nodes at viewport center, `fitView()` for fit-view button. This hook must be called inside a component wrapped by `<ReactFlow>` or `<ReactFlowProvider>`.
8. **Do NOT store callbacks in edge `data`** — unlike node `data` (where callbacks are standard), edge `data` is diffed by reference and causes stale closures. Handle cardinality changes by passing `setEdges` to the edge component via React context or by having the edge dispatch a custom event.
9. **Use existing `XIcon` from `@/components/common/icon`** for all delete buttons — do NOT create new close/delete SVGs.

### Library Details

- **Package:** `@xyflow/react` (v12.x, MIT license, React 19 compatible)
- **Install:** `pnpm add @xyflow/react`
- **Key imports:**
  ```typescript
  import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    addEdge,
  } from '@xyflow/react'
  import type { Node, Edge, Connection, NodeTypes, EdgeTypes } from '@xyflow/react'
  ```
- **Bundle:** ~56KB gzipped, tree-shakeable. Lazy-loaded via registry — zero impact on initial load.
- **CSS:** `import '@xyflow/react/dist/style.css'` — required for layout/controls to work.

### Styling Guidance

- TableNode card: Use `tv()` with dark background matching project Card component (`bg-gray-900 border border-gray-700 rounded-lg`)
- Table header: `bg-gray-800` with table name and emoji icon
- Column rows: `bg-gray-900` with subtle separator borders (`border-b border-gray-800`)
- Constraint toggles: Small pill buttons — `PK` (yellow when active), `FK` (blue), `NN` for not-null (red), `UQ` (green)
- Type dropdown: Use project's `SelectInput` component or a minimal inline select
- Edge color: `stroke-gray-500`, hover: `stroke-blue-500`
- MiniMap: positioned bottom-right, dark theme
- Controls: positioned bottom-left

### What This Story Does NOT Include (Deferred to 27.2 and 27.3)

- **NO localStorage persistence** — Story 27.2 handles saving/loading diagrams
- **NO SQL export** — Story 27.2 handles SQL generation
- **NO SQL import** — Story 27.3 handles DDL parsing
- **NO JSON export/import** — Story 27.2/27.3
- **NO Mermaid export** — Story 27.3
- **NO cross-tool integration** — Story 27.3

This story focuses ONLY on the interactive canvas experience: creating tables, editing columns, drawing relationships.

### Project Structure Notes

**Subdirectory pattern:** This tool uses a `db-diagram/` subdirectory under `feature/data/` because it requires multiple component files (TableNode, RelationshipEdge, DbDiagram). This follows the precedent of `src/components/feature/image/input/` which also uses a subdirectory for input sub-components. Single-file tools should NOT adopt this pattern — it's only for multi-component tools.

```
src/components/feature/data/
  db-diagram/
    DbDiagram.tsx          — Main component (named export, receives ToolComponentProps)
    TableNode.tsx           — Custom React Flow node for table entities
    RelationshipEdge.tsx    — Custom React Flow edge for relationships
    index.ts               — Barrel export: export { DbDiagram } from './DbDiagram'
src/utils/
  db-diagram.ts            — Pure helper functions (createDefaultTable, createDefaultColumn, generateId)
  db-diagram.spec.ts       — Unit tests for helpers
src/types/utils/
  db-diagram.ts            — All types (follows crop.ts, diff.ts, image.ts pattern)
e2e/
  db-diagram.spec.ts       — E2E tests
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Tool registry pattern, naming conventions, component structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Dialog pattern, lazy loading, Zustand stores
- [Source: src/constants/tool-registry.ts] — Registry entry format and lazy import pattern
- [Source: src/components/feature/css/CssAnimationBuilder.tsx] — Dialog full-screen pattern reference
- [Source: src/components/feature/code/MermaidRenderer.tsx] — External library lazy-loading pattern reference
- [Source: @xyflow/react docs] — Custom nodes, custom edges, handles, dark mode

### Previous Epic Intelligence

- **Epic 26 pattern:** Recent tools (Timezone Converter, Mermaid Renderer, IP Subnet Calculator) all follow the established pattern cleanly. No architectural surprises.
- **Mermaid Renderer (26.2):** Best reference for external library integration — singleton init pattern, loading skeleton, debounced rendering.
- **CSS Animation Builder (20.3):** Best reference for full-screen Dialog canvas tool.
- **CSS Grid Playground (18.3):** Another complex interactive tool with grid-based visual editing — good reference for interactive visual tools.

### Git Intelligence

Recent commits show consistent patterns:
- Commit format: `{emoji} {Tool Name} + 🔍 code review fixes (Story X.Y)`
- All tools follow TOOL_REGISTRY + component + types + barrel pattern without exception
- No regressions introduced in recent epics — patterns are stable

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed Tailwind v4 important syntax: `!class` -> `class!` for Handle styling
- Fixed TypeScript `addEdge` return type mismatch: cast `addEdge()` result to `Array<RelationshipEdge>`
- Removed unused `sourceHandleId`/`targetHandleId` props from RelationshipEdgeComponent
- Added explicit `import { describe, expect, it } from 'vitest'` to spec file (required for `tsc -b`)
- E2E tests: adapted for `autoOpen` behavior where Dialog opens immediately, making content behind `aria-hidden`

### Completion Notes List

- Installed `@xyflow/react` v12.10.1
- Created full DB Diagram tool with interactive canvas: add/edit/delete tables, add/edit/delete columns, draw relationships, change cardinality
- TableNode supports inline name editing, column type dropdown (13 SQL types), constraint toggles (PK/FK/NN/UQ)
- RelationshipEdge uses CustomEvent for cardinality changes (avoids stale closures per dev notes rule #8)
- `nodeTypes` and `edgeTypes` defined outside components (per dev notes rule #1)
- ReactFlow CSS imported in component file, not globally (per dev notes rule #2)
- All 1350 unit tests pass (8 new db-diagram tests), 0 regressions
- All 6 E2E tests pass (canvas, add table, edit name, add columns, delete table, responsive)
- Build succeeds with no TypeScript errors
- Lint passes with 0 errors (only pre-existing warnings)

### Change Log

- 2026-02-25: Story 27.1 implemented — DB Diagram canvas with table entities and relationships
- 2026-02-25: Code review fixes — formatting (oxfmt), type field ordering, placeholder callback clarity, data-testid on edge labels, corrected E2E AC coverage claim
- 2026-02-25: UX improvements — Toolbar buttons replaced with `<Button />` component (primary/default variants, small size). Relationship edge lines changed from gray (`#6b7280`) to primary color (`var(--color-primary)`). Relationship labels changed to black bg + white text. New table spawn positions now cascade diagonally (30px offset per table) instead of stacking at canvas center. Clear All button now shows confirmation dialog before clearing.

### File List

New files:
- src/components/feature/data/db-diagram/DbDiagram.tsx
- src/components/feature/data/db-diagram/TableNode.tsx
- src/components/feature/data/db-diagram/RelationshipEdge.tsx
- src/components/feature/data/db-diagram/index.ts
- src/types/utils/db-diagram.ts
- src/utils/db-diagram.ts
- src/utils/db-diagram.spec.ts
- e2e/db-diagram.spec.ts

Modified files:
- src/constants/tool-registry.ts (added db-diagram registry entry)
- src/types/constants/tool-registry.ts (added 'db-diagram' to ToolRegistryKey union)
- src/types/utils/index.ts (added db-diagram barrel export)
- src/utils/index.ts (added db-diagram barrel export)
- src/components/feature/data/index.ts (added db-diagram barrel export)
- package.json (added @xyflow/react dependency)
- pnpm-lock.yaml (updated lockfile)
