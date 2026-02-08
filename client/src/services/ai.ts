import { http } from "./http";
import type { ChatResponse } from "../types/api";

export type AiHeaders = {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  providerId?: number | null;
  modelId?: number | null;
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
