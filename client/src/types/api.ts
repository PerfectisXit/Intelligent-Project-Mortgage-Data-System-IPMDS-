export type ChatResponse = {
  reply: string;
  entities: Record<string, unknown>;
  missing_fields: string[];
};

export type AnalyzeResponse = {
  mode?: "unit" | "summary";
  added_rows: Array<{
    unit_no: string;
    status: string;
    area_m2: number;
    buyer_name?: string;
  }>;
  modified_rows: Array<{
    unit_no: string;
    diffs: Record<string, { excel: string; db: string }>;
  }>;
  stats: {
    added: number;
    modified: number;
    unchanged: number;
  };
  summary_rows?: Array<Record<string, unknown>>;
};
