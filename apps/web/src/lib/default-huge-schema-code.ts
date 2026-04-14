/**
 * Large default Drizzle schema for local stress-testing (many tables + FK edges).
 * Not meant as a realistic domain model.
 */
function buildDefaultHugeSchemaCode(): string {
  const tableCount = 150;
  const columnsPerTable = 18;

  const parts: string[] = [
    'import { pgSchema, text } from "drizzle-orm/pg-core";',
    "",
    'const schema = pgSchema("");',
    "",
  ];

  for (let i = 0; i < tableCount; i++) {
    const body: string[] = ['  id: text("id").primaryKey()'];
    for (let c = 0; c < columnsPerTable; c++) {
      body.push(`  col_${c}: text("col_${i}_${c}")`);
    }
    if (i > 0) {
      body.push(`  fk_chain: text("fk_chain").references(() => t_${i - 1}.id)`);
    }
    if (i >= 40) {
      body.push(`  fk_span: text("fk_span").references(() => t_${i - 40}.id)`);
    }
    parts.push(`export const t_${i} = schema.table("t_${i}", {\n${body.join(",\n")},\n});`);
    parts.push("");
  }

  return parts.join("\n");
}

export const DEFAULT_SCHEMA_CODE = buildDefaultHugeSchemaCode();
