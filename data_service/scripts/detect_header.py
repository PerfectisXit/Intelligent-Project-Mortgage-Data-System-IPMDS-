import sys
from typing import List, Tuple

import pandas as pd

ALIASES = [
    "房号",
    "房间号",
    "房间编号",
    "房间全称",
    "单元号",
    "状态",
    "销售状态",
    "签约状态",
    "面积",
    "建筑面积",
    "实测面积",
    "买受人",
    "客户",
    "客户名称",
    "客户姓名",
]


def norm(s: str) -> str:
    return (
        str(s)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("（", "(")
        .replace("）", ")")
        .replace("㎡", "m2")
    )


def score_row(values: List[str]) -> Tuple[int, int]:
    norm_values = [norm(v) for v in values if v and v == v]
    hit = 0
    for a in ALIASES:
        a_norm = norm(a)
        if any(a_norm == v or a_norm in v for v in norm_values):
            hit += 1
    text_cells = sum(1 for v in values if isinstance(v, str) and v.strip())
    return hit, text_cells


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/detect_header.py <excel_path> [max_rows]")
        sys.exit(1)

    path = sys.argv[1]
    max_rows = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    df = pd.read_excel(path, header=None)

    candidates = []
    for i in range(min(max_rows, len(df))):
        row = df.iloc[i].tolist()
        hit, text_cells = score_row(row)
        candidates.append((hit, text_cells, i, row))

    candidates.sort(reverse=True)
    print("Top header candidates (hit, text_cells, row_index):")
    for hit, text_cells, idx, row in candidates[:5]:
        preview = [str(v) for v in row[:12]]
        print(f"- {hit}, {text_cells}, row={idx}: {preview}")


if __name__ == "__main__":
    main()
