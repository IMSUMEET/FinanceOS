"""
Optional dummy data for local demos — inserted only when the DB has no transactions.
"""
from app.shared.database import get_conn

# (date, merchant_raw, merchant_normalized, description, amount, currency, category, source)
DUMMY_ROWS = [
    ("2025-11-02", "AMZN Mktp US*AB12", "Amazon", "Amazon purchase", -34.99, "USD", "Shopping", "chase"),
    ("2025-11-03", "STARBUCKS STORE 1234", "Starbucks", "Coffee", -6.45, "USD", "Food", "chase"),
    ("2025-11-05", "WHOLE FOODS MKT", "Whole Foods", "Groceries", -87.32, "USD", "Groceries", "chase"),
    ("2025-11-08", "NETFLIX.COM", "Netflix", "Subscription", -15.99, "USD", "Subscriptions", "chase"),
    ("2025-11-10", "SHELL OIL 5678", "Gas", "Fuel", -48.00, "USD", "Gas", "chase"),
    ("2025-11-12", "UBER TRIP", "Uber", "Ride", -22.50, "USD", "Transport", "chase"),
    ("2025-11-15", "COSTCO WHSE #0123", "Costco", "Bulk shopping", -156.78, "USD", "Groceries", "chase"),
    ("2025-11-18", "SPOTIFY USA", "Spotify", "Music", -10.99, "USD", "Subscriptions", "chase"),
    ("2025-11-20", "TARGET T-1234", "Target", "Household", -42.15, "USD", "Shopping", "chase"),
    ("2025-12-01", "AMAZON.COM*XYZ", "Amazon", "Electronics", -129.00, "USD", "Shopping", "chase"),
    ("2025-12-03", "CHIPOTLE 456", "Chipotle", "Lunch", -14.25, "USD", "Food", "chase"),
    ("2025-12-05", "ELECTRIC CO PAYMENT", "Electric Co", "Utility bill", -95.00, "USD", "Utilities", "chase"),
    ("2025-12-08", "DOORDASH*RESTAURANT", "DoorDash", "Food delivery", -28.90, "USD", "Food", "chase"),
    ("2025-12-10", "APPLE.COM/BILL", "Apple", "iCloud", -2.99, "USD", "Subscriptions", "chase"),
    ("2025-12-12", "CHEVRON 9999", "Gas", "Gas", -52.30, "USD", "Gas", "chase"),
    ("2025-12-15", "WALMART SUPERCENTER", "Walmart", "Groceries", -67.44, "USD", "Groceries", "chase"),
    ("2025-12-18", "LYFT RIDE", "Lyft", "Ride", -18.75, "USD", "Transport", "chase"),
    ("2025-12-22", "HULU", "Hulu", "Streaming", -7.99, "USD", "Entertainment", "chase"),
    ("2025-12-24", "TRADER JOE'S #88", "Trader Joe's", "Holiday groceries", -73.20, "USD", "Groceries", "chase"),
    ("2025-12-28", "AMZN Mktp US", "Amazon", "Gift", -45.00, "USD", "Shopping", "chase"),
    ("2026-01-03", "STARBUCKS", "Starbucks", "Coffee", -5.75, "USD", "Food", "chase"),
    ("2026-01-05", "NETFLIX.COM", "Netflix", "Subscription", -15.99, "USD", "Subscriptions", "chase"),
    ("2026-01-08", "SHELL", "Gas", "Fuel", -55.00, "USD", "Gas", "chase"),
    ("2026-01-10", "WHOLE FOODS", "Whole Foods", "Groceries", -92.10, "USD", "Groceries", "chase"),
    ("2026-01-12", "BEST BUY #100", "Best Buy", "Gadget", -199.99, "USD", "Shopping", "chase"),
    ("2026-01-15", "UBER EATS", "Uber", "Delivery", -31.50, "USD", "Food", "chase"),
    ("2026-01-18", "VERIZON WIRELESS", "Verizon", "Phone", -85.00, "USD", "Utilities", "chase"),
    ("2026-01-20", "COSTCO GAS", "Costco", "Gas", -38.00, "USD", "Gas", "chase"),
    ("2026-01-22", "DISNEY PLUS", "Disney Plus", "Streaming", -13.99, "USD", "Entertainment", "chase"),
    ("2026-01-25", "AMAZON PRIME", "Amazon", "Membership", -14.99, "USD", "Subscriptions", "chase"),
]


def seed_dummy_if_empty() -> int:
    """Insert dummy rows if transactions table is empty. Returns number of rows inserted."""
    with get_conn() as conn:
        n = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
        if n > 0:
            return 0
        for row in DUMMY_ROWS:
            conn.execute(
                """INSERT INTO transactions
                   (date, merchant_raw, merchant_normalized, description, amount, currency, category, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                row,
            )
        conn.commit()
    return len(DUMMY_ROWS)
