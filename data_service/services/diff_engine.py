from io import BytesIO
from typing import Dict, List

import pandas as pd
import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

KEY_FIELDS = ["status", "area_m2", "buyer_name"]

HEADER_ALIASES = {
    "unit_no": ["房号", "房屋编号", "房间号", "房间编号", "单元号", "房间全称", "unit", "unit_no"],
    "status": ["状态", "当前状态", "工抵状态", "签约状态", "销售状态", "status"],
    "area_m2": ["面积", "建筑面积", "实测面积", "面积㎡", "m2", "area", "area_m2"],
    "buyer_name": ["买受人", "客户名称", "客户", "客户姓名", "购房人", "buyer_name"],
}

SUMMARY_FIELDS = [
    "project_company",
    "project_name",
    "contractor",
    "business_type",
    "gd_units",
    "gd_area_m2",
    "gd_price_per_m2",
    "gd_total_price_10k",
    "signed_amount_10k",
    "received_10k",
    "unpaid_10k",
]

SUMMARY_ALIASES = {
    "project_company": ["项目公司", "公司", "项目公司名称"],
    "project_name": ["项目名称", "项目案名", "项目名称(项目案名)", "项目名称（项目案名）"],
    "contractor": ["参建单位", "分包", "总包", "施工单位"],
    "business_type": ["业态", "物业类型"],
    "gd_units": ["GD套数", "套数"],
    "gd_area_m2": ["GD面积(m2)", "GD面积（m2）", "GD面积", "面积(m2)"],
    "gd_price_per_m2": ["GD成交单价(元/m2)", "GD成交单价（元/m2）", "成交单价"],
    "gd_total_price_10k": ["GD成交总价(万元)", "GD成交总价（万元）", "成交总价(万元)"],
    "signed_amount_10k": ["签约金额(万元)", "签约金额（万元）", "签约金额"],
    "received_10k": ["GD已收款(万元)", "GD已收款（万元）", "已收款(万元)"],
    "unpaid_10k": ["GD未达款(万元)", "GD未达款（万元）", "未达款(万元)"],
}


def _normalize_header(name: str) -> str:
    return (
        str(name)
        .strip()
        .lower()
        .replace("\n", "")
        .replace("\r", "")
        .replace("\t", "")
        .replace(" ", "")
        .replace("（", "(")
        .replace("）", ")")
        .replace("㎡", "m2")
    )


def read_excel(file_content: bytes) -> pd.DataFrame:
    return pd.read_excel(BytesIO(file_content), header=None)


def _find_header_row(df: pd.DataFrame, alias_map: dict, max_scan_rows: int = 50) -> int:
    # locate a row that contains most of the aliases for the current mode
    best_row = 0
    best_score = -1
    best_text_cells = -1

    for i in range(min(max_scan_rows, len(df))):
        row = df.iloc[i].tolist()
        row_values = [str(v) for v in row if v == v]
        norm_values = [_normalize_header(v) for v in row_values]

        score = 0
        for _, aliases in alias_map.items():
            for alias in aliases:
                alias_norm = _normalize_header(alias)
                if any(alias_norm == v or alias_norm in v for v in norm_values):
                    score += 1
                    break

        text_cells = sum(1 for v in row_values if isinstance(v, str) and v.strip())

        if score > best_score or (score == best_score and text_cells > best_text_cells):
            best_score = score
            best_text_cells = text_cells
            best_row = i

    return best_row


def normalize_excel(df: pd.DataFrame) -> pd.DataFrame:
    header_row = _find_header_row(df, HEADER_ALIASES)
    raw_headers = [str(v).strip() for v in df.iloc[header_row].tolist()]
    data_df = df.iloc[header_row + 1 :].copy()
    data_df.columns = raw_headers

    # build normalized header map
    normalized_to_original = {_normalize_header(c): c for c in data_df.columns}

    rename_map = {}
    for target, aliases in HEADER_ALIASES.items():
        found = None
        for alias in aliases:
            key = _normalize_header(alias)
            if key in normalized_to_original:
                found = normalized_to_original[key]
                break
        if found:
            rename_map[found] = target

    df = data_df.rename(columns=rename_map)

    required_cols = ["unit_no"] + KEY_FIELDS
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        available = ", ".join([str(c) for c in df.columns])
        raise ValueError(
            f"Missing columns in Excel: {missing_cols}. Available: {available}"
        )

    df = df[required_cols].copy()
    df["unit_no"] = df["unit_no"].astype(str).str.strip()
    return df


def normalize_summary(df: pd.DataFrame) -> pd.DataFrame:
    header_row = _find_header_row(df, SUMMARY_ALIASES)
    raw_headers = [str(v).strip() for v in df.iloc[header_row].tolist()]
    data_df = df.iloc[header_row + 1 :].copy()
    data_df.columns = raw_headers

    normalized_to_original = {_normalize_header(c): c for c in data_df.columns}
    rename_map = {}
    for target, aliases in SUMMARY_ALIASES.items():
        found = None
        for alias in aliases:
            key = _normalize_header(alias)
            if key in normalized_to_original:
                found = normalized_to_original[key]
                break
        if found:
            rename_map[found] = target

    df = data_df.rename(columns=rename_map)
    missing_cols = [c for c in SUMMARY_FIELDS if c not in df.columns]
    if missing_cols:
        available = ", ".join([str(c) for c in df.columns])
        raise ValueError(
            f"Missing columns in Excel: {missing_cols}. Available: {available}"
        )
    return df[SUMMARY_FIELDS].copy()


def fetch_units_df(db: Session, project_id: int) -> pd.DataFrame:
    query = text(
        """
        SELECT unit_no, status, area_m2, buyer_name
        FROM units
        WHERE project_id = :project_id
        """
    )
    db_rows = db.execute(query, {"project_id": project_id}).mappings().all()
    df = pd.DataFrame(db_rows)
    if not df.empty:
        df["unit_no"] = df["unit_no"].astype(str).str.strip()
    return df


def compare_dfs(excel_df: pd.DataFrame, db_df: pd.DataFrame) -> Dict[str, List[dict]]:
    required_cols = ["unit_no"] + KEY_FIELDS
    if db_df.empty:
        added_rows = excel_df.to_dict(orient="records")
        return {
            "added_rows": added_rows,
            "modified_rows": [],
            "stats": {"added": len(added_rows), "modified": 0, "unchanged": 0},
        }

    merged = excel_df.merge(db_df, on="unit_no", how="left", suffixes=("_excel", "_db"))

    added_mask = merged["status_db"].isna()
    added_rows = merged.loc[added_mask, required_cols].to_dict(orient="records")

    modified_rows = []
    unchanged_count = 0

    for _, row in merged.loc[~added_mask].iterrows():
        diffs = {}
        for field in KEY_FIELDS:
            excel_val = row[f"{field}_excel"]
            db_val = row[f"{field}_db"]
            if pd.isna(excel_val) and pd.isna(db_val):
                continue
            if str(excel_val) != str(db_val):
                diffs[field] = {"excel": excel_val, "db": db_val}

        if diffs:
            modified_rows.append(
                {"unit_no": row["unit_no"], "diffs": diffs, "excel": row.to_dict()}
            )
        else:
            unchanged_count += 1

    stats = {
        "added": len(added_rows),
        "modified": len(modified_rows),
        "unchanged": unchanged_count,
    }

    return {
        "added_rows": added_rows,
        "modified_rows": modified_rows,
        "stats": stats,
    }


def compare_excel_with_db(
    file_content: bytes, project_id: int, db: Session
) -> Dict[str, List[dict]]:
    excel_df = normalize_excel(read_excel(file_content))
    db_df = fetch_units_df(db, project_id)
    return compare_dfs(excel_df, db_df)


def analyze_summary(file_content: bytes) -> Dict[str, List[dict]]:
    df = normalize_summary(read_excel(file_content))

    # Normalize string cells and remove full-width spaces.
    for col in ["project_company", "project_name", "contractor", "business_type"]:
        df[col] = (
            df[col]
            .apply(lambda v: None if pd.isna(v) else str(v).replace("\u3000", " ").strip())
            .replace({"": None, "nan": None, "None": None})
        )

    # Identify special rows before forward fill.
    is_total_row = df["project_company"].astype(str).eq("合计")
    is_note_row = (
        df["contractor"].notna()
        & df["contractor"].astype(str).str.startswith("注")
    )

    # Forward-fill merged cells for regular rows only.
    last_company = None
    last_project = None
    last_contractor = None
    for idx, row in df.iterrows():
        if is_total_row.loc[idx] or is_note_row.loc[idx]:
            continue
        if row["project_company"] is not None:
            last_company = row["project_company"]
        elif last_company is not None:
            df.at[idx, "project_company"] = last_company

        if row["project_name"] is not None:
            last_project = row["project_name"]
        elif last_project is not None:
            df.at[idx, "project_name"] = last_project

        if row["contractor"] is not None:
            last_contractor = row["contractor"]
        elif last_contractor is not None:
            df.at[idx, "contractor"] = last_contractor

    # Filter subtotal rows and note/comment rows.
    df = df[df["business_type"] != "小计"]
    df = df[~(df["contractor"].notna() & df["contractor"].astype(str).str.startswith("注"))]

    # Keep total row but clear descriptor fields to avoid polluted values.
    total_mask = df["project_company"].astype(str).eq("合计")
    df.loc[total_mask, ["project_name", "contractor", "business_type"]] = None

    # Drop fully empty data rows.
    df = df.dropna(how="all")

    # Normalize non-JSON-safe values:
    # 1) NaN/NaT -> None
    # 2) numpy scalar -> native python scalar
    df = df.replace({np.nan: None})

    rows = []
    for row in df.to_dict(orient="records"):
        normalized = {}
        for k, v in row.items():
            if hasattr(v, "item"):
                try:
                    normalized[k] = v.item()
                    continue
                except Exception:
                    pass
            normalized[k] = v
        rows.append(normalized)

    return {
        "summary_rows": rows,
        "stats": {"rows": len(rows)},
    }
