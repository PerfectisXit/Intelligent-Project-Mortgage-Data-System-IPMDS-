import { http } from "./http";

export type AiProvider = {
  id: number;
  slug: string;
  name: string;
  base_url: string;
  api_key?: string | null;
  is_builtin: boolean;
  ai_models: AiModel[];
};

export type AiModel = {
  id: number;
  provider_id: number;
  name: string;
  model_name: string;
  is_builtin: boolean;
};

export type AiSettings = {
  id: number;
  default_provider_id: number | null;
  default_model_id: number | null;
};

export async function fetchProviders() {
  return http.get<{ data: AiProvider[] }>("/api/ai/providers");
}

export async function updateProvider(id: number, data: Partial<AiProvider>) {
  return http.patch<{ data: AiProvider }>(`/api/ai/providers/${id}`, data);
}

export async function createProvider(data: {
  name: string;
  base_url: string;
  api_key?: string;
  slug?: string;
}) {
  return http.post<{ data: AiProvider }>("/api/ai/providers", data);
}

export async function createModel(data: {
  provider_id: number;
  name: string;
  model_name: string;
}) {
  return http.post<{ data: AiModel }>("/api/ai/models", data);
}

export async function fetchSettings() {
  return http.get<{ data: AiSettings | null }>("/api/ai/settings");
}

export async function saveSettings(data: {
  default_provider_id: number | null;
  default_model_id: number | null;
}) {
  return http.put<{ data: AiSettings }>("/api/ai/settings", data);
}

export async function testConnection(data: {
  provider_id: number;
  model_id: number;
}) {
  return http.post<{ ok: boolean; latency_ms: number; sample: string }>(
    "/api/ai/test",
    data
  );
}
