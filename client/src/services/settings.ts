export type AiSettings = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

const SETTINGS_KEY = "ipmds_ai_settings";

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        apiKey: "",
        baseUrl: "https://api.deepseek.com/v1",
        modelName: "deepseek-chat",
      };
    }
    return JSON.parse(raw) as AiSettings;
  } catch {
    return {
      apiKey: "",
      baseUrl: "https://api.deepseek.com/v1",
      modelName: "deepseek-chat",
    };
  }
}

export function setAiSettings(next: AiSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}
