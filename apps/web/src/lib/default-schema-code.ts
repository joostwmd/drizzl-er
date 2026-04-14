/**
 * Small Drizzle schema used as the default when adding a new file in the ERD.
 */
export const DEFAULT_SCHEMA_CODE = `import { pgSchema, text } from "drizzle-orm/pg-core";

const schema = pgSchema("");

export const userTable = schema.table("user", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const postTable = schema.table("post", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => userTable.id),
});
`;
