import { Button, Space, Tag } from "antd";
import { useState } from "react";

import ExcelUploadContainer from "../features/excel-import/ExcelUploadContainer";
import ChatAssistantContainer from "../features/chat-assistant/ChatAssistantContainer";
import SettingsDrawer from "../features/settings/SettingsDrawer";
import "../App.css";

export default function Dashboard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          <h1>智能工抵台账管理系统</h1>
          <span>Excel 智能比对 · 资金台账 · AI 助理录入</span>
        </div>
        <Space size={12}>
          <Tag color="gold">Beta</Tag>
          <Button onClick={() => setOpen(true)}>设置</Button>
        </Space>
      </header>

      <main className="app-body">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Excel 导入与差异比对</h3>
              <p className="panel-subtitle">
                自动识别新增与变更，生成可视化差异清单
              </p>
            </div>
          </div>
          <div className="panel-body">
            <ExcelUploadContainer />
          </div>
        </section>

        <aside className="panel panel-chat">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">AI 对话助手</h3>
              <p className="panel-subtitle">自然语言录入，自动提取结构化信息</p>
            </div>
          </div>
          <div className="panel-body panel-body-chat">
            <ChatAssistantContainer />
          </div>
        </aside>
      </main>

      <footer className="footer">IPMDS © 2026</footer>

      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
