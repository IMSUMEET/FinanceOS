"""
CSV parser: detect format, map headers to internal schema, parse dates and amounts.
Output: list of dicts with keys date, merchant_raw, description, amount, currency, category.
"""
import csv
import re
from io import StringIO
from datetime import datetime
from typing import Any, Optional


# Common header variants per field
DATE_HEADERS = ["date", "posted_date", "transaction_date", "trans date", "posting date"]
MERCHANT_HEADERS = ["merchant", "description", "payee", "name", "details"]
AMOUNT_HEADERS = ["amount", "debit", "credit", "transaction amount"]
CURRENCY_HEADERS = ["currency", "curr", "ccy"]
CATEGORY_HEADERS = ["category", "type", "transaction_type"]


def _normalize_header(h: str) -> str:
    return h.strip().lower().replace(" ", "_").replace("-", "_") if h else ""


def _find_column(row: dict, header_list: list) -> Optional[str]:
    for key in row:
        if _normalize_header(key) in [h.lower() for h in header_list]:
            return key
    return None


def _parse_date(value: str) -> Optional[str]:
    if not value or not value.strip():
        return None
    value = value.strip()
    # Try common formats
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%y"):
        try:
            dt = datetime.strptime(value[:10], fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Fallback: return as-is if it looks like YYYY-MM-DD
    if re.match(r"\d{4}-\d{2}-\d{2}", value):
        return value[:10]
    return None


def _parse_amount(value: str) -> Optional[float]:
    if value is None or value == "":
        return None
    s = str(value).strip().replace(",", "").replace("$", "").replace("(", "-").replace(")", "")
    try:
        return float(s)
    except ValueError:
        return None


def parse_csv(content: str) -> list[dict[str, Any]]:
    """
    Parse CSV content into a list of normalized transaction dicts.
    Each dict has: date, merchant_raw, description, amount, currency, category.
    """
    reader = csv.DictReader(StringIO(content))
    rows = list(reader)
    if not rows:
        return []

    first = rows[0]
    date_col = _find_column(first, DATE_HEADERS)
    merchant_col = _find_column(first, MERCHANT_HEADERS)
    amount_col = _find_column(first, AMOUNT_HEADERS)
    currency_col = _find_column(first, CURRENCY_HEADERS)
    category_col = _find_column(first, CATEGORY_HEADERS)

    out = []
    for row in rows:
        date_val = (date_col and row.get(date_col)) or ""
        date_parsed = _parse_date(date_val)
        if not date_parsed:
            continue

        raw_merchant = (merchant_col and row.get(merchant_col)) or ""
        raw_merchant = raw_merchant.strip() or (row.get("description") or row.get("merchant") or "").strip()
        if not raw_merchant:
            continue

        amount_val = (amount_col and row.get(amount_col)) or row.get("amount") or ""
        amount = _parse_amount(amount_val)
        if amount is None:
            continue

        currency = (currency_col and row.get(currency_col)) or "USD"
        currency = str(currency).strip() or "USD"
        category = (category_col and row.get(category_col)) or ""
        category = category.strip() if category else None

        out.append({
            "date": date_parsed,
            "merchant_raw": raw_merchant,
            "description": raw_merchant,
            "amount": amount,
            "currency": currency,
            "category": category,
        })
    return out
