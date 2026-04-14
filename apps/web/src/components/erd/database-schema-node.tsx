import type { DatabaseSchemaNodeData } from "@drizzl-er/drizzle-schema-graph";
import {
  DatabaseSchemaNode as SchemaTableRoot,
  DatabaseSchemaNodeBody,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaTableCell,
  DatabaseSchemaTableRow,
} from "@/components/database-schema-node";
import { LabeledHandle } from "@/components/labeled-handle";
import { type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

/**
 * React Flow custom node: uses the ui.reactflow.dev database-schema layout with
 * invisible handles (programmatic FK edges only; no manual wiring affordance).
 */
export const DatabaseSchemaNode = memo(function DatabaseSchemaNode({
  data,
}: NodeProps<Node<DatabaseSchemaNodeData, "databaseSchema">>) {
  return (
    <SchemaTableRoot className="p-0">
      <DatabaseSchemaNodeHeader>{data.label}</DatabaseSchemaNodeHeader>
      <DatabaseSchemaNodeBody>
        {data.schema.map((entry) => (
          <DatabaseSchemaTableRow key={entry.title}>
            <DatabaseSchemaTableCell className="w-1/2 py-2 pl-3 pr-4 align-middle">
              <LabeledHandle
                id={`tgt_${entry.title}`}
                title={entry.title}
                type="target"
                position={Position.Left}
                invisible
                className="w-full justify-start"
                labelClassName="pl-1 text-xs font-normal text-foreground"
              />
            </DatabaseSchemaTableCell>
            <DatabaseSchemaTableCell className="w-1/2 py-2 pl-4 pr-3 align-middle">
              <LabeledHandle
                id={`src_${entry.title}`}
                title={entry.type}
                type="source"
                position={Position.Right}
                invisible
                className="w-full justify-end"
                handleClassName="shrink-0"
                labelClassName="w-full pr-1 text-right text-xs font-normal text-muted-foreground"
              />
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>
    </SchemaTableRoot>
  );
});
