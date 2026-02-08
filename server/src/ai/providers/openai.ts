import OpenAI from "openai";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class OpenAIProvider {
  private client: OpenAI;

  constructor(apiKey: string, baseUrl?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
  }

  async chat(model: string, messages: AiMessage[]) {
    const resp = await this.client.chat.completions.create({
      model,
      messages,
      temperature: 0,
    });
    return resp.choices[0]?.message?.content ?? "";
  }
}
