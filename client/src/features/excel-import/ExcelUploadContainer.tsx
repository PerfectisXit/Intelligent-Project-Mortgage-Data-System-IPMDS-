import { message } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";

import { analyzeExcel } from "../../services/data";
import ExcelUploadView from "./ExcelUploadView";
import type { AddedRow, ModifiedRow, Stats, SummaryRow } from "./ExcelUploadView";

export default function ExcelUploadContainer() {
  const [loading, setLoading] = useState(false);
  const [addedRows, setAddedRows] = useState<AddedRow[]>([]);
  const [modifiedRows, setModifiedRows] = useState<ModifiedRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    added: 0,
    modified: 0,
    unchanged: 0,
  });
  const [mode, setMode] = useState<"unit" | "summary">("summary");
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);

  const uploadProps: UploadProps = {
    name: "file",
    accept: ".xlsx,.xls",
    multiple: false,
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setLoading(true);
        const res = await analyzeExcel(file as File, 88, mode);
        if (res.data.mode === "summary") {
          setSummaryRows(res.data.summary_rows || []);
          setStats({ added: 0, modified: 0, unchanged: 0 });
        } else {
          setAddedRows(res.data.added_rows || []);
          setModifiedRows(res.data.modified_rows || []);
          setStats(res.data.stats || { added: 0, modified: 0, unchanged: 0 });
        }

        message.success("分析完成");
        onSuccess?.(res.data);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "分析失败");
        onError?.(err as Error);
      } finally {
        setLoading(false);
      }
    },
  };

  return (
    <ExcelUploadView
      loading={loading}
      addedRows={addedRows}
      modifiedRows={modifiedRows}
      stats={stats}
      uploadProps={uploadProps}
      mode={mode}
      onModeChange={setMode}
      summaryRows={summaryRows}
    />
  );
}
