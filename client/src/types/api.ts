export type ChatResponse = {
  reply: string;
  entities: Record<string, unknown>;
  missing_fields: string[];
};

export type SummaryRow = {
  project_company: string;
  project_name: string;
  contractor: string;
  business_type: string;
  gd_units: number;
  gd_area_m2: number;
  gd_price_per_m2: number;
  gd_total_price_10k: number;
  signed_amount_10k: number;
  received_10k: number;
  unpaid_10k: number;
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
  summary_rows?: SummaryRow[];
};
