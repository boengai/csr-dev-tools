# Story 27.1: DB Diagram — Canvas, Table Entities & Relationships

Status: ready-for-dev

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

- [ ] Task 1: Install @xyflow/react and set up foundation (AC: #1)
  - [ ] 1.1 Install `@xyflow/react` package
  - [ ] 1.2 Add `'db-diagram'` to `ToolRegistryKey` union in `src/types/constants/tool-registry.ts`
  - [ ] 1.3 Add registry entry to `TOOL_REGISTRY` in `src/constants/tool-registry.ts`:
    ```typescript
    {
      category: 'Data',
      component: lazy(() =>
        import('@/components/feature/data/db-diagram').then(
          ({ DbDiagram }: { DbDiagram: ComponentType }) => ({
            default: DbDiagram,
          }),
        ),
      ),
      description: 'Design entity-relationship diagrams with an interactive visual canvas',
      emoji: '🗄️',
      key: 'db-diagram',
      name: 'DB Diagram',
      routePath: '/tools/db-diagram',
      seo: {
        description: 'Design and visualize database entity-relationship diagrams with an interactive canvas. Add tables, define columns, draw relationships — all in the browser.',
        title: 'DB Diagram - CSR Dev Tools',
      },
    }
    ```
  - [ ] 1.4 Create `src/components/feature/data/db-diagram/` directory structure

- [ ] Task 2: Define types (AC: all)
  - [ ] 2.1 Create `src/types/utils/db-diagram.ts` (follows existing pattern: `crop.ts`, `diff.ts`, `image.ts`):
    ```typescript
    export type ColumnType = 'INT' | 'BIGINT' | 'SERIAL' | 'VARCHAR' | 'TEXT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' | 'FLOAT' | 'DECIMAL' | 'UUID' | 'JSON' | 'BLOB'

    export type ColumnConstraint = {
      isPrimaryKey: boolean
      isForeignKey: boolean
      isNullable: boolean
      isUnique: boolean
    }

    export type TableColumn = {
      id: string
      name: string
      type: ColumnType
      constraints: ColumnConstraint
    }

    export type TableNodeData = {
      tableName: string
      columns: Array<TableColumn>
      onTableNameChange: (name: string) => void
      onAddColumn: () => void
      onColumnChange: (columnId: string, updates: Partial<TableColumn>) => void
      onDeleteColumn: (columnId: string) => void
      onDeleteTable: () => void
    }

    export type RelationshipType = '1:1' | '1:N' | 'N:M'

    export type RelationshipEdgeData = {
      relationType: RelationshipType
      sourceColumnId: string
      targetColumnId: string
    }

    // Forward-compatible schema type — defined now for Story 27.2 persistence.
    // Not used in 27.1 implementation. Do NOT implement serialization in this story.
    export type DiagramSchema = {
      tables: Array<{
        id: string
        name: string
        columns: Array<TableColumn>
        position: { x: number; y: number }
      }>
      relationships: Array<{
        id: string
        sourceTableId: string
        sourceColumnId: string
        targetTableId: string
        targetColumnId: string
        relationType: RelationshipType
      }>
    }
    ```
  - [ ] 2.2 Export from barrel: add `export * from './db-diagram'` to `src/types/utils/index.ts`

- [ ] Task 3: Create TableNode custom node component (AC: #2, #3, #4, #5, #8)
  - [ ] 3.1 Create `src/components/feature/data/db-diagram/TableNode.tsx`:
    - Renders a card-like node with dark theme styling consistent with project
    - Table name as editable header (click to edit, Enter/blur to save)
    - Column rows with: name (editable text), type (select dropdown), constraint toggles (PK/FK/Nullable/Unique as small icons)
    - "Add Column" button at bottom
    - Delete table button (X) in header
    - Delete column button (X) per row
    - Left-side `<Handle type="target">` and right-side `<Handle type="source">` per column row, with `id={columnId}`
    - Use `tv()` for styling variants consistent with project design system
  - [ ] 3.2 Define `nodeTypes` object outside component: `{ tableNode: TableNode }`

- [ ] Task 4: Create RelationshipEdge custom edge component (AC: #6, #7)
  - [ ] 4.1 Create `src/components/feature/data/db-diagram/RelationshipEdge.tsx`:
    - Uses `BaseEdge` + `getSmoothStepPath` for orthogonal right-angle connectors
    - `EdgeLabelRenderer` shows cardinality badge (1:1, 1:N, N:M)
    - Click on label opens a small dropdown to change cardinality — dispatch change via a custom event or callback ref pattern (do NOT store callbacks in edge `data` — React Flow diffs edge data by reference, causing stale closures)
    - Edge styled with project colors (gray-500 stroke, hover highlight)
  - [ ] 4.2 Define `edgeTypes` object outside component: `{ relationship: RelationshipEdge }`

- [ ] Task 5: Create main DbDiagram component (AC: #1, #2, #6, #9, #10)
  - [ ] 5.1 Create `src/components/feature/data/db-diagram/DbDiagram.tsx`:
    - Named export: `export const DbDiagram = ({ autoOpen, onAfterDialogClose }: ToolComponentProps) => {}`
    - Opens in Dialog with `size="screen"` (same pattern as CssAnimationBuilder)
    - Inside Dialog: toolbar at top + ReactFlow canvas filling remaining space
    - Toolbar contains: "Add Table" button, "Fit View" button, "Clear All" button
    - ReactFlow props: `nodeTypes`, `edgeTypes`, `onConnect` handler, `fitView`, dark theme via `colorMode="dark"`
    - Include `<Controls />`, `<MiniMap />`, `<Background variant={BackgroundVariant.Dots} />`
    - Manage nodes/edges state with `useNodesState` and `useEdgesState` from @xyflow/react
  - [ ] 5.2 Implement `onConnect` callback:
    - Creates a new relationship edge when user drags between handles
    - Default cardinality: `'1:N'`
    - Edge type: `'relationship'`
  - [ ] 5.3 Implement table CRUD operations:
    - `handleAddTable`: Creates new node at center of visible viewport using `useReactFlow().screenToFlowPosition()` — do NOT hardcode `{x: 0, y: 0}` or nodes will always appear at canvas origin
    - `handleDeleteTable`: Removes node + all connected edges
    - `handleTableNameChange`: Updates node data
    - `handleAddColumn`: Adds column to node data
    - `handleColumnChange`: Updates column in node data
    - `handleDeleteColumn`: Removes column + connected edges
  - [ ] 5.4 Implement relationship cardinality change:
    - `handleRelationTypeChange(edgeId, newType)`: Updates edge data via `setEdges` — the main component manages this, RelationshipEdge communicates via a callback prop passed through a React context or a ref-based approach (NOT via edge `data` callbacks)
  - [ ] 5.5 **ReactFlow container sizing**: The `<ReactFlow>` parent div MUST have explicit dimensions (`h-full w-full` with a flex parent that has a defined height). Inside the Dialog with `size="screen"`, use `<div className="flex h-full flex-col">` as wrapper, with the toolbar as `shrink-0` and the ReactFlow container as `flex-1`

- [ ] Task 6: Create barrel export and index (AC: all)
  - [ ] 6.1 Create `src/components/feature/data/db-diagram/index.ts` exporting `DbDiagram`
  - [ ] 6.2 Update `src/components/feature/data/index.ts` to include db-diagram export

- [ ] Task 7: Import React Flow CSS (AC: #1)
  - [ ] 7.1 Import `@xyflow/react/dist/style.css` in the DbDiagram component file (NOT globally — keep it scoped to this lazy-loaded chunk)

- [ ] Task 8: Unit tests (AC: all)
  - [ ] 8.1 Create `src/utils/db-diagram.spec.ts` with tests for:
    - Default table generation logic (correct name incrementing, default column)
    - Column ID generation uniqueness
    - Any pure helper functions extracted to `src/utils/db-diagram.ts` (e.g., `createDefaultTable`, `createDefaultColumn`, `generateId`)
  - [ ] 8.2 Note: React Flow canvas interactions are covered by E2E, not unit tests. Do NOT write serialization tests — that's Story 27.2 scope.

- [ ] Task 9: E2E test (AC: #1, #2, #3, #4, #6, #8)
  - [ ] 9.1 Create `e2e/db-diagram.spec.ts`:
    - Tool loads and shows canvas (verify `.react-flow` container visible)
    - Can add a table and see it on canvas (click `[data-testid="add-table-btn"]`, verify node appears)
    - Can edit table name (click table header text, type new name, blur)
    - Can add columns to a table (click add-column button in node)
    - Can delete a table (click delete button on node header)
    - Responsive: canvas renders at 375px viewport
  - [ ] 9.2 Add `data-testid` attributes to key interactive elements:
    - `data-testid="add-table-btn"` on toolbar Add Table button
    - `data-testid="fit-view-btn"` on toolbar Fit View button
    - `data-testid="clear-all-btn"` on toolbar Clear All button
    - `data-testid="table-node-{id}"` on each table node wrapper
    - Note: React Flow canvas drag/connect interactions are complex in Playwright — test basic CRUD, defer drag-to-connect E2E to manual testing

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

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
