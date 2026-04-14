# @drizzl-er/drizzle-schema-graph

Converts **Drizzle ORM schema TypeScript** (as plain source text) into a **JSON-serializable graph** (`nodes` + `edges`) for React Flow and similar UIs. Parsing uses the **TypeScript AST only**; schema code is **not executed**.

## API

```ts
import { convertDrizzleSchemaToGraph } from "@drizzl-er/drizzle-schema-graph";

const graph = convertDrizzleSchemaToGraph(source);
// graph.nodes, graph.edges
```

Optional `options.dialect` forces a dialect when imports are ambiguous.

## Supported in v1

- **Postgres:** `pgSchema("…")` (including empty string), `schema.table("name", { … })`, `text("sql_column")`, `.primaryKey()`, `.references(() => otherTable.column)`.
- **MySQL:** `mysqlSchema("…")`, same `table` / column / FK patterns.
- **SQLite:** `sqliteTableCreator((name) => \`prefix_${name}\`)` then `creator("short", { … })` (not only `schema.table`).

## Not supported yet

- `relations()` API (explicit relational config) — only column-level `.references()`.
- **Mixed dialects** in one file (e.g. PG + MySQL tables together).
- Arbitrary re-exports, computed table names, or heavy indirection around `table(...)`.
- Full type / default / check constraint fidelity — column `type` is the Drizzle builder name (e.g. `text`), not DB-native types.

## Fixtures

Input files under `fixtures/input/` are adapted from the vendored reference [`references/drizzle-erd-master`](../../references/drizzle-erd-master) (MIT). Golden outputs live in `fixtures/expected/*.json`.

## Scripts

- `pnpm test` — Vitest, compares converter output to golden JSON.
- `pnpm check-types` — `tsc --noEmit`.
