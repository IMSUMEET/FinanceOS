from fastapi import APIRouter, Query
from typing import Optional

from app.shared.database import get_conn, row_to_transaction
from app.features.spend_analyzer.modules.analytics import monthly_totals, category_breakdown, merchant_breakdown

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _fetch_transactions(date_from: Optional[str] = None, date_to: Optional[str] = None):
    sql = "SELECT id, date, merchant_raw, merchant_normalized, description, amount, currency, category, source, created_at FROM transactions WHERE 1=1"
    params = []
    if date_from:
        sql += " AND date >= ?"
        params.append(date_from)
    if date_to:
        sql += " AND date <= ?"
        params.append(date_to)
    sql += " ORDER BY date DESC"
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [row_to_transaction(r) for r in rows]


@router.get("/category-breakdown")
def get_category_breakdown(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Spending grouped by category."""
    txns = _fetch_transactions(date_from, date_to)
    return category_breakdown(txns)


@router.get("/merchant-breakdown")
def get_merchant_breakdown(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Spending grouped by merchant (normalized)."""
    txns = _fetch_transactions(date_from, date_to)
    return merchant_breakdown(txns)


@router.get("/monthly")
def get_monthly(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Monthly aggregated spending."""
    txns = _fetch_transactions(date_from, date_to)
    return monthly_totals(txns)
