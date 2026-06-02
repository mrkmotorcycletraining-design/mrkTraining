#!/bin/bash
# ============================================================
#  setup-db.sh  –  Create mrkTraining DB and apply schema
#
#  Usage:
#    ./setup-db.sh [pg_host] [pg_port] [pg_superuser]
#
#  Defaults:  localhost  5432  postgres
# ============================================================

PG_HOST="${1:-localhost}"
PG_PORT="${2:-5432}"
PG_SUPER="${3:-postgres}"

DB_NAME="mrkTraining"
DB_USER="mrk_user"
DB_PASS="mrk_password"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/schema.sql"

echo "========================================"
echo " MRK Training – Database Setup"
echo "========================================"
echo " Host  : $PG_HOST:$PG_PORT"
echo " DB    : $DB_NAME"
echo " User  : $DB_USER"
echo "========================================"

# ── 1. Create role (ignore if already exists) ──────────────
echo ""
echo "[1/3] Creating database user '$DB_USER'..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPER" -c \
  "DO \$\$ BEGIN
     CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';
   EXCEPTION WHEN duplicate_object THEN
     RAISE NOTICE 'Role $DB_USER already exists, skipping.';
   END \$\$;" 

# ── 2. Create database (skip if already exists) ────────────
echo ""
echo "[2/3] Creating database '$DB_NAME'..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPER" -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" \
  | grep -q 1 \
  || psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPER" -c \
       "CREATE DATABASE \"$DB_NAME\" OWNER $DB_USER;"

# Grant privileges in case the DB already existed
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPER" -c \
  "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO $DB_USER;"

# ── 3. Run schema ──────────────────────────────────────────
echo ""
echo "[3/3] Applying schema from: $SCHEMA_FILE"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "ERROR: schema.sql not found at $SCHEMA_FILE"
  exit 1
fi

PGPASSWORD="$DB_PASS" psql \
  -h "$PG_HOST" -p "$PG_PORT" \
  -U "$DB_USER" -d "$DB_NAME" \
  -f "$SCHEMA_FILE"

echo ""
echo "========================================"
echo " Setup complete!"
echo "  DB  : $DB_NAME"
echo "  URL : jdbc:postgresql://$PG_HOST:$PG_PORT/$DB_NAME"
echo "========================================"
