#!/bin/sh
set -e

# Ensure virtual environment binaries take precedence on Render / Linux servers
if [ -d "/opt/render/project/src/.venv/bin" ]; then
    export PATH="/opt/render/project/src/.venv/bin:$PATH"
fi

echo "=================================================="
echo "GramSetu Backend Startup - Waiting for Database..."
echo "=================================================="

# DB Readiness Wait Script in Python
python - << 'EOF'
import sys
import time
import psycopg2
import os

db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

host = os.getenv("POSTGRES_HOST", "db")
port = os.getenv("POSTGRES_PORT", "5432")
user = os.getenv("POSTGRES_USER", "gramsetu_user")
password = os.getenv("POSTGRES_PASSWORD", "gramsetu_secure_pass_2026")
dbname = os.getenv("POSTGRES_DB", "gramsetu_db")

max_retries = 30
retry_interval = 2

for attempt in range(1, max_retries + 1):
    try:
        if db_url:
            conn = psycopg2.connect(db_url)
        else:
            conn = psycopg2.connect(
                host=host, port=port, user=user, password=password, dbname=dbname
            )
        conn.close()
        print(f"Database is ready and accepting connections! (Attempt {attempt})")
        sys.exit(0)
    except Exception as e:
        print(f"Database not ready yet (Attempt {attempt}/{max_retries}): {e}")
        time.sleep(retry_interval)

print("Could not connect to PostgreSQL within the time limit. Exiting.")
sys.exit(1)
EOF

echo "Running Alembic Database Migrations..."
python -m alembic upgrade head

echo "Populating Seed Data..."
python seed.py

PORT_TO_USE="${PORT:-8000}"
echo "Starting Uvicorn Server on 0.0.0.0:${PORT_TO_USE}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT_TO_USE}"
