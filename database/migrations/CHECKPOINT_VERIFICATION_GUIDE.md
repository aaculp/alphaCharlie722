# Checkpoint: Database Setup Verification Guide

## Overview

This guide helps you verify that the Venue Reviews & Ratings System database schema is correctly set up. The migration creates 4 new tables, updates the venues table, and implements triggers and RLS policies.

## What Was Created

### Tables Created
1. **reviews** - Stores user reviews with star ratings and optional text
2. **helpful_votes** - Tracks which users found which reviews helpful
3. **venue_responses** - Stores venue owner responses to customer reviews
4. **review_reports** - Stores user reports of inappropriate reviews

### Tables Updated
- **venues** - Added `aggregate_rating` and `review_count` columns

### Database Triggers
1. **update_venue_rating()** - Recalculates aggregate rating when reviews are inserted/updated/deleted
2. **update_helpful_count()** - Recalculates helpful count when votes are added/removed
3. **set_verified_status()** - Automatically sets verified status based on check-in history
4. **update_reviews_updated_at()** - Updates timestamp on review/response edits

### RLS Policies
- Reviews: Anyone can view, authenticated users can create, users can update/delete own
- Helpful Votes: Anyone can view, authenticated users can create/delete own
- Venue Responses: Anyone can view, venue owners can create/update/delete
- Review Reports: Users can view own reports, authenticated users can create

## Verification Steps

### Step 1: Run Schema Verification

1. Open Supabase Dashboard: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Copy and paste the contents of: `database/migrations/verify_reviews_ratings_schema.sql`
4. Click **Run**

**Expected Output:**
- ✓ All 4 tables exist (reviews, helpful_votes, venue_responses, review_reports)
- ✓ Venues table has aggregate_rating and review_count columns
- ✓ All indexes are created (9+ indexes)
- ✓ All triggers are active (7 triggers)
- ✓ All RLS policies are enabled (13 policies)
- ✓ All constraints exist (unique, check, foreign key)

### Step 2: Run RLS Policy Tests

1. In the **SQL Editor**
2. Copy and paste the contents of: `database/migrations/test_reviews_ratings_rls.sql`
3. Click **Run**

**Expected Output:**
- ✓ Test 1-10 all pass
- ⚠ Manual testing required for authenticated operations

### Step 3: Manual Trigger Testing

Test that triggers correctly update aggregate ratings:

#### Test 3a: Insert Review and Check Aggregate Rating

```sql
-- 1. Get a test venue ID
SELECT id, name, aggregate_rating, review_count 
FROM public.venues 
LIMIT 1;

-- 2. Insert a review (replace YOUR_VENUE_ID with actual ID)
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
  'YOUR_VENUE_ID',
  auth.uid(),
  5,
  'Great place! Highly recommend.'
)
RETURNING *;

-- 3. Verify aggregate rating updated
SELECT id, name, aggregate_rating, review_count
FROM public.venues
WHERE id = 'YOUR_VENUE_ID';
-- Expected: aggregate_rating = 5.0, review_count = 1 (or higher if reviews existed)
```

#### Test 3b: Add Another Review and Check Average

```sql
-- 1. Insert another review with different rating
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
  'YOUR_VENUE_ID',
  'DIFFERENT_USER_ID', -- Must be different user
  3,
  'It was okay.'
)
RETURNING *;

-- 2. Verify aggregate rating is now average
SELECT id, name, aggregate_rating, review_count
FROM public.venues
WHERE id = 'YOUR_VENUE_ID';
-- Expected: aggregate_rating = 4.0 (average of 5 and 3), review_count = 2
```

#### Test 3c: Delete Review and Check Recalculation

```sql
-- 1. Delete one review
DELETE FROM public.reviews
WHERE venue_id = 'YOUR_VENUE_ID'
AND rating = 3;

-- 2. Verify aggregate rating recalculated
SELECT id, name, aggregate_rating, review_count
FROM public.venues
WHERE id = 'YOUR_VENUE_ID';
-- Expected: aggregate_rating = 5.0, review_count = 1
```

#### Test 3d: Test Helpful Vote Trigger

```sql
-- 1. Get a review ID
SELECT id, rating, review_text, helpful_count
FROM public.reviews
LIMIT 1;

-- 2. Add a helpful vote
INSERT INTO public.helpful_votes (review_id, user_id)
VALUES ('YOUR_REVIEW_ID', auth.uid())
RETURNING *;

-- 3. Verify helpful count incremented
SELECT id, rating, review_text, helpful_count
FROM public.reviews
WHERE id = 'YOUR_REVIEW_ID';
-- Expected: helpful_count = 1 (or higher if votes existed)

-- 4. Remove the helpful vote
DELETE FROM public.helpful_votes
WHERE review_id = 'YOUR_REVIEW_ID'
AND user_id = auth.uid();

-- 5. Verify helpful count decremented
SELECT id, rating, review_text, helpful_count
FROM public.reviews
WHERE id = 'YOUR_REVIEW_ID';
-- Expected: helpful_count = 0 (or previous count - 1)
```

#### Test 3e: Test Verified Status Trigger

```sql
-- 1. Create a check-in for a user at a venue
INSERT INTO public.check_ins (user_id, venue_id)
VALUES (auth.uid(), 'YOUR_VENUE_ID')
RETURNING *;

-- 2. Create a review for that venue
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
  'YOUR_VENUE_ID',
  auth.uid(),
  5,
  'Verified review test'
)
RETURNING *;

-- 3. Verify is_verified is true
SELECT id, rating, review_text, is_verified
FROM public.reviews
WHERE venue_id = 'YOUR_VENUE_ID'
AND user_id = auth.uid();
-- Expected: is_verified = true
```

### Step 4: Manual RLS Policy Testing

Test RLS policies with authenticated requests:

#### Test 4a: User Can Only Update Own Reviews

```sql
-- As User A: Create a review
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES ('YOUR_VENUE_ID', auth.uid(), 5, 'My review')
RETURNING *;

-- As User A: Update own review (should succeed)
UPDATE public.reviews
SET rating = 4, review_text = 'Updated review'
WHERE venue_id = 'YOUR_VENUE_ID'
AND user_id = auth.uid();
-- Expected: Success

-- As User B: Try to update User A's review (should fail)
UPDATE public.reviews
SET rating = 1
WHERE venue_id = 'YOUR_VENUE_ID'
AND user_id = 'USER_A_ID'; -- Different user
-- Expected: No rows updated (RLS blocks it)
```

#### Test 4b: Venue Owner Can Create Responses

```sql
-- As Venue Owner: Create a response
INSERT INTO public.venue_responses (review_id, venue_id, response_text)
VALUES (
  'YOUR_REVIEW_ID',
  'YOUR_VENUE_ID',
  'Thank you for your feedback!'
)
RETURNING *;
-- Expected: Success if you own the venue, failure otherwise
```

#### Test 4c: One Review Per User Per Venue

```sql
-- Try to insert duplicate review (should fail)
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES ('YOUR_VENUE_ID', auth.uid(), 5, 'Duplicate review');
-- Expected: Error - unique constraint violation
```

## Verification Checklist

Use this checklist to track your verification progress:

### Schema Verification
- [ ] All 4 tables exist (reviews, helpful_votes, venue_responses, review_reports)
- [ ] Venues table has aggregate_rating and review_count columns
- [ ] All indexes are created (check verify script output)
- [ ] All triggers are active (7 triggers)
- [ ] All RLS policies are enabled (13 policies)
- [ ] All constraints exist (unique, check, foreign key)

### Trigger Testing
- [ ] Insert review → aggregate_rating updates
- [ ] Insert second review → aggregate_rating averages correctly
- [ ] Delete review → aggregate_rating recalculates
- [ ] Add helpful vote → helpful_count increments
- [ ] Remove helpful vote → helpful_count decrements
- [ ] User with check-in → is_verified = true
- [ ] User without check-in → is_verified = false

### RLS Policy Testing
- [ ] Anyone can view reviews (no auth required)
- [ ] Authenticated users can create reviews
- [ ] Users can only update own reviews
- [ ] Users can only delete own reviews
- [ ] Venue owners can create responses
- [ ] Venue owners can update own responses
- [ ] Venue owners can delete own responses
- [ ] Users can view own reports
- [ ] Authenticated users can create reports

### Constraint Testing
- [ ] One review per user per venue (unique constraint)
- [ ] Rating must be 1-5 (check constraint)
- [ ] Review text max 500 characters (check constraint)
- [ ] Response text max 300 characters (check constraint)
- [ ] Cascade delete works (delete review → deletes votes/responses/reports)

## Common Issues and Solutions

### Issue: Triggers not firing

**Solution:** Check if triggers are enabled:
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('reviews', 'helpful_votes');
```

### Issue: RLS policies blocking operations

**Solution:** Verify you're authenticated:
```sql
SELECT auth.uid(); -- Should return your user ID, not NULL
```

### Issue: Aggregate rating not updating

**Solution:** Manually trigger the update:
```sql
SELECT update_venue_rating();
```

### Issue: Foreign key constraint errors

**Solution:** Ensure referenced records exist:
```sql
-- Check if venue exists
SELECT id FROM public.venues WHERE id = 'YOUR_VENUE_ID';

-- Check if user exists
SELECT id FROM auth.users WHERE id = 'YOUR_USER_ID';
```

## Rollback Instructions

If you need to rollback the migration:

1. Open Supabase Dashboard SQL Editor
2. Copy and paste: `database/migrations/rollback_019_reviews_ratings.sql`
3. Click **Run**

This will:
- Drop all 4 new tables
- Remove aggregate_rating and review_count columns from venues
- Drop all triggers and functions
- Remove all RLS policies

## Next Steps

Once verification is complete:

1. ✅ Mark Task 3 as complete in tasks.md
2. ➡️ Proceed to Task 4: Implement ContentModerationService
3. 📝 Document any issues or questions that arose during verification

## Questions or Issues?

If you encounter any problems during verification:

1. Check the migration file: `database/migrations/019_create_reviews_ratings_tables.sql`
2. Review the README: `database/migrations/README_019_REVIEWS_RATINGS.md`
3. Check Supabase logs for error messages
4. Verify your user has appropriate permissions

## Summary

This checkpoint ensures that:
- ✅ All database tables are created correctly
- ✅ Triggers automatically maintain data consistency
- ✅ RLS policies enforce proper security
- ✅ Constraints prevent invalid data

The database foundation is now ready for implementing the ReviewService API layer in the next task.
