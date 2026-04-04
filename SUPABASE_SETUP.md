# 🚀 Supabase Database Setup Guide

## Overview
This guide will help you switch from localStorage to Supabase for permanent cloud storage of all your application data.

---

## 📋 Prerequisites

- A Supabase account (free tier works perfectly)
- Your application running locally

---

## 🔧 Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create a free account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: `Meeting Management System` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest region to your location
   - **Pricing Plan**: Free tier is sufficient
5. Click **"Create new project"**
6. Wait 2-3 minutes for your project to be provisioned

---

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, click on **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long JWT token)
4. Keep this page open, you'll need these values in the next step

---

### Step 3: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inxxxxxxxxxxxxxx
```

3. **Important**: Replace `xxxxxxxxxxxxx` with your actual values from Step 2
4. Save the file

---

### Step 4: Set Up Database Schema

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open the `supabase-schema.sql` file from your project root
4. **Copy the entire contents** of that file
5. **Paste it** into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for the query to complete (should take 5-10 seconds)
8. You should see a success message: "Success. No rows returned"

---

### Step 5: Verify Database Setup

1. In Supabase dashboard, click on **Table Editor**
2. You should see these tables:
   - ✅ `users`
   - ✅ `user_settings`
   - ✅ `meetings`
   - ✅ `meeting_participants`
   - ✅ `action_items`
   - ✅ `notifications`

If you see all these tables, your database is ready! 🎉

---

### Step 6: Restart Your Development Server

1. Stop your development server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   npm run dev
   ```
3. The application will now detect Supabase and use it for all data storage

---

## ✅ Verification Checklist

After completing the setup, verify everything works:

- [ ] Can sign up with a new email
- [ ] Can log in with existing credentials
- [ ] Profile data persists after refresh
- [ ] Can create meetings and they appear after refresh
- [ ] Can create action items and they persist
- [ ] Settings changes are saved permanently
- [ ] No data is lost when you log out and log back in

---

## 🔄 Data Migration (if you have existing data)

If you have important data in localStorage that you want to keep:

### Option 1: Manual Migration
1. Export your data using the export feature in the app
2. Import it back after setting up Supabase

### Option 2: Start Fresh
- All new data will be stored in Supabase automatically
- Old localStorage data will remain in your browser but won't be used

---

## 🎯 What Changed?

### Before (localStorage):
- ❌ Data stored only in your browser
- ❌ Data lost if you clear browser cache
- ❌ Can't access data from different devices
- ❌ No real-time sync

### After (Supabase):
- ✅ Data stored permanently in the cloud
- ✅ Access your data from any device
- ✅ Data syncs across devices
- ✅ Professional-grade PostgreSQL database
- ✅ Automatic backups
- ✅ Real-time features enabled

---

## 🔒 Security Features

Your data is protected by:

- **Row Level Security (RLS)**: Users can only see/edit their own data
- **Authentication**: Supabase handles secure user authentication
- **HTTPS**: All connections are encrypted
- **JWT Tokens**: Secure session management

---

## 🐛 Troubleshooting

### "Error connecting to Supabase"
- Check that your `.env.local` file has the correct credentials
- Ensure there are no extra spaces in the credentials
- Restart your dev server after changing environment variables

### "Authentication error"
- Make sure you've run the SQL schema in Supabase
- Check that the `users` table exists in your database

### "Data not persisting"
- Open browser console and look for error messages
- Verify your Supabase project URL and anon key are correct
- Check that Row Level Security policies are set up (they should be from the SQL script)

### Still using localStorage?
- Check browser console for a message about Supabase configuration
- Verify `.env.local` file is in the project root (not in a subdirectory)
- File must be named exactly `.env.local` (with the dot at the start)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 Success!

Once you complete these steps, your application will be using Supabase for all data storage. All meetings, action items, profiles, and settings will be stored permanently in the cloud!

**Need Help?** If you encounter any issues, check the browser console for error messages or refer to the troubleshooting section above.
