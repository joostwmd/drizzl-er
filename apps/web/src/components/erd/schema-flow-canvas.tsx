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
};

export function SchemaFlowCanvas({ source }: SchemaFlowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const graph = convertDrizzleSchemaToGraph(source);
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

  return (
    <div className="flex flex-col gap-2">
      {parseError ? (
        <p className="text-sm text-destructive" role="alert">
          {parseError}
        </p>
      ) : null}
      <div className="h-[min(70vh,640px)] w-full min-h-[400px] rounded-md border border-border">
      <ReactFlow
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
    </div>
  );
}
