# ✅ Verification & Testing Guide

Use this guide to verify that your Supabase setup is working correctly.

## 🔍 Pre-Setup Verification

Before running the SQL script, verify your credentials are configured:

### Check 1: Environment Variables
```bash
# View your .env.local file
cat .env.local
```

**Expected output:**
```
VITE_SUPABASE_URL=https://qjrmxudyrwcqwpkmrggn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ If you see these three variables, you're good!

### Check 2: Supabase Client Configuration

The app should automatically detect Supabase is configured. You can verify by:

1. Opening your browser console (F12)
2. Looking for the log message - it should NOT say "Running in LOCAL MODE"
3. If Supabase is detected, you won't see any localStorage warnings

## 🔍 Post-Setup Verification

After running the SQL script:

### Check 1: Database Tables

1. Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/database/tables
2. You should see these tables:
   - ✅ `users`
   - ✅ `meetings`
   - ✅ `meeting_participants`
   - ✅ `action_items`
   - ✅ `notifications`
   - ✅ `user_settings`
   - ✅ `kv_store_af44c8dd`

### Check 2: Storage Bucket

1. Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/storage/buckets
2. You should see:
   - ✅ `avatars` bucket (public)

### Check 3: Authentication

1. Sign up with a test account: `test@example.com` / `password123`
2. Go to: https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/auth/users
3. You should see your test user listed

### Check 4: Data Persistence

**Test Workflow:**
1. Sign in to your app
2. Create a new meeting with these details:
   - Title: "Test Meeting"
   - Date: Today
   - Time: 10:00 AM
   - Duration: 60 minutes
3. **Sign out** completely
4. **Sign back in**
5. Check if "Test Meeting" is still there

✅ **If you can see your meeting after logging back in, Supabase is working!**

### Check 5: Database Connection Status

Look for the banner at the top of your app:
- ✅ Should say: **"Connected to Cloud Database"** with a green checkmark
- ❌ If it says: "Using Local Storage Only" - something is wrong

### Check 6: Browser Console

Open browser console (F12) and look for:
- ✅ No Supabase errors
- ✅ No "localStorage" warnings
- ✅ Successful API calls to `qjrmxudyrwcqwpkmrggn.supabase.co`

## 🧪 Advanced Testing

### Test User Profile

1. Click on your avatar (top-right)
2. Go to "Settings" → "Profile"
3. Update your name or add a bio
4. Refresh the page
5. Check if changes persisted

✅ **Working**: Changes are saved and appear after refresh

### Test Action Items

1. Create an action item
2. Mark it as "In Progress"
3. Refresh the page
4. Check if status is still "In Progress"

✅ **Working**: Status persists

### Test Notifications

1. Create a meeting
2. Check the notifications icon (bell)
3. You should see a notification about the meeting

✅ **Working**: Notification appears

## 🔴 Common Issues & Fixes

### Issue 1: "Users table does not exist"

**Cause**: SQL script wasn't run or failed
**Fix**: 
1. Go to SQL Editor
2. Run `SETUP_DATABASE.sql` again
3. Check for error messages in the output

### Issue 2: "Row Level Security policy violation"

**Cause**: User not properly authenticated or policies not set up
**Fix**:
1. Sign out completely
2. Sign up with a fresh account
3. Make sure SQL policies were created (rerun script if needed)

### Issue 3: "Failed to connect" errors

**Cause**: Network issue or incorrect credentials
**Fix**:
1. Check internet connection
2. Verify `.env.local` has correct values
3. Restart dev server
4. Clear browser cache

### Issue 4: Still using localStorage

**Cause**: Supabase not detected as configured
**Fix**:
1. Make sure `.env.local` exists in project root
2. Restart dev server (important!)
3. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
4. Clear browser localStorage: `localStorage.clear()` in console

### Issue 5: Data doesn't persist

**Cause**: Still using localStorage instead of Supabase
**Fix**:
1. Open browser console
2. Look for which storage is being used
3. Make sure you see network calls to `supabase.co`
4. If not, check Issue 4 above

## 📊 Monitoring Your Database

### Real-time Table View
https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/editor

**You can:**
- See all data in real-time
- Manually add/edit records
- Run custom SQL queries
- Export data

### API Logs
https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/logs/edge-logs

**You can:**
- See all API requests
- Debug authentication issues
- Monitor performance
- Check for errors

### Database Health
https://supabase.com/dashboard/project/qjrmxudyrwcqwpkmrggn/reports/database

**You can:**
- Monitor database size
- Check query performance
- See connection stats

## ✅ Final Checklist

Run through this checklist to confirm everything works:

- [ ] `.env.local` exists with all three variables
- [ ] Dev server restarted after setup
- [ ] All 7 database tables created
- [ ] `avatars` storage bucket exists
- [ ] Can sign up new user
- [ ] Can sign in with existing user
- [ ] Created test meeting that persists after logout/login
- [ ] Created test action item that persists
- [ ] Green "Connected to Cloud Database" banner appears
- [ ] No errors in browser console
- [ ] Can see data in Supabase Dashboard
- [ ] Network tab shows requests to `qjrmxudyrwcqwpkmrggn.supabase.co`

## 🎉 Success Criteria

Your setup is **FULLY WORKING** when:

1. ✅ You can create meetings/actions
2. ✅ Data persists after refresh
3. ✅ Data persists after logout/login
4. ✅ You can see data in Supabase Dashboard
5. ✅ Multiple users can have separate data
6. ✅ No localStorage warnings in console

## 🆘 Still Having Issues?

If you've followed all steps and it's still not working:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Check Browser Console**: Look for specific error messages
3. **Check Network Tab**: Are requests reaching Supabase?
4. **Try Incognito Mode**: Rules out browser extension issues
5. **Check Project Settings**: Verify project isn't paused

---

**Once all checks pass, you're ready to build! 🚀**
