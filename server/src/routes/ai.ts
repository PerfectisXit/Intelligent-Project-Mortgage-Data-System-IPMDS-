import { Router } from "express";

import prisma from "../prisma";

const router = Router();

const BUILTIN_PROVIDERS = [
  { slug: "siliconflow", name: "硅基流动", base_url: "https://api.siliconflow.cn/v1" },
  { slug: "kimi", name: "Kimi (Moonshot)", base_url: "https://api.moonshot.ai/v1" },
  { slug: "kimi-coding", name: "Kimi Coding Plan", base_url: "https://api.kimi.com/coding/v1" },
  { slug: "minimax-cn", name: "MiniMax 国内版", base_url: "https://api.minimaxi.com/v1" },
  { slug: "zhipu", name: "智谱", base_url: "https://open.bigmodel.cn/api/paas/v4" },
  { slug: "zai-coding", name: "Z.AI Coding Plan", base_url: "https://api.z.ai/api/coding/paas/v4" },
  { slug: "openai", name: "OpenAI", base_url: "https://api.openai.com/v1" },
  {
    slug: "google",
    name: "Google Gemini",
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
  { slug: "openrouter", name: "OpenRouter", base_url: "https://openrouter.ai/api/v1" },
];

const BUILTIN_MODELS: Record<string, Array<{ name: string; model_name: string }>> = {
  siliconflow: [
    { name: "Qwen2.5 72B Instruct", model_name: "Qwen/Qwen2.5-72B-Instruct" },
    { name: "QwQ 32B", model_name: "Qwen/QwQ-32B" },
  ],
  kimi: [
    { name: "Kimi K2 Preview", model_name: "kimi-k2-0711-preview" },
    { name: "Kimi K2.5", model_name: "kimi-k2.5" },
  ],
  "kimi-coding": [
    { name: "Kimi K2.5 (Coding)", model_name: "kimi-k2.5" },
  ],
  "minimax-cn": [
    { name: "MiniMax-M2.1", model_name: "MiniMax-M2.1" },
    { name: "MiniMax-M2", model_name: "MiniMax-M2" },
  ],
  zhipu: [
    { name: "GLM-4.5", model_name: "glm-4.5" },
    { name: "GLM-4.5-Flash", model_name: "glm-4.5-flash" },
  ],
  "zai-coding": [
    { name: "GLM-4.7", model_name: "glm-4.7" },
    { name: "GLM-4.6", model_name: "glm-4.6" },
    { name: "GLM-4.5", model_name: "glm-4.5" },
    { name: "GLM-4.5-Air", model_name: "glm-4.5-air" },
  ],
  openai: [
    { name: "GPT-4o mini", model_name: "gpt-4o-mini" },
    { name: "GPT-4o", model_name: "gpt-4o" },
  ],
  google: [
    { name: "Gemini 2.5 Flash", model_name: "gemini-2.5-flash" },
    { name: "Gemini 1.5 Pro", model_name: "gemini-1.5-pro" },
  ],
  openrouter: [
    { name: "Claude 3.7 Sonnet", model_name: "anthropic/claude-3.7-sonnet" },
    { name: "DeepSeek V3.1", model_name: "deepseek/deepseek-chat-v3.1" },
  ],
};

async function ensureSeed() {
  for (const p of BUILTIN_PROVIDERS) {
    const provider = await prisma.ai_providers.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        base_url: p.base_url,
        is_builtin: true,
      },
      create: {
        slug: p.slug,
        name: p.name,
        base_url: p.base_url,
        is_builtin: true,
      },
    });

    const models = BUILTIN_MODELS[p.slug] || [];
    for (const m of models) {
      await prisma.ai_models.upsert({
        where: { provider_id_model_name: { provider_id: provider.id, model_name: m.model_name } },
        update: { name: m.name, is_builtin: true },
        create: {
          provider_id: provider.id,
          name: m.name,
          model_name: m.model_name,
          is_builtin: true,
        },
      });
    }
  }
}

router.get("/providers", async (_req, res) => {
  await ensureSeed();
  const providers = await prisma.ai_providers.findMany({
    orderBy: { id: "asc" },
    include: { ai_models: true },
  });
  const safe = JSON.parse(
    JSON.stringify(providers, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  res.json({ data: safe });
});

router.post("/providers", async (req, res) => {
  const { name, base_url, api_key, slug } = req.body || {};
  if (!name || !base_url) {
    return res.status(400).json({ error: "name and base_url are required" });
  }
  const finalSlug = (slug || name).toLowerCase().replace(/\s+/g, "-");
  const provider = await prisma.ai_providers.create({
    data: {
      slug: finalSlug,
      name,
      base_url,
      api_key: api_key || null,
      is_builtin: false,
    },
  });
  const safe = JSON.parse(
    JSON.stringify(provider, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  res.json({ data: safe });
});

router.patch("/providers/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, base_url, api_key } = req.body || {};
  const provider = await prisma.ai_providers.update({
    where: { id },
    data: {
      name: name || undefined,
      base_url: base_url || undefined,
      api_key: api_key ?? undefined,
      updated_at: new Date(),
    },
  });
  const safe = JSON.parse(
    JSON.stringify(provider, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  res.json({ data: safe });
});

router.post("/models", async (req, res) => {
  const { provider_id, name, model_name } = req.body || {};
  if (!provider_id || !name || !model_name) {
    return res.status(400).json({ error: "provider_id, name, model_name required" });
  }
  const model = await prisma.ai_models.create({
    data: {
      provider_id: Number(provider_id),
      name,
      model_name,
      is_builtin: false,
    },
  });
  const safe = JSON.parse(
    JSON.stringify(model, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  res.json({ data: safe });
});

router.get("/settings", async (_req, res) => {
  const settings = await prisma.ai_settings.findUnique({ where: { id: 1 } });
  const safe = JSON.parse(
    JSON.stringify(settings, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  res.json({ data: safe });
});

router.put("/settings", async (req, res) => {
  const { default_provider_id, default_model_id } = req.body || {};
  const settings = await prisma.ai_settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      default_provider_id: default_provider_id ?? null,
      default_model_id: default_model_id ?? null,
      updated_at: new Date(),
    },
    update: {
      default_provider_id: default_provider_id ?? null,
      default_model_id: default_model_id ?? null,
      updated_at: new Date(),
    },
  });
  const safe = JSON.parse(
    JSON.stringify(settings, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  res.json({ data: safe });
});

router.post("/test", async (req, res) => {
  const { provider_id, model_id } = req.body || {};
  if (!provider_id || !model_id) {
    return res.status(400).json({ error: "provider_id and model_id required" });
  }

  const provider = await prisma.ai_providers.findUnique({
    where: { id: Number(provider_id) },
  });
  const model = await prisma.ai_models.findUnique({
    where: { id: Number(model_id) },
  });
  if (!provider || !model) {
    return res.status(404).json({ error: "provider or model not found" });
  }
  if (!provider.api_key) {
    return res.status(400).json({ error: "api_key not configured" });
  }

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    apiKey: provider.api_key,
    baseURL: provider.base_url,
  });

  const start = Date.now();
  const resp = await client.chat.completions.create({
    model: model.model_name,
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 5,
  });
  const latency_ms = Date.now() - start;
  const content = resp.choices[0]?.message?.content ?? "";

  return res.json({ ok: true, latency_ms, sample: content });
});

export default router;
