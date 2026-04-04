# 📋 SQL Setup - Copy & Paste Instructions

## 🎯 What You Need to Do

Copy the contents of `SETUP_DATABASE.sql` and run it in Supabase.

---

## 📝 Method 1: Direct File Access (Easiest)

### Using VS Code or any text editor:

1. Open the file `SETUP_DATABASE.sql` in your project root
2. Press **Ctrl+A** (or Cmd+A on Mac) to select all
3. Press **Ctrl+C** (or Cmd+C on Mac) to copy
4. Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/sql/new
5. Press **Ctrl+V** (or Cmd+V on Mac) to paste
6. Click the **"Run"** button (green play button)
7. Wait for "Success. No rows returned"

---

## 📝 Method 2: Using Terminal

### Display the SQL file:

```bash
# Mac/Linux
cat SETUP_DATABASE.sql

# Windows PowerShell
Get-Content SETUP_DATABASE.sql

# Windows Command Prompt
type SETUP_DATABASE.sql
```

### Then:
1. Select all the output
2. Copy it
3. Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/sql/new
4. Paste and click "Run"

---

## 📝 Method 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Link your project (first time only)
supabase link --project-ref qjrmxudyrwcqwpkmrggn

# Run migrations
supabase db push
```

---

## ✅ What Success Looks Like

After clicking "Run" in the SQL Editor, you should see:

```
✅ Success. No rows returned

Query executed in ~500ms
```

**Or you might see:**
```
Success (some rows already exist warnings)
```

Both are fine! As long as it says "Success" and completes, you're good!

---

## ⚠️ Common Issues

### "already exists" warnings

**Example:**
```
WARNING: relation "users" already exists
```

**This is NORMAL!** It just means that table was already created. The script is designed to be run multiple times safely.

### "permission denied"

**Example:**
```
ERROR: permission denied for schema public
```

**Fix:** Make sure you're logged into the correct Supabase project. Check that your project ID is `qjrmxudyrwcqwpkmrggn`.

### Timeout errors

**Example:**
```
ERROR: query timeout
```

**Fix:** The script is large. Try running it in chunks:
1. First run lines 1-100
2. Then lines 101-200
3. Continue until done

Or increase timeout in Supabase dashboard settings.

---

## 🔍 Verify It Worked

After running the SQL, check:

### 1. Tables Created

Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/database/tables

You should see:
- ✅ users
- ✅ meetings
- ✅ meeting_participants
- ✅ action_items
- ✅ notifications
- ✅ user_settings
- ✅ kv_store_af44c8dd

### 2. Storage Bucket Created

Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/storage/buckets

You should see:
- ✅ avatars (public)

### 3. Views Created

In the Tables page, you should also see:
- ✅ meeting_stats (view)
- ✅ action_item_stats (view)

---

## 🎯 After SQL is Complete

Once you've successfully run the SQL:

```bash
# Start your development server
npm run dev
```

**Or use the helper script:**

```bash
# Mac/Linux
./verify-and-start.sh

# Windows
verify-and-start.bat
```

---

## 📞 Still Stuck?

### Can't access Supabase Dashboard?
- Check you're logged in at: https://supabase.com
- Verify project exists: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn

### SQL keeps failing?
- Try copying just the first 50 lines and run
- Then copy the next 50 lines and run
- Continue in chunks

### Not sure if it worked?
- Check the Tables page - if you see 7+ tables, it worked!
- Try starting the server anyway - errors will tell you what's missing

---

## ✨ Quick Summary

**What to copy:**
- File: `SETUP_DATABASE.sql`
- Location: Project root folder
- Size: ~330 lines of SQL

**Where to paste:**
- URL: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/sql/new
- Location: Supabase SQL Editor
- Button: "Run" (green play button)

**What happens:**
- Creates 7 database tables
- Sets up security policies
- Creates indexes for speed
- Sets up storage buckets
- Creates analytics views

**Time required:**
- Copy: 10 seconds
- Paste: 5 seconds
- Run: 30-60 seconds
- Total: ~2 minutes

---

**Ready? Copy `SETUP_DATABASE.sql` and paste it into the SQL Editor!** 🚀
