# IPMDS - Intelligent Project Mortgage Data System

智能工抵台账管理系统

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](#)

A full-stack intelligent ledger management system for project mortgage data, featuring Excel import with automatic difference detection, AI-powered chat assistant, and financial data tracking.

## Features

- **Excel Import & Comparison**
  - Upload Excel files (.xlsx, .xls)
  - Automatic header recognition (支持中文/English headers)
  - Intelligent diff engine to detect new and modified records
  - Summary mode for aggregated financial reports
  - Unit mode for detailed unit-by-unit comparison

- **AI Chat Assistant**
  - Natural language data entry
  - Automatic structured information extraction
  - Configurable AI providers (OpenAI compatible)

- **Data Management**
  - Project unit tracking (房号, 面积, 状态, 买受人)
  - Financial transaction records
  - Company/contractor management
  - File attachments with OCR support

- **Multi-Service Architecture**
  - Modern React + TypeScript frontend
  - Node.js/Express API server with Prisma ORM
  - Python/FastAPI data processing service
  - PostgreSQL database with pgAdmin

## Tech Stack

### Frontend (Client)
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Library**: Ant Design 6
- **HTTP Client**: Axios
- **Date Handling**: Day.js

### Backend (Server)
- **Runtime**: Node.js + Express 5
- **Language**: TypeScript 5
- **Database**: PostgreSQL + Prisma ORM
- **AI Integration**: OpenAI SDK + Zod validation
- **CORS**: Enabled for cross-origin requests

### Data Service
- **Framework**: FastAPI (Python)
- **Data Processing**: Pandas, NumPy, OpenPyXL
- **Database**: SQLAlchemy + psycopg2
- **Features**: Excel parsing, header detection, diff engine

### Infrastructure
- **Database**: PostgreSQL 16 (with pgvector support)
- **Admin Tool**: pgAdmin 4
- **Containerization**: Docker Compose

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── features/       # Feature modules
│   │   │   ├── excel-import/    # Excel upload & comparison
│   │   │   ├── chat-assistant/  # AI chat interface
│   │   │   └── settings/        # AI provider settings
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── ai/             # AI provider implementations
│   │   └── generated/      # Prisma generated types
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── data_service/           # Python data processing service
│   ├── services/
│   │   └── diff_engine.py  # Excel comparison engine
│   ├── database.py         # Database connection
│   └── main.py             # FastAPI entry point
├── db/
│   └── init.sql            # Database initialization
└── docker-compose.yml      # Docker orchestration
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 1. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- pgAdmin on port 5050 (login: admin@ipmds.local / admin123)

### 2. Setup Database Schema

```bash
cd server
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client and sync schema
npm run prisma:generate
npm run prisma:pull
```

### 3. Start Backend Server

```bash
cd server
npm install
npm run dev
```

Server runs on http://localhost:3000

### 4. Start Data Service

```bash
cd data_service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Data service runs on http://localhost:8000

### 5. Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## API Endpoints

### Main Server (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/units | List/search units |
| POST | /api/chat | AI intent parsing |
| GET | /api/ai/providers | List AI providers |
| GET | /api/ai/models | List AI models |

### Data Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /analyze | Analyze Excel file (mode: summary or unit) |

### Parameters for /analyze
- `project_id` (int, required): Project identifier
- `mode` (string): "summary" or "unit"
- `file` (file, required): Excel file to analyze

## Database Schema

### Core Tables
- **companies** - Company/contractor information
- **units** - Project units/properties (房号, 面积, 状态, etc.)
- **transactions** - Financial transactions
- **files** - Uploaded files with OCR text
- **import_logs** - Import operation history

### AI Configuration Tables
- **ai_providers** - AI service providers (OpenAI, etc.)
- **ai_models** - Available AI models
- **ai_settings** - Default provider/model settings

## Excel Import Features

### Supported Header Formats (自动识别)

**Unit Mode Fields:**
- 房号: 房号, 房屋编号, 房间号, unit, unit_no
- 状态: 状态, 当前状态, 工抵状态, 签约状态, status
- 面积: 面积, 建筑面积, 实测面积, area, area_m2
- 买受人: 买受人, 客户名称, 客户, 购房人, buyer_name

**Summary Mode Fields:**
- 项目公司, 项目名称, 参建单位, 业态
- GD套数, GD面积, GD成交单价, GD成交总价
- 签约金额, GD已收款, GD未达款

### Diff Engine

Compares uploaded Excel against database and identifies:
- **Added Rows** - New units not in database
- **Modified Rows** - Units with changed fields (status, area, buyer)
- **Stats** - Summary counts of changes

## AI Configuration

Configure AI providers through the Settings UI or database:

```sql
-- Add OpenAI provider
INSERT INTO ai_providers (slug, name, base_url, api_key)
VALUES ('openai', 'OpenAI', 'https://api.openai.com/v1', 'your-api-key');

-- Add model
INSERT INTO ai_models (provider_id, name, model_name)
VALUES (1, 'GPT-4', 'gpt-4');
```

## Development

### Client Development
```bash
cd client
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check
```

### Server Development
```bash
cd server
npm run dev      # Start with ts-node
npm run build    # Compile TypeScript
npm start        # Run compiled code
```

### Database Migrations
```bash
cd server
npm run prisma:pull     # Pull schema from database
npm run prisma:generate # Generate Prisma client
```

## Environment Variables

### Server (.env)
```env
DATABASE_URL="postgresql://ipmds_user:ipmds_pass@localhost:5432/ipmds"
PORT=3000
```

### Client
No environment variables required for basic operation. API calls use relative URLs.

## License

MIT

## Author

Created for Intelligent Project Mortgage Data Management
