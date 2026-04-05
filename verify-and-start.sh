#!/bin/bash

# Verification and Start Script for Supabase Setup
# Run this after executing the SQL in Supabase Dashboard

echo "🔍 Verifying Supabase Configuration..."
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file found"
else
    echo "❌ .env.local file missing!"
    exit 1
fi

# Check if SQL file exists
if [ -f "SETUP_DATABASE.sql" ]; then
    echo "✅ SETUP_DATABASE.sql found"
else
    echo "❌ SETUP_DATABASE.sql missing!"
    exit 1
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json missing!"
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. ⚠️  IMPORTANT: Run the SQL script first!"
echo "   👉 Open: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/sql/new"
echo "   👉 Copy contents of SETUP_DATABASE.sql"
echo "   👉 Paste into SQL Editor and click 'Run'"
echo ""
echo "2. After SQL is done, press ENTER to start dev server..."
read -p ""

echo ""
echo "🚀 Starting development server..."
echo ""

npm run dev
