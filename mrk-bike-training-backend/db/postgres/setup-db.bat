@echo off
REM ============================================================
REM  setup-db.bat  -  Create mrkTraining DB and apply schema
REM
REM  Usage:
REM    setup-db.bat [pg_host] [pg_port] [pg_superuser]
REM
REM  Defaults:  localhost  5432  postgres
REM ============================================================

SET PG_HOST=%~1
IF "%PG_HOST%"=="" SET PG_HOST=localhost

SET PG_PORT=%~2
IF "%PG_PORT%"=="" SET PG_PORT=5432

SET PG_SUPER=%~3
IF "%PG_SUPER%"=="" SET PG_SUPER=postgres

SET DB_NAME=mrkTraining
SET DB_USER=mrk_user
SET DB_PASS=mrk_password

SET SCRIPT_DIR=%~dp0
SET SCHEMA_FILE=%SCRIPT_DIR%schema.sql

echo ========================================
echo  MRK Training - Database Setup
echo ========================================
echo  Host  : %PG_HOST%:%PG_PORT%
echo  DB    : %DB_NAME%
echo  User  : %DB_USER%
echo ========================================

REM ── 1. Create role ─────────────────────────────────────────
echo.
echo [1/3] Creating database user '%DB_USER%'...
psql -h %PG_HOST% -p %PG_PORT% -U %PG_SUPER% -c ^
  "DO $$ BEGIN CREATE ROLE %DB_USER% WITH LOGIN PASSWORD '%DB_PASS%'; EXCEPTION WHEN duplicate_object THEN RAISE NOTICE 'Role already exists.'; END $$;"

REM ── 2. Create database ─────────────────────────────────────
echo.
echo [2/3] Creating database '%DB_NAME%'...
psql -h %PG_HOST% -p %PG_PORT% -U %PG_SUPER% -c ^
  "SELECT 'already exists' FROM pg_database WHERE datname = '%DB_NAME%'" | findstr "already exists" >nul
IF ERRORLEVEL 1 (
    psql -h %PG_HOST% -p %PG_PORT% -U %PG_SUPER% -c ^
      "CREATE DATABASE ""%DB_NAME%"" OWNER %DB_USER%;"
) ELSE (
    echo Database '%DB_NAME%' already exists, skipping creation.
)

psql -h %PG_HOST% -p %PG_PORT% -U %PG_SUPER% -c ^
  "GRANT ALL PRIVILEGES ON DATABASE ""%DB_NAME%"" TO %DB_USER%;"

REM ── 3. Apply schema ─────────────────────────────────────────
echo.
echo [3/3] Applying schema from: %SCHEMA_FILE%

IF NOT EXIST "%SCHEMA_FILE%" (
    echo ERROR: schema.sql not found at %SCHEMA_FILE%
    exit /b 1
)

SET PGPASSWORD=%DB_PASS%
psql -h %PG_HOST% -p %PG_PORT% -U %DB_USER% -d %DB_NAME% -f "%SCHEMA_FILE%"

echo.
echo ========================================
echo  Setup complete!
echo  DB  : %DB_NAME%
echo  URL : jdbc:postgresql://%PG_HOST%:%PG_PORT%/%DB_NAME%
echo ========================================
