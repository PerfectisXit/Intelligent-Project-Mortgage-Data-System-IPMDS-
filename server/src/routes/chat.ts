import { Router } from "express";

import { parseUserIntent } from "../services/ai";
import prisma from "../prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const apiKey = String(req.header("x-ai-api-key") || "");
    const baseUrl = String(req.header("x-ai-base-url") || "");
    const modelName = String(req.header("x-ai-model-name") || "");

    const opts: { apiKey?: string; baseUrl?: string; modelName?: string } = {};
    if (apiKey) opts.apiKey = apiKey;
    if (baseUrl) opts.baseUrl = baseUrl;
    if (modelName) opts.modelName = modelName;

    if (!opts.apiKey) {
      const providerId = Number(req.body?.provider_id || 0);
      const modelId = Number(req.body?.model_id || 0);
      if (providerId && modelId) {
        const provider = await prisma.ai_providers.findUnique({
          where: { id: providerId },
        });
        const model = await prisma.ai_models.findUnique({
          where: { id: modelId },
        });
        if (provider?.api_key && model?.model_name) {
          opts.apiKey = provider.api_key;
          opts.baseUrl = provider.base_url;
          opts.modelName = model.model_name;
        }
      }
    }

    const result = await parseUserIntent(message, opts);
    return res.json({
      reply: result.reply || "",
      entities: {
        unit_no: result.unit_no,
        buyer_name: result.buyer_name,
        amount: result.amount,
        currency: result.currency,
        txn_type: result.txn_type,
      },
      missing_fields: result.missing_fields || [],
    });
  } catch (err) {
    return res.status(500).json({ error: "AI parsing failed" });
  }
});

export default router;
