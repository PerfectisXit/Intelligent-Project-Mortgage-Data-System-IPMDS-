"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserIntent = parseUserIntent;
const zod_1 = require("zod");
const ai_1 = require("../ai");
const aiResponseSchema = zod_1.z.object({
    intent: zod_1.z.string().optional(),
    unit_no: zod_1.z.string().optional(),
    buyer_name: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    currency: zod_1.z.string().optional(),
    txn_type: zod_1.z.enum(["定金", "首付", "分期款", "尾款"]).optional(),
    missing_fields: zod_1.z.array(zod_1.z.string()).default([]),
    reply: zod_1.z.string().optional(),
});
const systemPrompt = `
你是房地产工抵台账助手。你的任务是从用户输入中提取结构化字段，并且只输出 JSON。

需要提取的字段：
- unit_no: 房号，例如 A1-1002
- buyer_name: 客户姓名
- amount: 金额（数字）
-   txn_type: 款项类型，只能是 定金 / 首付 / 分期款 / 尾款

关键约束：
- 如果信息缺失，必须在 missing_fields 里列出缺失字段名，并在 reply 中追问。
- 不要猜测缺失字段。
- 输出必须是严格 JSON，禁止输出多余文本。

输出示例：
{
  "unit_no": "A1-1002",
  "buyer_name": "张三",
  "amount": 500000,
  "txn_type": "定金",
  "missing_fields": [],
  "reply": "已记录张三的定金50万元。"
}
`.trim();
async function parseUserIntent(text, opts) {
    const apiKey = opts?.apiKey ?? process.env.AI_API_KEY;
    const baseUrl = opts?.baseUrl ?? process.env.AI_BASE_URL;
    const provider = apiKey
        ? (0, ai_1.getAiProvider)(baseUrl ? { apiKey, baseUrl } : { apiKey })
        : null;
    if (!provider) {
        return aiResponseSchema.parse({
            missing_fields: ["ai_api_key"],
            reply: "AI 未配置：请先设置 AI_API_KEY",
        });
    }
    const content = await provider.chat(opts?.modelName || process.env.AI_MODEL_NAME || "gpt-4.1-mini", [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
    ]);
    let parsed;
    try {
        parsed = JSON.parse(content);
    }
    catch (err) {
        return aiResponseSchema.parse({
            missing_fields: [],
            reply: content || "AI response is not valid JSON",
        });
    }
    return aiResponseSchema.parse(parsed);
}
