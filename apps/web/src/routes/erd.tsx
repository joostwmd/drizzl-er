import { Button } from "@drizzl-er/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useId, useState } from "react";

import { SchemaFlowCanvas } from "@/components/erd/schema-flow-canvas";

const PG_FIXTURE = `import { pgSchema, text } from "drizzle-orm/pg-core";

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

export const Route = createFileRoute("/erd")({
  component: ErdRoute,
});

function ErdRoute() {
  const labelId = useId();
  const [draft, setDraft] = useState(PG_FIXTURE);
  const [applied, setApplied] = useState(PG_FIXTURE);

  const apply = useCallback(() => {
    setApplied(draft);
  }, [draft]);

  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
      <div>
        <h1 className="text-lg font-semibold">Schema graph</h1>
        <p className="text-sm text-muted-foreground">
          Paste Drizzle schema TypeScript, then update the graph. Parsing runs only in the browser (AST,
          no execution).
        </p>
      </div>
      <div className="grid gap-2">
        <label htmlFor={labelId} className="text-sm font-medium">
          Drizzle schema
        </label>
        <textarea
          id={labelId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="nodrag border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[200px] w-full rounded-md border px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          spellCheck={false}
        />
        <Button type="button" onClick={apply} className="w-fit">
          Update graph
        </Button>
      </div>
      <SchemaFlowCanvas source={applied} />
    </div>
  );
}
