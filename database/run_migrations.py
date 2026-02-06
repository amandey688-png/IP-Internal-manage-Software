#!/usr/bin/env python3
"""
FMS Database Migration Runner - Automatically sets up Supabase database.
Run from project root: python database/run_migrations.py [--fresh|--upgrade]
"""
import os
import sys
import argparse
from pathlib import Path

# Run from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.chdir(PROJECT_ROOT)
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / "backend" / ".env")
load_dotenv(PROJECT_ROOT / ".env")

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


def get_db_url():
    """Get database URL from SUPABASE_DB_URL env var."""
    return os.getenv("SUPABASE_DB_URL")


def run_sql_file(conn, filepath: Path) -> bool:
    """Execute SQL file. Returns True on success."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"  ERROR reading {filepath}: {e}")
        return False
    # Execute whole file (PostgreSQL supports multiple statements)
    try:
        with conn.cursor() as cur:
            cur.execute(content)
        conn.commit()
        print(f"  OK: {filepath.name}")
        return True
    except Exception as e:
        conn.rollback()
        print(f"  ERROR in {filepath.name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="FMS Database Migration Runner")
    parser.add_argument("--fresh", action="store_true", help="Full reset: run FRESH_SETUP + DASHBOARD_UPGRADE + ALL_TICKETS_UPGRADE")
    parser.add_argument("--upgrade", action="store_true", help="Upgrade only: run DASHBOARD_UPGRADE + ALL_TICKETS_UPGRADE (keeps existing data)")
    parser.add_argument("--tickets-only", action="store_true", help="Run only ALL_TICKETS_UPGRADE")
    args = parser.parse_args()

    if not (args.fresh or args.upgrade or args.tickets_only):
        parser.print_help()
        print("\nExamples:")
        print("  python database/run_migrations.py --fresh    # Full reset (drops all data)")
        print("  python database/run_migrations.py --upgrade # Add new tables/columns (safe)")
        print("  python database/run_migrations.py --tickets-only  # Only ticket upgrades")
        sys.exit(0)

    db_url = get_db_url()
    if not db_url:
        print("ERROR: SUPABASE_DB_URL not set in .env")
        print("")
        print("Add to backend/.env:")
        print("  SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres")
        print("")
        print("Get it from: Supabase Dashboard -> Settings -> Database -> Connection string -> URI")
        print("(Use 'Transaction' mode, replace [YOUR-PASSWORD] with your database password)")
        sys.exit(1)

    db_dir = Path(__file__).resolve().parent
    print("Connecting to Supabase...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        print("Connected.\n")
    except Exception as e:
        print(f"ERROR: Could not connect: {e}")
        print("Check SUPABASE_DB_URL and database password.")
        sys.exit(1)

    files = []
    if args.fresh:
        files = ["FRESH_SETUP.sql", "DASHBOARD_UPGRADE.sql", "ALL_TICKETS_UPGRADE.sql"]
    elif args.upgrade:
        files = ["DASHBOARD_UPGRADE.sql", "ALL_TICKETS_UPGRADE.sql"]
    else:
        files = ["ALL_TICKETS_UPGRADE.sql"]

    success = True
    for fname in files:
        fpath = db_dir / fname
        if not fpath.exists():
            print(f"  SKIP: {fname} (not found)")
            continue
        print(f"Running {fname}...")
        if not run_sql_file(conn, fpath):
            success = False
            if args.fresh:
                break

    try:
        conn.close()
    except Exception:
        pass

    if success:
        print("\nDone. Database is ready.")
    else:
        print("\nSome migrations failed. Check errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
