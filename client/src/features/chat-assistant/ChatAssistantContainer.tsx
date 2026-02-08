import { message } from "antd";
import { useMemo, useState } from "react";

import { createTransaction, sendChat } from "../../services/ai";
import { fetchSettings } from "../../services/aiCatalog";
import ChatAssistantView from "./ChatAssistantView";
import type { ChatMessage } from "./ChatAssistantView";

export default function ChatAssistantContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const settingsRes = await fetchSettings();
      const settings = settingsRes.data.data;
      const res = await sendChat(text, {
        providerId: settings?.default_provider_id ?? null,
        modelId: settings?.default_model_id ?? null,
      });

      const aiMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "ai",
        text: res.data.reply || "",
        entities: res.data.entities || {},
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const aiMsg: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "ai",
        text: err instanceof Error ? err.message : "请求失败，请稍后重试。",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(entities: Record<string, unknown>) {
    try {
      const today = new Date().toISOString().split("T")[0];
      await createTransaction({
        unit_no: entities.unit_no as string,
        buyer_name: entities.buyer_name as string,
        amount: entities.amount as number,
        currency: (entities.currency as string) || "CNY",
        txn_type: entities.txn_type as string,
        occurred_at: today,
        memo: "通过AI助手录入",
      });
      message.success("交易已录入");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "录入失败");
    }
  }

  return (
    <ChatAssistantView
      messages={messages}
      input={input}
      loading={loading}
      onInputChange={setInput}
      onSend={canSend ? sendMessage : () => undefined}
      onConfirm={handleConfirm}
    />
  );
}
