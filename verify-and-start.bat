@echo off
REM Verification and Start Script for Supabase Setup
REM Run this after executing the SQL in Supabase Dashboard

echo.
echo 🔍 Verifying Supabase Configuration...
echo.

REM Check if .env.local exists
if exist ".env.local" (
    echo ✅ .env.local file found
) else (
    echo ❌ .env.local file missing!
    pause
    exit /b 1
)

REM Check if SQL file exists
if exist "SETUP_DATABASE.sql" (
    echo ✅ SETUP_DATABASE.sql found
) else (
    echo ❌ SETUP_DATABASE.sql missing!
    pause
    exit /b 1
)

REM Check if package.json exists
if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing!
    pause
    exit /b 1
)

echo.
echo 📋 Next Steps:
echo.
echo 1. ⚠️  IMPORTANT: Run the SQL script first!
echo    👉 Open: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/sql/new
echo    👉 Copy contents of SETUP_DATABASE.sql
echo    👉 Paste into SQL Editor and click 'Run'
echo.
echo 2. After SQL is done, press any key to start dev server...
pause >nul

echo.
echo 🚀 Starting development server...
echo.

npm run dev
