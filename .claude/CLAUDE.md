## Codebase search policy — READ FIRST

**You MUST attempt a `codegraph_*` tool before reaching for `rg` / `grep` / `find` / `Read` to locate code.** This applies to the main session AND to any subagent (`Explore`, `Plan`, `general-purpose`) spawned in this project. The MCP server is connected, the index is current, and reads are sub-millisecond — bypassing it wastes tokens and returns inferior results.

Decision flow for any "find / where / what / how does X work" question:

1. **Symbol by name** (`X` is an identifier) → `codegraph_search`.
2. **Area / trace / "how does X work"** → `codegraph_context` first, then ONE `codegraph_explore` over the symbols it surfaces.
3. **Refactor / blast radius** → `codegraph_callers` → `codegraph_impact`.
4. **Browse a directory** → `codegraph_files`.
5. Fall back to `rg` / `grep` / `Read` **only** if codegraph returns no relevant hits, OR the query is genuinely textual (a literal string, comment, log message, error text, regex pattern).

If you catch yourself opening Bash for grep/rg before trying codegraph, **STOP and re-route**. This has been flagged as a recurring miss.

The block below documents the full tool/intent mapping.

<!-- CODEGRAPH_START -->
## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "See several related symbols' source at once" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture / trace questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*
<!-- CODEGRAPH_END -->
