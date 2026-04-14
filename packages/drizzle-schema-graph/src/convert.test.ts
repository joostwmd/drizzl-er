import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { SchemaGraph } from "./types";
import { convertDrizzleSchemaToGraph } from "./convert";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");

function loadFixture(name: string): string {
  return readFileSync(join(pkgRoot, "fixtures", "input", `${name}.ts`), "utf8");
}

function loadExpected(name: string): SchemaGraph {
  const raw = readFileSync(join(pkgRoot, "fixtures", "expected", `${name}.json`), "utf8");
  return JSON.parse(raw) as SchemaGraph;
}

describe("convertDrizzleSchemaToGraph", () => {
  it.each([
    ["pg-basic-fk"],
    ["mysql-basic-fk"],
    ["sqlite-basic-fk"],
  ] as const)("matches golden for %s", (name) => {
    const source = loadFixture(name);
    const actual = convertDrizzleSchemaToGraph(source);
    const expected = loadExpected(name);
    expect(actual).toEqual(expected);
  });
});
