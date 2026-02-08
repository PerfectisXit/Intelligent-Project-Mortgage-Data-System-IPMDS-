CREATE EXTENSION IF NOT EXISTS vector;

-- Units: 房源表
CREATE TABLE IF NOT EXISTS units (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  building_no TEXT NOT NULL,
  unit_no TEXT NOT NULL,
  business_type TEXT NOT NULL,
  area_m2 NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  buyer_name TEXT,
  buyer_company_id BIGINT,
  attrs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_unit UNIQUE (project_id, building_no, unit_no),
  CONSTRAINT ck_unit_status CHECK (status IN ('认购','签约','工抵完成'))
);

COMMENT ON TABLE units IS '房源台账主表';
COMMENT ON COLUMN units.project_id IS '项目ID';
COMMENT ON COLUMN units.building_no IS '楼栋号';
COMMENT ON COLUMN units.unit_no IS '房号';
COMMENT ON COLUMN units.business_type IS '业态类型';
COMMENT ON COLUMN units.area_m2 IS '建筑面积';
COMMENT ON COLUMN units.status IS '当前状态';
COMMENT ON COLUMN units.buyer_name IS '买受人名称（文本冗余方便检索）';
COMMENT ON COLUMN units.buyer_company_id IS '买受人主体（公司/法人）';
COMMENT ON COLUMN units.attrs IS '扩展字段';

-- Transactions: 资金流水表
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  unit_id BIGINT NOT NULL,
  txn_type TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  occurred_at DATE NOT NULL,
  memo TEXT,
  created_by BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_txn_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
  CONSTRAINT ck_txn_type CHECK (txn_type IN ('定金','首付','分期款','尾款'))
);

COMMENT ON TABLE transactions IS '资金流水，多笔记录对应同一房源';
COMMENT ON COLUMN transactions.unit_id IS '关联房源';
COMMENT ON COLUMN transactions.txn_type IS '资金类型';
COMMENT ON COLUMN transactions.amount IS '金额';
COMMENT ON COLUMN transactions.occurred_at IS '发生日期';

-- Files: 文件表
CREATE TABLE IF NOT EXISTS files (
  id BIGSERIAL PRIMARY KEY,
  unit_id BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  ocr_text TEXT,
  ocr_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_file_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
  CONSTRAINT ck_file_type CHECK (file_type IN ('协议','确认单','收据','其他'))
);

COMMENT ON TABLE files IS '协议与确认单等附件';
COMMENT ON COLUMN files.unit_id IS '关联房源';
COMMENT ON COLUMN files.file_uri IS '存储地址';
COMMENT ON COLUMN files.ocr_text IS 'OCR识别文本';
COMMENT ON COLUMN files.ocr_meta IS 'OCR结构化结果';

-- Import_Logs: 导入日志
CREATE TABLE IF NOT EXISTS import_logs (
  id BIGSERIAL PRIMARY KEY,
  import_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  operator_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  CONSTRAINT ck_import_status CHECK (status IN ('处理中','成功','失败','已回滚'))
);

COMMENT ON TABLE import_logs IS '导入作业审计与回滚依据';
COMMENT ON COLUMN import_logs.stats IS '新增/更新/跳过数量';
COMMENT ON COLUMN import_logs.diff_snapshot IS '记录行级差异，用于回滚与追踪';

-- Buyer/Company: 主体表（用于消歧与规范化）
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  alias JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_company_name UNIQUE (name)
);

COMMENT ON TABLE companies IS '公司主体，用于买受人/施工单位等';
COMMENT ON COLUMN companies.alias IS '别名/简称映射';

ALTER TABLE units
  ADD CONSTRAINT fk_units_company FOREIGN KEY (buyer_company_id) REFERENCES companies(id) ON DELETE SET NULL;
