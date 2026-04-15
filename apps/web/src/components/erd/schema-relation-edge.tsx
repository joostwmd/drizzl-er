import type { RelationshipCardinality } from "@drizzl-er/drizzle-schema-graph";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import { memo } from "react";

type SchemaRelationEdgeType = Edge<
  { cardinality: RelationshipCardinality },
  "schemaRelation"
>;

function cardinalityLabel(c: RelationshipCardinality | undefined): string {
  switch (c) {
    case "one-to-many":
      return "1:N";
    case "many-to-one":
      return "N:1";
    case "one-to-one":
      return "1:1";
    case "many-to-many":
      return "N:N";
    default:
      return "";
  }
}

export const SchemaRelationEdge = memo(function SchemaRelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<SchemaRelationEdgeType>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = cardinalityLabel(data?.cardinality);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: selected ? 2.25 : 1.5,
          // Use explicit colors to avoid CSS variable parsing issues on SVG paths.
          stroke: selected ? "#64748b" : "#94a3b8",
          strokeOpacity: selected ? 0.75 : 0.6,
          strokeDasharray: selected ? "7 5" : "5 5",
        }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <Badge
              variant={selected ? "default" : "secondary"}
              className={cn(
                "text-[10px] font-semibold tabular-nums shadow-sm",
                selected && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
              )}
            >
              {label}
            </Badge>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});
