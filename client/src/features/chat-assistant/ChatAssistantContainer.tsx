import { useMemo, useState } from "react";

import { sendChat } from "../../services/ai";
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

  return (
    <ChatAssistantView
      messages={messages}
      input={input}
      loading={loading}
      onInputChange={setInput}
      onSend={canSend ? sendMessage : () => undefined}
    />
  );
}
