import { http } from "./http";
import type { AnalyzeResponse } from "../types/api";

export async function analyzeExcel(
  file: File,
  projectId: number,
  mode: "unit" | "summary" = "summary"
) {
  const formData = new FormData();
  formData.append("file", file);
  return http.post<AnalyzeResponse>(
    `/data-service/analyze?project_id=${projectId}&mode=${mode}`,
    formData,
    {
      timeout: 60000,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
}
