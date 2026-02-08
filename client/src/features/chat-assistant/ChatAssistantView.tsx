import { Button, Card, Input, Typography } from "antd";
import styles from "./ChatAssistant.module.css";

const { Text } = Typography;

export type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  entities?: Record<string, unknown>;
};

type Props = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onConfirm?: (entities: Record<string, unknown>) => void;
};

export default function ChatAssistantView({
  messages,
  input,
  loading,
  onInputChange,
  onSend,
  onConfirm,
}: Props) {
  const labelMap: Record<string, string> = {
    unit_no: "房号",
    buyer_name: "客户",
    amount: "金额",
    txn_type: "款项类型",
    currency: "币种",
  };

  return (
    <div className={styles.chatRoot}>
      <div className={styles.chatList}>
        {messages.map((item) => {
          const isUser = item.role === "user";
          const hasEntities =
            item.entities && Object.keys(item.entities).length > 0;

          return (
            <div
              key={item.id}
              className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAi}`}
            >
              <div
                className={`${styles.bubble} ${
                  isUser ? styles.bubbleUser : styles.bubbleAi
                }`}
              >
                <div style={{ whiteSpace: "pre-wrap" }}>{item.text}</div>
                {!isUser && hasEntities && (
                  <Card size="small" style={{ marginTop: 8 }}>
                    {Object.entries(item.entities || {}).map(([k, v]) => {
                      const label = labelMap[k] || k;
                      const value =
                        k === "amount" && typeof v === "number"
                          ? v.toLocaleString("zh-CN")
                          : String(v);
                      return (
                        <div key={k} style={{ display: "flex", gap: 8 }}>
                          <Text type="secondary">{label}</Text>
                          <Text>{value}</Text>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        block
                        onClick={() => onConfirm?.(item.entities || {})}
                      >
                        确认录入
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
        {loading && <div className={styles.typing}>对方正在输入...</div>}
      </div>

      <div className={styles.inputBar}>
        <Input.TextArea
          rows={3}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="请输入指令，例如：张三买了A1-1002，先付20万"
        />
        <div className={styles.sendRow}>
          <Button type="primary" onClick={onSend} disabled={!input.trim() || loading} block>
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
