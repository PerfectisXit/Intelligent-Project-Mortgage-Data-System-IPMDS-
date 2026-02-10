# IPMDS 新人上手指南

## 1. 代码库整体结构（一句话版）

这是一个**三服务协同**的全栈系统：
- `client/`：React 前端，负责 Excel 导入页面、AI 助手交互与设置。
- `server/`：Node.js + Express API，负责主业务接口、AI 配置和落库。
- `data_service/`：FastAPI 数据服务，负责 Excel 解析、表头识别和差异比对。
- `db/` + `docker-compose.yml`：数据库初始化与本地基础设施。

## 2. 按目录看职责边界

### `client/`（前端）

核心入口：
- `src/pages/Dashboard.tsx`：主页面布局，挂载“Excel 导入”和“AI 助理”两大功能。
- `src/features/excel-import/`：上传 Excel，触发后端分析，展示新增/变更差异。
- `src/features/chat-assistant/`：聊天消息流，拿到 AI 结构化结果后可确认写入交易。
- `src/features/settings/`：配置 AI 供应商、模型、默认选项并支持连通性测试。
- `src/services/`：统一 HTTP 请求封装和 API 调用。

你可以把前端理解成：
1) 上传文件 -> 2) 请求数据服务 -> 3) 展示比对结果；
以及 1) 自然语言输入 -> 2) 请求 AI 解析 -> 3) 二次确认后写入交易。

### `server/`（主 API 服务）

核心入口：
- `src/app.ts`：注册路由与中间件。
- `src/index.ts`：启动服务并连接数据库。

关键路由：
- `routes/units.ts`：查询房源台账。
- `routes/transactions.ts`：创建交易流水（需找到对应 `unit_no`）。
- `routes/chat.ts`：调用 AI 意图解析，输出结构化字段。
- `routes/ai.ts`：管理 AI 供应商/模型/默认设置，内置 provider + model seed。

数据层：
- Prisma schema 在 `prisma/schema.prisma`，定义 `units`、`transactions`、`files`、`import_logs`、`ai_*` 等模型。

### `data_service/`（Excel 智能处理）

核心入口：
- `main.py`：`/analyze` 接口，按 `mode=summary|unit` 分流。

关键逻辑：
- `services/diff_engine.py`：
  - 表头智能识别（中英文/别名）
  - 明细模式：与数据库 `units` 对比，产出 `added_rows`/`modified_rows`
  - 汇总模式：清洗“合计/注释/小计”并返回结构化行数据

### `db/` 和 `docker-compose.yml`

- `db/init.sql`：建表、约束、注释、AI 配置表初始化。
- `docker-compose.yml`：本地拉起 PostgreSQL + pgAdmin。

## 3. 作为新人必须先搞懂的 8 个关键点

1. **双后端分工**：
   - `server` 管“业务 API + AI 配置 + 交易入库”；
   - `data_service` 管“Excel 计算和比对”。

2. **前端代理链路**：
   - `/api` -> `server:3000`
   - `/data-service` -> `data_service:8000`

3. **Excel 两种模式语义**：
   - `summary`：聚合口径，偏报表；
   - `unit`：单房号口径，偏差异追踪。

4. **数据模型主线**：
   - `units`（房源）是中心实体，`transactions`、`files` 都围绕它。

5. **AI 能力边界**：
   - AI 先做“解析建议”，最终落库要经过显式确认。

6. **BigInt/Decimal 序列化问题**：
   - 后端多处做 BigInt 安全转换，前端拿到的是字符串化 id。

7. **默认配置依赖数据库**：
   - AI provider/model/settings 都在库里，初次跑起来需确认 seed 生效。

8. **这套系统偏“台账+导入治理”而非纯 CRUD**：
   - 重点是“导入质量、差异可追踪、结构化沉淀”。

## 4. 建议的学习顺序（3 天版）

### Day 1：跑通系统 + 看主流程
1. 按 README 启动 PostgreSQL、server、data_service、client。
2. 用一份示例 Excel 走一遍 `summary` 和 `unit`。
3. 在浏览器 Network 面板对照请求路径，看前端如何分别打到两个后端。

### Day 2：吃透后端接口与表结构
1. 读 `server/src/routes/*.ts`，画出 API 到数据库的映射。
2. 读 `server/prisma/schema.prisma` 与 `db/init.sql`，理解约束和业务枚举。
3. 验证一条聊天录入到交易创建的闭环。

### Day 3：吃透 Excel 引擎
1. 读 `data_service/services/diff_engine.py`，重点看：
   - 表头规范化
   - header row 识别
   - compare_dfs 差异算法
2. 自造“脏表头/缺字段/合并单元格”的 Excel 做回归。
3. 总结“哪些异常会抛 400，哪些走正常清洗”。

## 5. 你后续可以优先做的改进练习

- 给 `server` 路由补统一参数校验（如 zod）。
- 给 `data_service` 增加单元测试样本（重点覆盖表头别名和异常数据）。
- 给前端 `SettingsDrawer` 增加配置导入导出（便于多环境迁移）。
- 完成导入日志 `import_logs` 的全链路写入（当前更偏“分析结果返回”）。
- 增加“差异结果确认后批量回写 units”的可选流程。

---

如果你是带教，可以把这份文档当成新人第一周 checklist：
- 是否能解释三服务职责？
- 是否能独立定位一个接口跨层调用路径？
- 是否能复现并解释一次 Excel 差异输出？
