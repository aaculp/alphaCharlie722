# SQL Changes Summary - What You Need to Run

## 🔍 Problem Diagnosis

Your database **HAS** the 10 test venues with business accounts (confirmed by your screenshot), but they're **NOT showing in the app**. This is almost certainly a **Row Level Security (RLS)** issue.

## 🎯 Root Cause

The `venue_business_accounts` table likely has RLS enabled but **no SELECT policy** for public/authenticated users. This means:
- ✅ SQL Editor queries work (you run as admin)
- ❌ App queries fail silently (app runs as anonymous/authenticated user)

## 🚀 Quick Fix (Run This Now)

### **Run this file in Supabase SQL Editor:**
```
database/FIX_NEW_VENUES_RLS.sql
```

This script will:
1. Check current RLS status
2. Create a SELECT policy allowing public read access to `venue_business_accounts`
3. Test the query as the app would see it
4. Confirm the fix worked

## 📋 All SQL Files You Should Have Run

### ✅ Social Features (8 migrations)
Located in `database/migrations/`:

1. **001_create_friendships_tables.sql** - Friends and friend requests
2. **002_create_collections_tables.sql** - Venue collections
3. **003_create_venue_shares_activity_feed.sql** - Sharing and activity
4. **004_create_privacy_notifications.sql** - Privacy settings and notifications
5. **005_rls_friendships.sql** - RLS policies for friends
6. **006_rls_collections.sql** - RLS policies for collections
7. **007_rls_activity_feed.sql** - RLS policies for activity feed
8. **008_helper_functions.sql** - Database helper functions

### ✅ New Venues Test Data
Located in `database/`:

- **populate_new_venues.sql** - Creates 10 test venues (you already ran this ✅)
- **clear_new_venues.sql** - Removes test venues (optional cleanup)
- **verify_new_venues.sql** - Checks if venues exist (you already ran this ✅)

### 🆕 New Venues Fix (Run This!)
- **FIX_NEW_VENUES_RLS.sql** - **← RUN THIS NOW!** Fixes RLS policy issue

## 🔧 Troubleshooting Files

If you still have issues after running the fix:

- **TROUBLESHOOT_NEW_VENUES.sql** - Comprehensive diagnostic queries

## 📊 What Each Migration Does

### Social Features Tables Created:
- `friends` - Friend connections
- `friend_requests` - Pending friend requests  
- `collections` - User-created venue lists
- `collection_venues` - Venues in collections
- `venue_shares` - Shared venues between users
- `activity_feed` - Friend activity timeline
- `user_privacy_settings` - Privacy preferences
- `notifications` - In-app notifications

### New Venues Feature:
- Uses existing `venues` table
- Uses existing `venue_business_accounts` table
- **Just needs RLS policy fix!**

## ✅ Verification Steps

After running `FIX_NEW_VENUES_RLS.sql`:

1. **Check the SQL output** - Should show 10 venues in the test query
2. **Restart your app** (close and reopen)
3. **Pull to refresh** on the Home screen
4. **Look for "New Venues" section** - Should appear with sparkles icon
5. **Check console logs** - Should show "✅ New venues fetched: { count: 10 }"

## 🎯 Expected Result

After the fix, you should see:

```
🆕 New Venues
✨ [Horizontal scrolling carousel with 10 venue cards]
   - Each card has "NEW" badge
   - Shows "Opened X days ago"
   - Displays venue image, name, category, rating
```

## 🆘 If Still Not Working

Run these diagnostic queries in order:

1. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'venue_business_accounts';
   ```

2. **Check policies exist:**
   ```sql
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'venue_business_accounts';
   ```

3. **Test as anonymous user:**
   ```sql
   SET ROLE anon;
   SELECT COUNT(*) FROM venue_business_accounts;
   RESET ROLE;
   ```
   - If this returns 0, the RLS policy isn't working
   - If this returns 10+, the policy is working

4. **Check app logs** - Look for error messages in console

## 📝 Summary

**You've already run:**
- ✅ All 8 social feature migrations
- ✅ populate_new_venues.sql (test data created)
- ✅ verify_new_venues.sql (confirmed venues exist)

**You need to run:**
- 🔴 **FIX_NEW_VENUES_RLS.sql** ← This is the missing piece!

This will create the SELECT policy that allows the app to read from `venue_business_accounts` table.
