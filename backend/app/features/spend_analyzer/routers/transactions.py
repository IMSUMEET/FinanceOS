from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Query

from app.shared.database import get_conn, row_to_transaction
from app.features.spend_analyzer.modules.csv_parser import parse_csv
from app.features.spend_analyzer.modules.merchant_normalizer import normalize as normalize_merchant
from app.features.spend_analyzer.modules.categorizer import categorize

router = APIRouter(tags=["transactions"])


def _build_transactions_query(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    amount_min: Optional[float] = None,
    amount_max: Optional[float] = None,
):
    sql = "SELECT id, date, merchant_raw, merchant_normalized, description, amount, currency, category, source, created_at FROM transactions WHERE 1=1"
    params = []
    if date_from:
        sql += " AND date >= ?"
        params.append(date_from)
    if date_to:
        sql += " AND date <= ?"
        params.append(date_to)
    if category:
        sql += " AND category = ?"
        params.append(category)
    if merchant:
        sql += " AND (merchant_normalized LIKE ? OR merchant_raw LIKE ?)"
        params.append(f"%{merchant}%")
        params.append(f"%{merchant}%")
    if amount_min is not None:
        sql += " AND amount >= ?"
        params.append(amount_min)
    if amount_max is not None:
        sql += " AND amount <= ?"
        params.append(amount_max)
    sql += " ORDER BY date DESC, id DESC"
    return sql, params


@router.get("/transactions")
def get_transactions(
    date_from: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    category: Optional[str] = Query(None),
    merchant: Optional[str] = Query(None),
    amount_min: Optional[float] = Query(None),
    amount_max: Optional[float] = Query(None),
):
    """Return transactions with optional filters."""
    sql, params = _build_transactions_query(date_from, date_to, category, merchant, amount_min, amount_max)
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [row_to_transaction(row) for row in rows]


@router.post("/upload")
@router.post("/transactions/upload")
async def upload_csv(
    source: str = Form("unknown"),
    file: UploadFile = File(...),
):
    """Parse CSV, normalize merchants, categorize, and store transactions."""
    content = (await file.read()).decode("utf-8", errors="replace")
    parsed = parse_csv(content)
    inserted = 0
    skipped = 0

    with get_conn() as conn:
        for t in parsed:
            try:
                merchant_norm = normalize_merchant(t["merchant_raw"])
                cat = t.get("category") or categorize(merchant_norm, t.get("description"))
                conn.execute(
                    """INSERT INTO transactions (date, merchant_raw, merchant_normalized, description, amount, currency, category, source)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        t["date"],
                        t["merchant_raw"],
                        merchant_norm,
                        t.get("description") or t["merchant_raw"],
                        t["amount"],
                        t.get("currency") or "USD",
                        cat,
                        source,
                    ),
                )
                inserted += 1
            except Exception:
                skipped += 1
        conn.commit()

    return {"inserted": inserted, "skipped": skipped, "source": source, "filename": file.filename}
