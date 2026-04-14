export type SchemaView = { kind: "all" } | { kind: "file"; id: string };

export type SchemaFileSlice = { id: string; name: string; code: string };

/** Strip `.ts` / `.tsx` / `.js` / `.jsx` / `.mjs` etc. for display and stored titles. */
export function stripSchemaExtensions(filename: string): string {
  return filename.replace(/\.(m?jsx?|m?tsx?|m?c?js)$/i, "").trim() || "schema";
}

export function normalizeSchemaFileName(input: string): string {
  return stripSchemaExtensions(input.trim() || "schema");
}

export function getMergedSource(files: SchemaFileSlice[]): string {
  return files.map((f) => f.code.trimEnd()).join("\n\n");
}

export function getEffectiveSource(files: SchemaFileSlice[], view: SchemaView): string {
  if (view.kind === "all") {
    return getMergedSource(files);
  }
  const file = files.find((f) => f.id === view.id);
  return file?.code ?? "";
}

export function pageSubtitle(files: SchemaFileSlice[], view: SchemaView): string {
  if (view.kind === "all") {
    return files.length === 1
      ? "Whole schema (one file)"
      : `Whole schema (${files.length} files)`;
  }
  const file = files.find((f) => f.id === view.id);
  return file ? `File: ${file.name}` : "Schema graph";
}
