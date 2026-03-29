import os
import sqlite3
from pathlib import Path

# In Docker, set SPEND_DATA_DIR=/data and mount a volume for persistence
_data_dir = Path(os.environ.get("SPEND_DATA_DIR", str(Path(__file__).resolve().parent.parent.parent)))
DB_PATH = _data_dir / "spend.db"

# Design doc schema: id, date, merchant_raw, merchant_normalized, description, amount, currency, category, source, created_at
SCHEMA = """
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    merchant_raw TEXT,
    merchant_normalized TEXT,
    description TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    category TEXT,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_normalized);
"""


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _migrate_old_schema(conn):
    """If table has old schema (posted_date), migrate to new schema."""
    row = conn.execute("PRAGMA table_info(transactions)").fetchone()
    if not row:
        return
    columns = [r[1] for r in conn.execute("PRAGMA table_info(transactions)").fetchall()]
    if "date" in columns:
        return
    # Old schema: posted_date, description, amount, source. Copy to new table.
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            merchant_raw TEXT,
            merchant_normalized TEXT,
            description TEXT,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            category TEXT,
            source TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        INSERT INTO transactions_new (id, date, merchant_raw, merchant_normalized, description, amount, currency, category, source, created_at)
        SELECT id, posted_date, description, description, description, amount, 'USD', 'Other', source, datetime('now')
        FROM transactions
    """)
    conn.execute("DROP TABLE transactions")
    conn.execute("ALTER TABLE transactions_new RENAME TO transactions")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_normalized)")


def init_db():
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        _migrate_old_schema(conn)
        conn.commit()


def row_to_transaction(row):
    return {
        "id": row["id"],
        "date": row["date"],
        "merchant_raw": row["merchant_raw"],
        "merchant_normalized": row["merchant_normalized"],
        "description": row["description"],
        "amount": row["amount"],
        "currency": row["currency"] or "USD",
        "category": row["category"],
        "source": row["source"],
        "created_at": row["created_at"],
    }
