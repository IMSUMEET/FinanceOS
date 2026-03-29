"""
Merchant normalizer: convert messy merchant strings to consistent names.
Rule-based for V1.
"""
import re
from typing import Optional

# Rules: (pattern or substring, normalized name). Order matters (first match wins for keywords).
NORMALIZE_RULES = [
    (r"(?i)\bamzn\b|amazon\.com|amazon marketplace", "Amazon"),
    (r"(?i)\bnetflix\b", "Netflix"),
    (r"(?i)\bspotify\b", "Spotify"),
    (r"(?i)\bapple\s*\.?com|apple\s*store|apple\.com/bill", "Apple"),
    (r"(?i)\bgoogle\s*\.?com|google\s*pay|g\s*\.?co\s*pay", "Google"),
    (r"(?i)\bwalmart\b", "Walmart"),
    (r"(?i)\bcostco\b", "Costco"),
    (r"(?i)\bwhole\s*foods\b", "Whole Foods"),
    (r"(?i)\bstarbucks\b", "Starbucks"),
    (r"(?i)\buber\b|uber\s*eat", "Uber"),
    (r"(?i)\bdoordash\b|door\s*dash", "DoorDash"),
    (r"(?i)\bchevron\b|shell\s*oil|exxon|mobil\b", "Gas"),
    (r"(?i)\bchase\b", "Chase"),
    (r"(?i)\bamerican\s*express\b|amex\b", "American Express"),
]


def normalize(merchant_raw: str) -> str:
    """
    Return a clean, consistent merchant name for display and grouping.
    """
    if not merchant_raw or not merchant_raw.strip():
        return ""
    s = merchant_raw.strip()
    for pattern, name in NORMALIZE_RULES:
        if re.search(pattern, s):
            return name
    # Fallback: take first meaningful tokens (remove common prefixes/suffixes)
    s = re.sub(r"(?i)\s*\*\d+\s*$", "", s)  # *1234 at end
    s = re.sub(r"(?i)^(pos|purchase|debit|credit)\s+", "", s)
    if len(s) > 40:
        s = s[:40].strip()
    return s or merchant_raw.strip()
