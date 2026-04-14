import { create } from "zustand";

import { DEFAULT_SCHEMA_CODE } from "@/lib/default-huge-schema-code";
import { normalizeSchemaFileName } from "@/lib/schema-file-utils";

export { DEFAULT_SCHEMA_CODE };

export type SchemaView = { kind: "all" } | { kind: "file"; id: string };

export type SchemaFile = {
  id: string;
  name: string;
  code: string;
};

function newId(): string {
  return crypto.randomUUID();
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
  files: [],
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
      const files = s.files.filter((f) => f.id !== id);

      let view: SchemaView = s.view;
      if (files.length === 0) {
        view = { kind: "all" };
      } else if (view.kind === "file") {
        const activeId = view.id;
        if (activeId === id || !files.some((f) => f.id === activeId)) {
          view = { kind: "all" };
        }
      }

      return { files, view };
    });
  },
}));
