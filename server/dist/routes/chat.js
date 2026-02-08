"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_1 = require("../services/ai");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const message = String(req.body?.message || "").trim();
        if (!message) {
            return res.status(400).json({ error: "message is required" });
        }
        const apiKey = String(req.header("x-ai-api-key") || "");
        const baseUrl = String(req.header("x-ai-base-url") || "");
        const modelName = String(req.header("x-ai-model-name") || "");
        const opts = {};
        if (apiKey)
            opts.apiKey = apiKey;
        if (baseUrl)
            opts.baseUrl = baseUrl;
        if (modelName)
            opts.modelName = modelName;
        if (!opts.apiKey) {
            const providerId = Number(req.body?.provider_id || 0);
            const modelId = Number(req.body?.model_id || 0);
            if (providerId && modelId) {
                const provider = await prisma_1.default.ai_providers.findUnique({
                    where: { id: providerId },
                });
                const model = await prisma_1.default.ai_models.findUnique({
                    where: { id: modelId },
                });
                if (provider?.api_key && model?.model_name) {
                    opts.apiKey = provider.api_key;
                    opts.baseUrl = provider.base_url;
                    opts.modelName = model.model_name;
                }
            }
        }
        const result = await (0, ai_1.parseUserIntent)(message, opts);
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ error: "AI parsing failed" });
    }
});
exports.default = router;
