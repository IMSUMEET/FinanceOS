"""
Transaction categorizer: assign category from merchant/description. Rule-based for V1.
Categories: Food, Groceries, Gas, Transport, Shopping, Entertainment, Travel, Utilities, Subscriptions, Other.
"""
import re
from typing import Optional

CATEGORIES = [
    "Food", "Groceries", "Gas", "Transport", "Shopping", "Entertainment",
    "Travel", "Utilities", "Subscriptions", "Other",
]

# (pattern, category). Order matters.
CATEGORY_RULES = [
    (r"(?i)\bnetflix\b|\bspotify\b|\bhulu\b|\bdisney\s*plus\b|\bprime\s*membership\b|\byoutube\s*premium\b", "Subscriptions"),
    (r"(?i)\bwhole\s*foods\b|\btrader\s*joe|\bcostco\b|\bwalmart\b|\bgrocery\b|\bsafeway\b|\bkroger\b", "Groceries"),
    (r"(?i)\bchevron\b|\bshell\b|exxon|mobil\b|\bgas\b|\bfuel\b", "Gas"),
    (r"(?i)\buber\b|\blyft\b|\bdoordash\b|\bgrubhub\b|\bpostmates\b|\btaxi\b", "Transport"),
    (r"(?i)\bairline\b|\bflight\b|\bhotel\b|\bairbnb\b|\bexpedia\b|\btravel\b", "Travel"),
    (r"(?i)\bstarbucks\b|\bcoffee\b|\bmcdonald|burger\s*king|\bchipotle\b|\brestaurant\b|\bdelivery\b|\bdoordash\b|\bgrubhub\b", "Food"),
    (r"(?i)\bamazon\b|\btarget\b|\bbest\s*buy\b|\bshopping\b", "Shopping"),
    (r"(?i)\bmovie\b|\bcinema\b|\bgame\b|\bentertainment\b", "Entertainment"),
    (r"(?i)\belectric\b|\bwater\b|\bgas\s*company\b|\butility\b|\binternet\b|\bphone\b|\bverizon\b|\bat&t\b", "Utilities"),
]


def categorize(merchant_normalized: str, description: Optional[str] = None) -> str:
    """
    Return category for the transaction. Uses merchant_normalized and optional description.
    """
    text = f" {merchant_normalized or ''} {description or ''} ".lower()
    for pattern, category in CATEGORY_RULES:
        if re.search(pattern, text):
            return category
    return "Other"
