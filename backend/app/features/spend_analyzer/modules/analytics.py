"""
Spending aggregator: monthly totals, category breakdown, merchant breakdown.
"""
from collections import defaultdict
from typing import Any


def monthly_totals(transactions: list[dict]) -> list[dict]:
    """Aggregate spending by month. Returns list of { month, total, count }."""
    by_month = defaultdict(lambda: {"total": 0.0, "count": 0})
    for t in transactions:
        amount = t.get("amount") or 0
        date = t.get("date") or ""
        if date:
            month = date[:7]  # YYYY-MM
            by_month[month]["total"] += amount
            by_month[month]["count"] += 1
    out = [{"month": m, "total": round(d["total"], 2), "count": d["count"]} for m, d in sorted(by_month.items())]
    return out


def category_breakdown(transactions: list[dict]) -> list[dict]:
    """Spending by category. Returns list of { category, total, count }."""
    by_cat = defaultdict(lambda: {"total": 0.0, "count": 0})
    for t in transactions:
        cat = t.get("category") or "Other"
        amount = t.get("amount") or 0
        by_cat[cat]["total"] += amount
        by_cat[cat]["count"] += 1
    return [{"category": c, "total": round(d["total"], 2), "count": d["count"]} for c, d in sorted(by_cat.items())]


def merchant_breakdown(transactions: list[dict]) -> list[dict]:
    """Spending by merchant (normalized). Returns list of { merchant, total, count }."""
    by_merchant = defaultdict(lambda: {"total": 0.0, "count": 0})
    for t in transactions:
        merchant = t.get("merchant_normalized") or t.get("merchant_raw") or "Unknown"
        amount = t.get("amount") or 0
        by_merchant[merchant]["total"] += amount
        by_merchant[merchant]["count"] += 1
    return [{"merchant": m, "total": round(d["total"], 2), "count": d["count"]} for m, d in sorted(by_merchant.items(), key=lambda x: -x[1]["total"])]
