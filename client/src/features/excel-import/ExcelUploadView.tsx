import { Card, Statistic, Table, Tabs, Upload } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { SummaryRow } from "../../types/api";
import styles from "./ExcelUpload.module.css";

export type AddedRow = {
  unit_no: string;
  status: string;
  area_m2: number;
  buyer_name?: string;
};

export type ModifiedRow = {
  unit_no: string;
  diffs: Record<string, { excel: string; db: string }>;
};

export type Stats = {
  added: number;
  modified: number;
  unchanged: number;
};

export type { SummaryRow };

type Props = {
  loading: boolean;
  addedRows: AddedRow[];
  modifiedRows: ModifiedRow[];
  stats: Stats;
  uploadProps: UploadProps;
  mode: "unit" | "summary";
  onModeChange: (mode: "unit" | "summary") => void;
  summaryRows: SummaryRow[];
};

export default function ExcelUploadView({
  loading,
  addedRows,
  modifiedRows,
  stats,
  uploadProps,
  mode,
  onModeChange,
  summaryRows,
}: Props) {
  const formatAmount = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toFixed(2);
  };

  const formatInteger = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return String(Math.round(n));
  };

  const addedColumns = [
    { title: "房号", dataIndex: "unit_no" },
    { title: "状态", dataIndex: "status" },
    { title: "面积", dataIndex: "area_m2" },
    { title: "买受人", dataIndex: "buyer_name" },
  ];

  const modifiedColumns = [
    { title: "房号", dataIndex: "unit_no" },
    {
      title: "变更字段",
      render: (row: ModifiedRow) =>
        Object.keys(row.diffs)
          .map((k) => `${k}: ${row.diffs[k].db} → ${row.diffs[k].excel}`)
          .join("；"),
    },
  ];

  const summaryColumns = [
    { title: "项目公司", dataIndex: "project_company", width: 240, ellipsis: true },
    { title: "项目名称", dataIndex: "project_name", width: 180, ellipsis: true },
    { title: "参建单位", dataIndex: "contractor", width: 260, ellipsis: true },
    { title: "业态", dataIndex: "business_type", width: 100 },
    {
      title: "GD套数",
      dataIndex: "gd_units",
      width: 100,
      align: "right" as const,
      render: (v: unknown) => formatInteger(v),
    },
    {
      title: "GD面积(m2)",
      dataIndex: "gd_area_m2",
      width: 130,
      align: "right" as const,
      render: (v: unknown) => formatAmount(v),
    },
    {
      title: "GD成交单价",
      dataIndex: "gd_price_per_m2",
      width: 140,
      align: "right" as const,
      render: (v: unknown) => formatAmount(v),
    },
    {
      title: "GD成交总价(万)",
      dataIndex: "gd_total_price_10k",
      width: 150,
      align: "right" as const,
      render: (v: unknown) => formatAmount(v),
    },
    {
      title: "签约金额(万)",
      dataIndex: "signed_amount_10k",
      width: 140,
      align: "right" as const,
      render: (v: unknown) => formatAmount(v),
    },
    {
      title: "已收款(万)",
      dataIndex: "received_10k",
      width: 130,
      align: "right" as const,
      render: (v: unknown) => formatAmount(v),
    },
    {
      title: "未达款(万)",
      dataIndex: "unpaid_10k",
      width: 130,
      align: "right" as const,
      render: (v: unknown) => formatAmount(v),
    },
  ];

  return (
    <div className={styles.uploadRoot}>
      <Upload.Dragger {...uploadProps} disabled={loading} className={styles.dragger}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">拖拽或点击上传 Excel</p>
        <p className="ant-upload-hint">支持 .xlsx / .xls</p>
      </Upload.Dragger>

      <div className={styles.statsGrid}>
        <Card style={{ flex: 1 }}>
          <Statistic title="新增" value={stats.added} />
        </Card>
        <Card style={{ flex: 1 }}>
          <Statistic title="变更" value={stats.modified} />
        </Card>
        <Card style={{ flex: 1 }}>
          <Statistic title="无变化" value={stats.unchanged} />
        </Card>
      </div>

      <Tabs
        className={styles.tabsBlock}
        activeKey={mode}
        onChange={(key) => onModeChange(key as "unit" | "summary")}
        items={[
          {
            key: "unit",
            label: "房源台账",
            children: (
              <Tabs
                items={[
                  {
                    key: "added",
                    label: `新增列表 (${addedRows.length})`,
                    children: (
                      <Table
                        rowKey="unit_no"
                        columns={addedColumns}
                        dataSource={addedRows}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                      />
                    ),
                  },
                  {
                    key: "modified",
                    label: `变更详情 (${modifiedRows.length})`,
                    children: (
                      <Table
                        rowKey="unit_no"
                        columns={modifiedColumns}
                        dataSource={modifiedRows}
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: "summary",
            label: "项目汇总",
            children: (
              summaryRows.length > 0 ? (
                <div className={styles.tableWrap}>
                  <Table
                    rowKey={(row) =>
                      `${row.project_company}-${row.project_name}-${row.business_type}`
                    }
                    columns={summaryColumns}
                    dataSource={summaryRows}
                    loading={loading}
                    scroll={{ x: 1750 }}
                    tableLayout="fixed"
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ) : (
                <div style={{ padding: 16, color: "#666" }}>
                  请上传项目汇总表（含项目公司/项目名称/GD面积等字段）
                </div>
              )
            ),
          },
        ]}
      />
    </div>
  );
}
