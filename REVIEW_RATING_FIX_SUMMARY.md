# Review Rating Fix - Complete Solution

## Problem Summary

Reviews were being submitted and updated successfully in the database, but venue aggregate ratings (`aggregate_rating` and `review_count`) were not updating. This caused stale ratings to display on venue cards in the HomeScreen.

### Root Cause

Database triggers don't fire reliably when updates come through the Supabase PostgREST API. The trigger worked when running SQL directly but failed when the app updated reviews through the REST API.

## Solution

Replaced the trigger-based approach with PostgreSQL RPC (Remote Procedure Call) functions that the app calls directly. This ensures venue ratings are updated atomically in the same transaction as review updates.

## Files Changed

### 1. Database Files (NEW)

- **`database/fix-review-trigger-with-rpc.sql`** - SQL script to create RPC functions and fix existing data
- **`database/apply-rpc-fix.ps1`** - PowerShell helper script to guide you through the fix
- **`database/REVIEW_TRIGGER_RPC_FIX.md`** - Detailed documentation

### 2. App Code (UPDATED)

- **`src/services/api/reviews.ts`** - Updated to use RPC functions:
  - `submitReview()` → calls `submit_review_and_update_venue()`
  - `updateReview()` → calls `update_review_and_venue_rating()`
  - `deleteReview()` → calls `delete_review_and_update_venue()`

## How to Apply the Fix

### Step 1: Run the SQL Script

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: SQL Editor → New Query
3. Copy contents of `database/fix-review-trigger-with-rpc.sql`
4. Paste and run in Supabase SQL Editor
5. Verify output shows:
   ```
   ✅ RPC functions created successfully!
   ✅ Venue ratings updated!
   ```

**OR** run the PowerShell helper:
```powershell
.\database\apply-rpc-fix.ps1
```

### Step 2: Reload the App

```bash
npm start --reset-cache
```

### Step 3: Test the Fix

1. Open Palm Bay Test Venue in the app
2. Update your review rating (e.g., 1 star → 5 stars)
3. Navigate back to HomeScreen
4. Pull down to refresh
5. Verify the venue card shows the updated rating immediately

## What Changed

### Before (Broken)
```
App → Supabase REST API → UPDATE reviews table
                        ↓
                   Trigger (doesn't fire reliably)
                        ↓
                   UPDATE venues table (never happens)
```

### After (Fixed)
```
App → Supabase RPC Function → update_review_and_venue_rating()
                            ↓
                       UPDATE reviews + UPDATE venues
                       (atomic transaction, always works)
```

## Benefits

1. **Guaranteed Consistency** - Venue ratings always update with reviews
2. **Atomic Transactions** - Both updates succeed or fail together
3. **No Trigger Issues** - Direct function calls always work
4. **Better Performance** - Single round-trip to database
5. **Real-time Compatible** - Supabase Realtime broadcasts both changes

## Real-time Updates

The fix also enables proper real-time updates:

1. When a review is updated, the RPC function updates both tables
2. Supabase Realtime broadcasts changes to both `reviews` and `venues` tables
3. HomeScreen subscription receives the venue update event
4. UI automatically refreshes with new rating

Console logs you should see:
```
✅ Review updated successfully via RPC: {...}
🔄 Review changed: {...}
🔄 Venue updated: {...}
🔄 Venue rating updated for displayed venue, refetching...
```

## Verification

After applying the fix, verify:

1. **Review submission** - New reviews update venue rating immediately
2. **Review updates** - Editing reviews updates venue rating immediately
3. **Review deletion** - Deleting reviews updates venue rating immediately
4. **Real-time sync** - HomeScreen shows updated ratings without manual refresh
5. **Database consistency** - Run this query to verify:

```sql
SELECT 
    v.name,
    v.aggregate_rating as stored_rating,
    v.review_count as stored_count,
    COUNT(r.id) as actual_count,
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0) as calculated_rating
FROM venues v
LEFT JOIN reviews r ON r.venue_id = v.id
WHERE v.name ILIKE '%palm bay%'
GROUP BY v.id, v.name, v.aggregate_rating, v.review_count;
```

Expected result: `stored_rating` = `calculated_rating` and `stored_count` = `actual_count`

## Rollback Plan

If you need to rollback:

1. Revert changes in `src/services/api/reviews.ts` (use git)
2. The old triggers are still in place, so the app will work (with the original bug)

## Next Steps

1. ✅ Apply the SQL script in Supabase
2. ✅ Reload the app with cache reset
3. ✅ Test review submission and updates
4. ✅ Verify real-time updates work
5. Monitor for any errors in production

## Support

If you encounter issues:

1. Check Supabase logs for RPC function errors
2. Verify the RPC functions were created successfully
3. Check console logs for error messages
4. See `database/REVIEW_TRIGGER_RPC_FIX.md` for detailed troubleshooting
