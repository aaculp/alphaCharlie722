# Review Trigger Fix - RPC Function Approach

## Problem

Database triggers don't fire when reviews are updated through the Supabase PostgREST API (only when using direct SQL). This causes venue aggregate ratings to become stale when users submit or update reviews from the app.

**Symptoms:**
- Reviews update correctly in the database
- Venue `aggregate_rating` and `review_count` don't update
- Trigger works with manual SQL UPDATE but not with app updates
- Real-time subscriptions don't receive events

## Root Cause

Supabase PostgREST bypasses certain PostgreSQL triggers for performance reasons. The `AFTER UPDATE OF rating` trigger condition doesn't always fire when updates come through the REST API.

## Solution

Replace trigger-based approach with PostgreSQL RPC (Remote Procedure Call) functions that the app calls directly. This ensures venue ratings are updated atomically in the same transaction as the review update.

## Implementation Steps

### 1. Run the SQL Script

Run the SQL script to create RPC functions and fix existing data:

```bash
# In Supabase SQL Editor, run:
database/fix-review-trigger-with-rpc.sql
```

This script will:
- Create 3 RPC functions:
  - `update_review_and_venue_rating()` - Update existing review
  - `submit_review_and_update_venue()` - Submit new review
  - `delete_review_and_update_venue()` - Delete review
- Fix all existing venue ratings (one-time update)
- Verify the fix for Palm Bay Test Venue

### 2. App Code Changes (Already Done)

The following files have been updated to use RPC functions:

- `src/services/api/reviews.ts`:
  - `submitReview()` - Now calls `submit_review_and_update_venue()`
  - `updateReview()` - Now calls `update_review_and_venue_rating()`
  - `deleteReview()` - Now calls `delete_review_and_update_venue()`

### 3. Test the Fix

1. **Run the SQL script** in Supabase SQL Editor
2. **Reload the app** with cache reset:
   ```bash
   npm start --reset-cache
   ```
3. **Test review update flow**:
   - Open Palm Bay Test Venue
   - Update your review rating (e.g., 1 star → 5 stars)
   - Go back to HomeScreen
   - Pull down to refresh
   - Verify the venue card shows the updated rating

### 4. Verify Real-time Updates

After running the SQL script, real-time updates should work:

1. Update a review from VenueDetailScreen
2. Check console logs for:
   - `✅ Review updated successfully via RPC:`
   - `🔄 Review changed:` (real-time subscription)
   - `🔄 Venue updated:` (real-time subscription)
3. HomeScreen should automatically refresh with new rating

## How It Works

### Before (Trigger Approach - BROKEN)
```
App → Supabase REST API → UPDATE reviews
                        ↓
                   Trigger (doesn't fire)
                        ↓
                   UPDATE venues (never happens)
```

### After (RPC Approach - WORKING)
```
App → Supabase RPC → update_review_and_venue_rating()
                   ↓
              UPDATE reviews + UPDATE venues
              (atomic transaction)
```

## Benefits

1. **Guaranteed consistency** - Venue ratings always update with reviews
2. **Atomic transactions** - Both updates succeed or fail together
3. **No trigger issues** - Direct function calls always work
4. **Better performance** - Single round-trip to database
5. **Real-time compatible** - Supabase Realtime broadcasts both changes

## Rollback Plan

If you need to rollback to the old approach:

1. Run the original migration:
   ```sql
   -- See database/migrations/019_final_simple.sql
   ```

2. Revert the app code changes in `src/services/api/reviews.ts`

## Monitoring

After deployment, monitor:

1. **Review submission success rate** - Should remain 100%
2. **Venue rating accuracy** - Should always match calculated average
3. **Real-time update latency** - Should be < 1 second
4. **Database errors** - Check Supabase logs for RPC errors

## Additional Notes

- RPC functions use `SECURITY DEFINER` to run with elevated privileges
- Functions validate user permissions before updating
- All existing triggers remain in place as backup (won't hurt)
- Cache invalidation still works as before
