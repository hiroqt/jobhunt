import sys
import sqlite3
from pathlib import Path

# Resolve path to canonical backend/job_hunt.db
backend_dir = Path(__file__).resolve().parent.parent.parent
db_path = backend_dir / "job_hunt.db"


def reset_database(target_path: Path = db_path) -> None:
    if not target_path.exists():
        print(f"Database file not found at {target_path}")
        return

    conn = sqlite3.connect(str(target_path))
    cursor = conn.cursor()

    try:
        # Disable FK checks temporarily for bulk truncation
        cursor.execute("PRAGMA foreign_keys = OFF;")

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [row[0] for row in cursor.fetchall()]

        print(f"Resetting database at {target_path}...")
        for table in tables:
            cursor.execute(f'DELETE FROM "{table}";')
            print(f"  - Cleared table: {table}")

        conn.commit()

        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute("VACUUM;")
        conn.commit()

        print("Database successfully reset. All tables are now empty.")
    except Exception as e:
        conn.rollback()
        print(f"Error resetting database: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    reset_database()
