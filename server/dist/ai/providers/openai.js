"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIProvider {
    constructor(apiKey, baseUrl) {
        this.client = new openai_1.default({
            apiKey,
            baseURL: baseUrl || undefined,
        });
    }
    async chat(model, messages) {
        const resp = await this.client.chat.completions.create({
            model,
            messages,
            temperature: 0,
        });
        return resp.choices[0]?.message?.content ?? "";
    }
}
exports.OpenAIProvider = OpenAIProvider;
