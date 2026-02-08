from fastapi import Depends, FastAPI, File, UploadFile, HTTPException

from database import get_db
from services.diff_engine import compare_excel_with_db, analyze_summary

app = FastAPI(title="IPMDS Data Service")


@app.post("/analyze")
async def analyze(
    project_id: int,
    mode: str = "summary",
    file: UploadFile = File(...),
    db=Depends(get_db),
):
    content = await file.read()
    try:
        if mode == "summary":
            result = analyze_summary(content)
            return {"mode": "summary", **result}
        result = compare_excel_with_db(content, project_id, db)
        return {"mode": "unit", **result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
