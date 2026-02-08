# IPMDS v0.1.1 版本发布说明

## 版本概述

这是 IPMDS（智能工抵台账管理系统）的首次功能完整版本，修复了多个关键问题，使系统达到可用状态。

## 新功能

### 1. AI 智能助手录入功能
- 支持自然语言输入，自动提取结构化信息
- 提取字段：房号、客户姓名、金额、款项类型
- 支持"确认录入"按钮，一键创建交易记录
- 可配置多种 AI 供应商（OpenAI、硅基流动、Kimi、智谱等）

### 2. Excel 智能导入与比对
- 支持 .xlsx / .xls 格式文件上传
- 自动识别表头（支持中文/英文）
- 两种分析模式：
  - 房源台账模式：比对数据库，识别新增和变更
  - 项目汇总模式：解析项目公司、参建单位、GD面积等汇总数据
- 可配置项目 ID（通过 localStorage）

### 3. 多供应商 AI 配置
- 内置 8 家 AI 供应商配置
- 支持自定义添加供应商和模型
- 配置保存到数据库，持久化存储

## 问题修复

### 高优先级修复
- 客户端构建失败 - 已修复 TypeScript 类型错误
- AI 数据库表缺失 - 已修复初始化脚本
- 聊天接口协议不一致 - 已统一前后端格式
- 自定义供应商表单绑定错误 - 已修复表单获取

### 中优先级修复
- BigInt 序列化 - 已修复
- AI 枚举不匹配 - 已统一款项类型
- systemPrompt null 示例 - 已移除 null 值
- 硬编码 project_id - 已支持配置

### 低优先级修复
- 确认录入按钮无功能 - 已添加完整流程
- Docker Compose 配置 - 已简化

## 快速开始

### 环境要求
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 启动步骤

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 启动后端
cd server && npm install && npm run dev

# 3. 启动数据服务
cd data_service && uvicorn main:app --reload --port 8000

# 4. 启动前端
cd client && npm install && npm run dev
```

### 访问地址
- 前端界面：http://localhost:5173
- 后端 API：http://localhost:3000
- 数据服务：http://localhost:8000
- pgAdmin：http://localhost:5050

## 使用指南

### 首次使用

1. 设置项目 ID（浏览器控制台）：
   localStorage.setItem("project_id", "88")

2. 配置 AI 供应商：
   - 点击右上角「设置」
   - 选择供应商并输入 API Key
   - 点击「保存到后端」

3. 测试 AI 录入：
   - 在 AI 助手输入：张三买了 A1-1002，付了 20 万定金
   - 点击「确认录入」创建交易

## 技术架构

### 前端
- React 19 + TypeScript
- Vite 构建工具
- Ant Design 6 UI 组件库

### 后端
- Node.js + Express 5
- TypeScript
- Prisma ORM
- PostgreSQL 数据库

### 数据服务
- Python + FastAPI
- Pandas + NumPy 数据处理

## 数据库表结构

### 核心表
- units - 房源台账
- transactions - 交易流水
- files - 附件文件
- companies - 公司主体
- import_logs - 导入日志

### AI 配置表
- ai_providers - AI 供应商
- ai_models - AI 模型
- ai_settings - AI 默认设置

## 贡献者

@PerfectisXit

## 更新日期

2026-02-09
