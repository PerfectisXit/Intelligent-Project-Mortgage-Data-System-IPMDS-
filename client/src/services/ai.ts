import { http } from "./http";
import type { ChatResponse } from "../types/api";

export type AiHeaders = {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  providerId?: number | null;
  modelId?: number | null;
};

export type TransactionData = {
  unit_no?: string;
  buyer_name?: string;
  amount?: number;
  currency?: string;
  txn_type?: string;
  occurred_at?: string;
  memo?: string;
};

export async function sendChat(message: string, headers?: AiHeaders) {
  return http.post<ChatResponse>(
    "/api/chat",
    {
      message,
      provider_id: headers?.providerId ?? null,
      model_id: headers?.modelId ?? null,
    },
    {
      timeout: 30000,
      headers: {
        "x-ai-api-key": headers?.apiKey || "",
        "x-ai-base-url": headers?.baseUrl || "",
        "x-ai-model-name": headers?.modelName || "",
      },
    }
  );
}

export async function createTransaction(data: TransactionData) {
  return http.post<{ success: boolean; data: { id: number } }>("/api/transactions", data);
}
