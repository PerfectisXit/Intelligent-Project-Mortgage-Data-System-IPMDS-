"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAiProvider = getAiProvider;
const openai_1 = require("./providers/openai");
function getAiProvider(opts) {
    if (!opts.apiKey)
        return null;
    return new openai_1.OpenAIProvider(opts.apiKey, opts.baseUrl);
}
