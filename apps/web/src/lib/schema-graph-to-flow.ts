import type { SchemaGraph } from "@drizzl-er/drizzle-schema-graph";
import type { Edge, Node } from "@xyflow/react";

const NODE_WIDTH = 280;
const COLUMN_GAP = 72;
const ROW_GAP = 56;
const NODE_BASE_HEIGHT = 56;
const NODE_ROW_HEIGHT = 38;

function estimateNodeHeight(schemaColumnCount: number): number {
  return NODE_BASE_HEIGHT + schemaColumnCount * NODE_ROW_HEIGHT;
}

/**
 * Assigns deterministic positions with per-node height estimation to prevent overlap.
 * This keeps layout stable while remaining lightweight (no external layout engine).
 */
export function schemaGraphToReactFlow(graph: SchemaGraph): {
  nodes: Node[];
  edges: Edge[];
} {
  const columnCount = Math.max(1, Math.ceil(Math.sqrt(graph.nodes.length)));
  const nextYByColumn = Array.from({ length: columnCount }, () => 0);

  const nodes: Node[] = graph.nodes.map((n) => {
    const estimatedHeight = estimateNodeHeight(n.data.schema.length);
    const col = nextYByColumn.indexOf(Math.min(...nextYByColumn));
    const y = nextYByColumn[col];
    nextYByColumn[col] += estimatedHeight + ROW_GAP;

    return {
      id: n.id,
      type: n.type,
      position: { x: col * (NODE_WIDTH + COLUMN_GAP), y },
      data: n.data,
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    type: e.type,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    data: e.data,
  }));

  return { nodes, edges };
}
