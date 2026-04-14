import { convertDrizzleSchemaToGraph } from "@drizzl-er/drizzle-schema-graph";
import {
  Background,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@drizzl-er/ui/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { schemaGraphToReactFlow } from "@/lib/schema-graph-to-flow";

import { DatabaseSchemaNode } from "./database-schema-node";
import { SchemaRelationEdge } from "./schema-relation-edge";

const nodeTypes = {
  databaseSchema: DatabaseSchemaNode,
};

const edgeTypes = {
  schemaRelation: SchemaRelationEdge,
};

type SchemaFlowCanvasProps = {
  source: string;
  className?: string;
};

export function SchemaFlowCanvas({ source, className }: SchemaFlowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = source.trim();
    if (!trimmed) {
      setParseError(null);
      setNodes([]);
      setEdges([]);
      return;
    }
    try {
      const graph = convertDrizzleSchemaToGraph(trimmed);
      const next = schemaGraphToReactFlow(graph);
      setNodes(next.nodes);
      setEdges(next.edges);
      setParseError(null);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Failed to parse schema");
      setNodes([]);
      setEdges([]);
    }
  }, [source]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const empty = !source.trim();

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      {empty ? (
        <p className="text-sm text-muted-foreground">Add schema code in the sidebar to render a graph.</p>
      ) : null}
      {parseError ? (
        <p className="text-sm text-destructive" role="alert">
          {parseError}
        </p>
      ) : null}
      {empty ? null : (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col rounded-md border border-border">
          <ReactFlow
            className="h-full w-full"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={false}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
