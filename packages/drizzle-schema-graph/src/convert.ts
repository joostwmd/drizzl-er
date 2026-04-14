import * as ts from "typescript";

import type {
  ConvertOptions,
  DatabaseSchemaNodeData,
  DrizzleDialect,
  SchemaGraph,
  SchemaGraphEdge,
  SchemaGraphNode,
} from "./types";

type PgMysqlSchemaBinding = {
  kind: "pg" | "mysql";
  constName: string;
  /** SQL schema name (empty string allowed for PG). */
  sqlSchemaName: string;
};

type SqliteCreatorBinding = {
  kind: "sqlite";
  constName: string;
  /** Prefix before table short name, e.g. `fixture_` from `(name) => \`fixture_${name}\``. */
  physicalPrefix: string;
};

type SchemaBinding = PgMysqlSchemaBinding | SqliteCreatorBinding;

type ColumnDef = {
  tsPropertyName: string;
  sqlName: string;
  drizzleType: string;
  isPk: boolean;
  fk?: { tableExportName: string; columnTsName: string };
};

type TableDef = {
  exportName: string;
  nodeId: string;
  label: string;
  columns: ColumnDef[];
};

function inferDialectFromSource(source: string): DrizzleDialect {
  if (source.includes('"drizzle-orm/pg-core"') || source.includes("'drizzle-orm/pg-core'")) {
    return "pg";
  }
  if (source.includes('"drizzle-orm/mysql-core"') || source.includes("'drizzle-orm/mysql-core'")) {
    return "mysql";
  }
  if (source.includes('"drizzle-orm/sqlite-core"') || source.includes("'drizzle-orm/sqlite-core'")) {
    return "sqlite";
  }
  throw new Error(
    "Could not infer Drizzle dialect from imports; pass options.dialect explicitly.",
  );
}

function parseSqlitePhysicalPrefix(arrow: ts.ArrowFunction): string {
  if (!ts.isExpression(arrow.body)) {
    return "";
  }
  const body = arrow.body;
  if (!ts.isTemplateExpression(body)) {
    return "";
  }
  return body.head.text;
}

type ColumnParseResult = {
  sqlName: string | null;
  drizzleType: string;
  hasPk: boolean;
  fk?: { tableExportName: string; columnTsName: string };
};

function parseColumnInitializer(expr: ts.Expression): ColumnParseResult {
  const res: ColumnParseResult = {
    sqlName: null,
    drizzleType: "unknown",
    hasPk: false,
  };

  const visit = (node: ts.Expression): void => {
    if (ts.isParenthesizedExpression(node)) {
      visit(node.expression);
      return;
    }
    if (!ts.isCallExpression(node)) {
      return;
    }
    const calleeSide = node.expression;
    if (ts.isPropertyAccessExpression(calleeSide)) {
      const prop = calleeSide.name.getText();
      if (prop === "primaryKey") {
        res.hasPk = true;
      }
      if (prop === "references" && node.arguments[0]) {
        const arg0 = node.arguments[0];
        if (ts.isArrowFunction(arg0) && ts.isExpression(arg0.body)) {
          const b = arg0.body;
          if (ts.isPropertyAccessExpression(b) && ts.isIdentifier(b.expression)) {
            res.fk = {
              tableExportName: b.expression.text,
              columnTsName: b.name.getText(),
            };
          }
        }
      }
      visit(calleeSide.expression);
      return;
    }
    if (ts.isIdentifier(calleeSide) && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
      res.sqlName = node.arguments[0].text;
      res.drizzleType = calleeSide.text;
    }
  };

  visit(expr);
  return res;
}

function isExported(statement: ts.VariableStatement): boolean {
  return (
    statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true
  );
}

function collectBindings(sourceFile: ts.SourceFile): Map<string, SchemaBinding> {
  const bindings = new Map<string, SchemaBinding>();

  const visitVariableStatement = (stmt: ts.VariableStatement): void => {
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) {
        continue;
      }
      const constName = decl.name.text;
      const init = decl.initializer;
      if (!ts.isCallExpression(init)) {
        continue;
      }
      const callee = init.expression;
      if (!ts.isIdentifier(callee)) {
        continue;
      }
      if (callee.text === "pgSchema" || callee.text === "mysqlSchema") {
        const arg0 = init.arguments[0];
        const schemaName =
          arg0 && ts.isStringLiteralLike(arg0) ? arg0.text : "";
        bindings.set(constName, {
          kind: callee.text === "pgSchema" ? "pg" : "mysql",
          constName,
          sqlSchemaName: schemaName,
        });
      }
      if (callee.text === "sqliteTableCreator" && init.arguments[0]) {
        const arg0 = init.arguments[0];
        if (ts.isArrowFunction(arg0)) {
          const physicalPrefix = parseSqlitePhysicalPrefix(arg0);
          bindings.set(constName, {
            kind: "sqlite",
            constName,
            physicalPrefix,
          });
        }
      }
    }
  };

  for (const stmt of sourceFile.statements) {
    if (ts.isVariableStatement(stmt)) {
      visitVariableStatement(stmt);
    }
  }

  return bindings;
}

function tableNodeId(
  binding: PgMysqlSchemaBinding | SqliteCreatorBinding,
  tableShortName: string,
): string {
  if (binding.kind === "sqlite") {
    return `${binding.physicalPrefix}${tableShortName}`;
  }
  if (binding.sqlSchemaName === "") {
    return tableShortName;
  }
  return `${binding.sqlSchemaName}.${tableShortName}`;
}

function tryParseTableVariable(
  decl: ts.VariableDeclaration,
  bindings: Map<string, SchemaBinding>,
): TableDef | null {
  if (!ts.isIdentifier(decl.name) || !decl.initializer) {
    return null;
  }
  const exportName = decl.name.text;
  const init = decl.initializer;
  if (!ts.isCallExpression(init)) {
    return null;
  }
  const calleeExpr = init.expression;
  let binding: SchemaBinding | undefined;
  let tableShortName: string | undefined;
  let colArg: ts.ObjectLiteralExpression | undefined;

  if (ts.isPropertyAccessExpression(calleeExpr)) {
    if (calleeExpr.name.getText() !== "table") {
      return null;
    }
    if (!ts.isIdentifier(calleeExpr.expression)) {
      return null;
    }
    binding = bindings.get(calleeExpr.expression.text);
    const nameArg = init.arguments[0];
    const maybeCols = init.arguments[1];
    if (!nameArg || !ts.isStringLiteralLike(nameArg) || !maybeCols || !ts.isObjectLiteralExpression(maybeCols)) {
      return null;
    }
    tableShortName = nameArg.text;
    colArg = maybeCols;
  } else if (ts.isIdentifier(calleeExpr)) {
    /** SQLite: `const t = sqliteTableCreator(...); export const x = t("user", { ... })` */
    binding = bindings.get(calleeExpr.text);
    if (!binding || binding.kind !== "sqlite") {
      return null;
    }
    const nameArg = init.arguments[0];
    const maybeCols = init.arguments[1];
    if (!nameArg || !ts.isStringLiteralLike(nameArg) || !maybeCols || !ts.isObjectLiteralExpression(maybeCols)) {
      return null;
    }
    tableShortName = nameArg.text;
    colArg = maybeCols;
  } else {
    return null;
  }

  if (!binding || tableShortName === undefined || !colArg) {
    return null;
  }
  const nodeId = tableNodeId(binding, tableShortName);
  const columns: ColumnDef[] = [];
  for (const prop of colArg.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    const tsPropertyName = propertyNameText(prop.name);
    const parsed = parseColumnInitializer(prop.initializer);
    const sqlName = parsed.sqlName ?? tsPropertyName;
    columns.push({
      tsPropertyName,
      sqlName,
      drizzleType: parsed.drizzleType,
      isPk: parsed.hasPk,
      fk: parsed.fk,
    });
  }
  return {
    exportName,
    nodeId,
    label: nodeId,
    columns,
  };
}

function propertyNameText(name: ts.PropertyName): string {
  if (ts.isIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }
  return name.getText();
}

function collectExportedTables(
  sourceFile: ts.SourceFile,
  bindings: Map<string, SchemaBinding>,
): TableDef[] {
  const tables: TableDef[] = [];
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt) || !isExported(stmt)) {
      continue;
    }
    for (const decl of stmt.declarationList.declarations) {
      const t = tryParseTableVariable(decl, bindings);
      if (t) {
        tables.push(t);
      }
    }
  }
  return tables;
}

function resolveColumnSqlName(
  table: TableDef,
  columnTsName: string,
): string | undefined {
  const col = table.columns.find((c) => c.tsPropertyName === columnTsName);
  return col?.sqlName;
}

function stableEdgeId(
  sourceId: string,
  sourceCol: string,
  targetId: string,
  targetCol: string,
): string {
  const safe = (s: string) => s.replaceAll(".", "_");
  return `fk_${safe(sourceId)}_${sourceCol}_${safe(targetId)}_${targetCol}`;
}

function buildGraph(tables: TableDef[]): SchemaGraph {
  const exportToTable = new Map(tables.map((t) => [t.exportName, t]));
  const edges: SchemaGraphEdge[] = [];

  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.fk) {
        continue;
      }
      const targetTable = exportToTable.get(col.fk.tableExportName);
      if (!targetTable) {
        continue;
      }
      const targetColSql =
        resolveColumnSqlName(targetTable, col.fk.columnTsName) ?? col.fk.columnTsName;
      const edgeId = stableEdgeId(
        table.nodeId,
        col.sqlName,
        targetTable.nodeId,
        targetColSql,
      );
      edges.push({
        id: edgeId,
        type: "schemaRelation",
        source: table.nodeId,
        target: targetTable.nodeId,
        sourceHandle: `src_${col.sqlName}`,
        targetHandle: `tgt_${targetColSql}`,
        data: { cardinality: "many-to-one" },
      });
    }
  }

  const nodes: SchemaGraphNode[] = tables.map((t) => {
    const schemaRows = t.columns.map((c) => ({
      title: c.sqlName,
      type: c.drizzleType,
    }));
    const relationships: DatabaseSchemaNodeData["relationships"] = [];
    for (const col of t.columns) {
      if (!col.fk) {
        continue;
      }
      const targetTable = exportToTable.get(col.fk.tableExportName);
      if (!targetTable) {
        continue;
      }
      const targetColSql =
        resolveColumnSqlName(targetTable, col.fk.columnTsName) ?? col.fk.columnTsName;
      const edgeId = stableEdgeId(
        t.nodeId,
        col.sqlName,
        targetTable.nodeId,
        targetColSql,
      );
      relationships.push({
        edgeId,
        peerTableId: targetTable.nodeId,
        peerLabel: targetTable.label,
        participation: "outgoing",
        cardinality: "many-to-one",
      });
    }
    for (const other of tables) {
      if (other === t) {
        continue;
      }
      for (const col of other.columns) {
        if (col.fk?.tableExportName !== t.exportName) {
          continue;
        }
        const targetColSql =
          resolveColumnSqlName(t, col.fk.columnTsName) ?? col.fk.columnTsName;
        const edgeId = stableEdgeId(
          other.nodeId,
          col.sqlName,
          t.nodeId,
          targetColSql,
        );
        relationships.push({
          edgeId,
          peerTableId: other.nodeId,
          peerLabel: other.label,
          participation: "incoming",
          cardinality: "one-to-many",
        });
      }
    }
    const data: DatabaseSchemaNodeData = {
      label: t.label,
      schema: schemaRows,
      relationships: relationships.length > 0 ? relationships : undefined,
    };
    return {
      id: t.nodeId,
      type: "databaseSchema",
      data,
    };
  });

  const sortKey = (s: string) => s;
  nodes.sort((a, b) => sortKey(a.id).localeCompare(sortKey(b.id)));
  edges.sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, edges };
}

/**
 * Parse Drizzle schema TypeScript source and produce a serializable graph for React Flow.
 * Uses the TypeScript AST only (does not execute the schema).
 */
export function convertDrizzleSchemaToGraph(
  source: string,
  options?: ConvertOptions,
): SchemaGraph {
  if (!options?.dialect) {
    inferDialectFromSource(source);
  }

  const sourceFile = ts.createSourceFile(
    "schema.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const bindings = collectBindings(sourceFile);
  const tables = collectExportedTables(sourceFile, bindings);
  if (tables.length === 0) {
    throw new Error("No exported Drizzle tables found in source.");
  }

  return buildGraph(tables);
}
