@echo off
setlocal EnableExtensions

REM =========================
REM Supabase backup script
REM =========================
set "PG_DUMP_EXE=C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
set "DB_NAME=postgres"
set "DB_HOST=aws-1-ap-south-1.pooler.supabase.com"
set "DB_PORT=5432"
set "DB_USER=postgres.geqcgxassdkrymzsjpoj"
set "BACKUP_DIR=C:\Supabase_Backups"
set "RETENTION_DAYS=30"

if not exist "%PG_DUMP_EXE%" (
  echo pg_dump not found at: %PG_DUMP_EXE%
  echo Update PG_DUMP_EXE path in this file to your installed PostgreSQL version.
  exit /b 1
)

REM Enter DB password at runtime (or pre-set via env var)
if "%PGPASSWORD%"=="" set /p PGPASSWORD=Enter DB password: 
if "%PGPASSWORD%"=="" (
  echo Password is required.
  exit /b 1
)

REM Ensure backup folder exists
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Stable timestamp (YYYY-MM-DD_HH-MM-SS)
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%i"
set "OUT_FILE=%BACKUP_DIR%\supabase_backup_%TS%.dump"

echo Using Session Pooler values from Supabase:
echo Host=%DB_HOST% Port=%DB_PORT% User=%DB_USER% Database=%DB_NAME%
echo.
call :run_dump "%DB_HOST%" "%DB_PORT%" "%DB_USER%" "%DB_NAME%" "%OUT_FILE%"
if %ERRORLEVEL% EQU 0 goto :success

echo.
echo Backup failed.
echo Check in Supabase ^> Settings ^> Database ^> Connection string:
echo   - Type: PSQL
echo   - Method: Session pooler
echo   - Host/User/Port must match this script
echo Also confirm you used DATABASE password, not Supabase account password.
set "PGPASSWORD="
exit /b 1

:success
echo.
echo Backup completed: %OUT_FILE%
echo Deleting backups older than %RETENTION_DAYS% days from %BACKUP_DIR% ...
forfiles /P "%BACKUP_DIR%" /M *.dump /D -%RETENTION_DAYS% /C "cmd /c del /q @path" >nul 2>nul
echo Retention cleanup completed.
set "PGPASSWORD="
exit /b 0

:run_dump
set "H=%~1"
set "P=%~2"
set "U=%~3"
set "D=%~4"
set "F=%~5"
echo Host=%H% Port=%P% User=%U%
"%PG_DUMP_EXE%" -h "%H%" -p "%P%" -U "%U%" -d "%D%" -F c -f "%F%"
exit /b %ERRORLEVEL%
