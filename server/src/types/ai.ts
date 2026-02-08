export type AiParseOptions = {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
};

export type AiParseResult = {
  intent?: string | undefined;
  unit_no?: string | undefined;
  buyer_name?: string | undefined;
  amount?: number | undefined;
  currency?: string | undefined;
  txn_type?: "定金" | "首付" | "分期" | undefined;
  missing_fields: string[];
  reply?: string | undefined;
};
