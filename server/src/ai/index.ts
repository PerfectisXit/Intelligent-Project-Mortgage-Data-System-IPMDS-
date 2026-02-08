import { OpenAIProvider } from "./providers/openai";

export type ProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
};

export function getAiProvider(opts: ProviderOptions) {
  if (!opts.apiKey) return null;
  return new OpenAIProvider(opts.apiKey, opts.baseUrl);
}
