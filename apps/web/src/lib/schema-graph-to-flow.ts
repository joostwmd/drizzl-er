import type { SchemaGraph } from "@drizzl-er/drizzle-schema-graph";
import type { Edge, Node } from "@xyflow/react";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 200;

/** Assigns stable grid positions so the canvas is usable before a layout engine exists. */
export function schemaGraphToReactFlow(graph: SchemaGraph): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = graph.nodes.map((n, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return {
      id: n.id,
      type: n.type,
      position: { x: col * NODE_WIDTH, y: row * NODE_HEIGHT },
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
