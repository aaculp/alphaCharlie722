# Migration 019: Venue Reviews & Ratings System

## Overview

This migration implements a comprehensive reviews and ratings system for venues, including:

- Star ratings (1-5) with optional written reviews
- Helpful votes on reviews
- Venue owner responses to reviews
- Review reporting and moderation
- Aggregate rating calculations via database triggers
- Row Level Security (RLS) policies for data access control

## Requirements

- **Spec**: `.kiro/specs/venue-reviews-ratings/`
- **Requirements**: 14.1, 14.8, 15.1
- **Dependencies**: 
  - `public.venues` table must exist
  - `public.check_ins` table must exist (for verified review badges)
  - `public.venue_business_accounts` table must exist (for venue owner permissions)
  - `auth.users` table must exist (Supabase auth)

## Files

- `019_create_reviews_ratings_tables.sql` - Main migration script
- `verify_reviews_ratings_schema.sql` - Verification script to check schema
- `test_reviews_ratings_rls.sql` - RLS policy testing script
- `rollback_019_reviews_ratings.sql` - Rollback script (WARNING: Deletes all data)
- `README_019_REVIEWS_RATINGS.md` - This file

## Database Objects Created

### Tables

1. **reviews** - User reviews with star ratings and optional text
   - Columns: id, venue_id, user_id, rating, review_text, is_verified, helpful_count, created_at, updated_at
   - Constraints: unique (user_id, venue_id), rating 1-5, review_text max 500 chars
   - Indexes: venue_id, user_id, rating, created_at, helpful_count, is_verified

2. **helpful_votes** - Tracks which users found which reviews helpful
   - Columns: id, review_id, user_id, created_at
   - Constraints: unique (user_id, review_id)
   - Indexes: review_id, user_id

3. **venue_responses** - Venue owner responses to reviews
   - Columns: id, review_id, venue_id, response_text, created_at, updated_at
   - Constraints: unique (review_id), response_text max 300 chars
   - Indexes: review_id, venue_id

4. **review_reports** - User reports of inappropriate reviews
   - Columns: id, review_id, reporter_user_id, reason, details, status, created_at
   - Constraints: unique (reporter_user_id, review_id), reason enum, status enum
   - Indexes: review_id, status

### Venues Table Updates

- Added `aggregate_rating` column (NUMERIC(2,1), default 0.0)
- Added `review_count` column (INTEGER, default 0)
- Added index on `aggregate_rating`

### Triggers

1. **update_venue_rating()** - Automatically recalculates venue aggregate rating and review count
   - Fires on: INSERT, UPDATE (rating), DELETE on reviews table
   
2. **update_helpful_count()** - Automatically updates helpful_count on reviews
   - Fires on: INSERT, DELETE on helpful_votes table
   
3. **set_verified_status()** - Automatically sets is_verified based on check-in history
   - Fires on: INSERT on reviews table (BEFORE)
   
4. **update_reviews_updated_at()** - Updates updated_at timestamp
   - Fires on: UPDATE on reviews and venue_responses tables

### RLS Policies

#### Reviews Table
- `Anyone can view reviews` - SELECT for all users
- `Authenticated users can create reviews` - INSERT for authenticated users (own reviews only)
- `Users can update own reviews` - UPDATE for review owner
- `Users can delete own reviews` - DELETE for review owner

#### Helpful Votes Table
- `Anyone can view helpful votes` - SELECT for all users
- `Authenticated users can create helpful votes` - INSERT for authenticated users
- `Users can delete own helpful votes` - DELETE for vote owner

#### Venue Responses Table
- `Anyone can view venue responses` - SELECT for all users
- `Venue owners can create responses` - INSERT for venue owners only
- `Venue owners can update responses` - UPDATE for venue owners only
- `Venue owners can delete responses` - DELETE for venue owners only

#### Review Reports Table
- `Users can view own reports` - SELECT for report creator
- `Authenticated users can create reports` - INSERT for authenticated users

## Installation

### Step 1: Run the Migration

```sql
-- In Supabase SQL Editor or psql
\i database/migrations/019_create_reviews_ratings_tables.sql
```

Or copy and paste the contents of `019_create_reviews_ratings_tables.sql` into the Supabase SQL Editor and execute.

### Step 2: Verify the Schema

```sql
-- Run verification script
\i database/migrations/verify_reviews_ratings_schema.sql
```

Check that all tables, indexes, triggers, and policies show ✓ status.

### Step 3: Test RLS Policies

```sql
-- Run RLS test script
\i database/migrations/test_reviews_ratings_rls.sql
```

This will verify constraints and triggers are working. Manual testing is required for authenticated user scenarios.

### Step 4: Manual Testing Checklist

After running the migration, test these scenarios:

1. **Review Creation**
   - [ ] Authenticated user can create a review
   - [ ] User cannot create duplicate review for same venue
   - [ ] Rating must be 1-5
   - [ ] Review text cannot exceed 500 characters
   - [ ] Verified badge appears if user checked in

2. **Review Updates**
   - [ ] User can edit their own review
   - [ ] User cannot edit other users' reviews
   - [ ] updated_at timestamp updates correctly
   - [ ] Aggregate rating recalculates on update

3. **Review Deletion**
   - [ ] User can delete their own review
   - [ ] User cannot delete other users' reviews
   - [ ] Aggregate rating recalculates on delete
   - [ ] Helpful votes are cascade deleted

4. **Helpful Votes**
   - [ ] User can mark review as helpful
   - [ ] User can toggle helpful vote off
   - [ ] User cannot vote on own review
   - [ ] helpful_count updates automatically

5. **Venue Responses**
   - [ ] Venue owner can respond to reviews
   - [ ] Non-owners cannot respond
   - [ ] Only one response per review
   - [ ] Response text limited to 300 characters

6. **Review Reports**
   - [ ] User can report a review
   - [ ] User cannot report same review twice
   - [ ] User can only view their own reports

## Performance Considerations

### Indexes

All critical query paths are indexed:
- Reviews by venue (for venue detail screen)
- Reviews by user (for user profile)
- Reviews by rating (for filtering)
- Reviews by created_at (for sorting)
- Reviews by helpful_count (for "Most Helpful" sort)

### Triggers

Triggers are optimized to:
- Only recalculate when necessary (rating changes, not text changes)
- Use efficient aggregate queries
- Execute in O(1) time for helpful count updates

### Caching Strategy

The application layer should implement:
- 5-minute TTL cache for review lists
- Immediate cache invalidation on new review submission
- Aggregate ratings cached on venues table (no query needed)

## Monitoring

### Key Metrics to Monitor

1. **Trigger Performance**
   - Monitor execution time of `update_venue_rating()` trigger
   - Alert if trigger takes > 100ms

2. **Query Performance**
   - Monitor review list fetch time (target: < 300ms)
   - Monitor review submission time (target: < 500ms)

3. **Data Integrity**
   - Monitor for aggregate_rating mismatches
   - Monitor for orphaned helpful_votes or venue_responses

### Monitoring Queries

```sql
-- Check for aggregate rating mismatches
SELECT 
    v.id,
    v.aggregate_rating as stored_rating,
    ROUND(AVG(r.rating)::numeric, 1) as calculated_rating,
    v.review_count as stored_count,
    COUNT(r.id) as actual_count
FROM venues v
LEFT JOIN reviews r ON r.venue_id = v.id
GROUP BY v.id
HAVING 
    v.aggregate_rating != COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0)
    OR v.review_count != COUNT(r.id);

-- Check for orphaned helpful_votes (should be none due to CASCADE)
SELECT COUNT(*) as orphaned_votes
FROM helpful_votes hv
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r WHERE r.id = hv.review_id
);

-- Check trigger execution stats (PostgreSQL 13+)
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses');
```

## Rollback

**WARNING**: Rollback will permanently delete all review data!

```sql
-- Make a backup first!
pg_dump -t reviews -t helpful_votes -t venue_responses -t review_reports > reviews_backup.sql

-- Then run rollback
\i database/migrations/rollback_019_reviews_ratings.sql
```

## Troubleshooting

### Issue: Aggregate rating not updating

**Symptoms**: New reviews don't update venue aggregate_rating

**Solution**:
```sql
-- Check if triggers are enabled
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'reviews';

-- Manually recalculate all aggregate ratings
UPDATE venues v
SET 
    aggregate_rating = COALESCE(
        (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE venue_id = v.id),
        0.0
    ),
    review_count = COALESCE(
        (SELECT COUNT(*) FROM reviews WHERE venue_id = v.id),
        0
    );
```

### Issue: RLS policy blocking legitimate access

**Symptoms**: Users getting permission denied errors

**Solution**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports');

-- Check policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'reviews';

-- Test with specific user (replace UUID)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM reviews WHERE user_id = 'user-uuid-here';
RESET ROLE;
```

### Issue: Verified badge not appearing

**Symptoms**: is_verified always false even for users who checked in

**Solution**:
```sql
-- Check if check_ins table exists and has data
SELECT COUNT(*) FROM check_ins;

-- Check if trigger is firing
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_set_verified_status';

-- Manually update verified status for existing reviews
UPDATE reviews r
SET is_verified = EXISTS (
    SELECT 1 FROM check_ins c 
    WHERE c.user_id = r.user_id 
    AND c.venue_id = r.venue_id
);
```

## Next Steps

After successful migration:

1. **Backend Implementation**
   - Implement `ReviewService` API layer (Task 5)
   - Implement `ContentModerationService` (Task 4)
   - Add rate limiting (Task 22)

2. **Frontend Implementation**
   - Create review UI components (Tasks 10-14)
   - Integrate with check-out flow (Task 16)
   - Update venue detail screen (Task 17)

3. **Testing**
   - Write property-based tests (Task 27.1)
   - Write unit tests (Task 27.2-27.3)
   - Performance testing (Task 27.6)

## Support

For issues or questions:
- Check the spec: `.kiro/specs/venue-reviews-ratings/`
- Review the design: `.kiro/specs/venue-reviews-ratings/design.md`
- Check requirements: `.kiro/specs/venue-reviews-ratings/requirements.md`

## Change Log

- **2024-01-18**: Initial migration created
  - Created reviews, helpful_votes, venue_responses, review_reports tables
  - Added aggregate_rating and review_count to venues table
  - Implemented triggers for automatic calculations
  - Set up RLS policies for data access control
