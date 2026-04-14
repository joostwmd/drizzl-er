/** Cardinality along the FK edge: source table (child) → target table (parent). */
export type RelationshipCardinality =
  | "one-to-one"
  | "one-to-many"
  | "many-to-one"
  | "many-to-many";

export type NodeRelationshipSummary = {
  edgeId: string;
  pairedEdgeId?: string;
  peerTableId: string;
  peerLabel: string;
  participation: "outgoing" | "incoming" | "bidirectional";
  cardinality: RelationshipCardinality;
};

/** Serializable node payload for a database table card (React Flow `data`). */
export type DatabaseSchemaNodeData = {
  label: string;
  schema: { title: string; type: string }[];
  relationships?: NodeRelationshipSummary[];
};

export type SchemaGraphNode = {
  id: string;
  type: "databaseSchema";
  data: DatabaseSchemaNodeData;
};

export type SchemaGraphEdge = {
  id: string;
  type: "schemaRelation";
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  data: {
    cardinality: RelationshipCardinality;
  };
};

export type SchemaGraph = {
  nodes: SchemaGraphNode[];
  edges: SchemaGraphEdge[];
};

export type DrizzleDialect = "pg" | "mysql" | "sqlite";

export type ConvertOptions = {
  dialect?: DrizzleDialect;
};
