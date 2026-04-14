import { create } from "zustand";

import { normalizeSchemaFileName } from "@/lib/schema-file-utils";

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

export type SchemaView = { kind: "all" } | { kind: "file"; id: string };

export type SchemaFile = {
  id: string;
  name: string;
  code: string;
};

function newId(): string {
  return crypto.randomUUID();
}

function createInitialFile(): SchemaFile {
  return {
    id: newId(),
    name: "schema",
    code: DEFAULT_SCHEMA_CODE,
  };
}

type SchemaFilesState = {
  files: SchemaFile[];
  view: SchemaView;
  setViewAll: () => void;
  setViewFile: (id: string) => void;
  addFile: (name: string, code: string) => void;
  updateFile: (id: string, name: string, code: string) => void;
  removeFile: (id: string) => void;
};

export const useSchemaFilesStore = create<SchemaFilesState>((set, get) => ({
  files: [createInitialFile()],
  view: { kind: "all" },

  setViewAll: () => set({ view: { kind: "all" } }),

  setViewFile: (id) => {
    if (!get().files.some((f) => f.id === id)) return;
    set({ view: { kind: "file", id } });
  },

  addFile: (name, code) => {
    const id = newId();
    const normalized = normalizeSchemaFileName(name);
    set((s) => ({
      files: [...s.files, { id, name: normalized, code }],
    }));
  },

  updateFile: (id, name, code) => {
    const normalized = normalizeSchemaFileName(name);
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, name: normalized, code } : f)),
    }));
  },

  removeFile: (id) => {
    set((s) => {
      const nextFiles = s.files.filter((f) => f.id !== id);
      const files = nextFiles.length === 0 ? [createInitialFile()] : nextFiles;

      let view: SchemaView = s.view;
      if (view.kind === "file") {
        const activeId = view.id;
        if (activeId === id || !files.some((f) => f.id === activeId)) {
          view = { kind: "all" };
        }
      }

      return { files, view };
    });
  },
}));
