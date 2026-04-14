import { convertDrizzleSchemaToGraph } from "@drizzl-er/drizzle-schema-graph";
import { cn, waitForPaint } from "@/lib/utils";
import {
  Background,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { exportSchemaFlowToPdf } from "@/lib/export-schema-flow-pdf";
import { schemaGraphToReactFlow } from "@/lib/schema-graph-to-flow";

import { DatabaseSchemaNode } from "./database-schema-node";
import { SchemaRelationEdge } from "./schema-relation-edge";

const nodeTypes = {
  databaseSchema: DatabaseSchemaNode,
};

const edgeTypes = {
  schemaRelation: SchemaRelationEdge,
};

export type SchemaFlowCanvasHandle = {
  exportPdf: () => Promise<void>;
};

export type SchemaFlowExportCapabilities = {
  canExport: boolean;
  isExporting: boolean;
};

export type SchemaFlowCanvasProps = {
  source: string;
  className?: string;
  onExportCapabilitiesChange?: (caps: SchemaFlowExportCapabilities) => void;
};

type PdfExportControlsProps = {
  exportDisabled: boolean;
  onExportingChange: (exporting: boolean) => void;
};

const PdfExportControls = memo(
  forwardRef<SchemaFlowCanvasHandle, PdfExportControlsProps>(function PdfExportControls(
    { exportDisabled, onExportingChange },
    ref,
  ) {
    const { getNodes } = useReactFlow();

    const exportPdf = useCallback(async () => {
      if (exportDisabled) return;
      const viewport = document.querySelector<HTMLElement>("#erd-schema-flow .react-flow__viewport");
      if (!viewport) {
        toast.error("Could not find the diagram viewport.");
        return;
      }
      onExportingChange(true);
      await waitForPaint();
      try {
        await exportSchemaFlowToPdf(getNodes, viewport);
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Failed to export PDF");
      } finally {
        onExportingChange(false);
      }
    }, [exportDisabled, getNodes, onExportingChange]);

    useImperativeHandle(ref, () => ({ exportPdf }), [exportPdf]);

    return null;
  }),
);

PdfExportControls.displayName = "PdfExportControls";

export const SchemaFlowCanvas = forwardRef<SchemaFlowCanvasHandle, SchemaFlowCanvasProps>(
  function SchemaFlowCanvas({ source, className, onExportCapabilitiesChange }, ref) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [childExporting, setChildExporting] = useState(false);
    const pdfControlsRef = useRef<SchemaFlowCanvasHandle>(null);

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

    useImperativeHandle(
      ref,
      () => ({
        exportPdf: () => pdfControlsRef.current?.exportPdf() ?? Promise.resolve(),
      }),
      [],
    );

    const empty = !source.trim();
    const canExport = !empty && !parseError && nodes.length > 0;

    useEffect(() => {
      onExportCapabilitiesChange?.({ canExport, isExporting: childExporting });
    }, [canExport, childExporting, onExportCapabilitiesChange]);

    const onExportingChange = useCallback((exporting: boolean) => {
      setChildExporting(exporting);
    }, []);

    return (
      <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
        {parseError ? (
          <p className="text-sm text-destructive" role="alert">
            {parseError}
          </p>
        ) : null}
        <div
          id="erd-schema-flow"
          className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col rounded-md border border-border"
        >
          <ReactFlow
            className="h-full w-full"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={false}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView={nodes.length > 0}
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <PdfExportControls
              ref={pdfControlsRef}
              exportDisabled={!canExport}
              onExportingChange={onExportingChange}
            />
            <Background />
          </ReactFlow>
        </div>
      </div>
    );
  },
);

SchemaFlowCanvas.displayName = "SchemaFlowCanvas";
