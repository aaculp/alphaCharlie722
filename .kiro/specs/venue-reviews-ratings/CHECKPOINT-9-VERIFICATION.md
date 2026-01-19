# Checkpoint 9: Backend Functionality Verification

## Overview

This checkpoint verifies that all backend components of the Venue Reviews & Ratings System are functioning correctly before proceeding to frontend implementation.

## What Has Been Implemented

### ✅ Database Schema (Tasks 1-3)
- `reviews` table with all required columns and constraints
- `helpful_votes` table for tracking helpful votes
- `venue_responses` table for venue owner responses
- `review_reports` table for content moderation
- `venues` table updated with `aggregate_rating` and `review_count` columns
- All necessary indexes for performance
- Row Level Security (RLS) policies for all tables

### ✅ Database Triggers (Task 2)
- `update_venue_rating()` - Recalculates aggregate rating when reviews change
- `update_helpful_count()` - Updates helpful count when votes change
- `set_verified_status()` - Automatically sets verified status based on check-ins

### ✅ Content Moderation Service (Task 4)
- Profanity filtering with `bad-words` library
- Tiered approach: none/mild/severe
- Venue-specific whitelist (cocktails, breast, etc.)
- Review text validation (length, whitespace)

### ✅ Review Service API (Tasks 5-8)
- `submitReview()` - Create new reviews with validation
- `updateReview()` - Update existing reviews
- `deleteReview()` - Delete reviews with ownership validation
- `getVenueReviews()` - Fetch reviews with sorting/filtering/pagination
- `getUserReviewForVenue()` - Check if user has reviewed venue
- `toggleHelpfulVote()` - Add/remove helpful votes
- `submitVenueResponse()` - Venue owners respond to reviews
- `updateVenueResponse()` - Update venue responses
- `deleteVenueResponse()` - Delete venue responses
- `reportReview()` - Report inappropriate reviews

## Verification Methods

### Method 1: Database SQL Tests (Recommended)

**File:** `database/test-reviews-backend-manual.sql`

This comprehensive SQL script tests:
- Review submission with validation
- Review text validation (length, whitespace)
- Rating validation (1-5 range)
- Review update and deletion
- Helpful votes (add, remove, constraints)
- Venue owner responses
- Review reporting
- Aggregate rating calculation
- Verified review status
- Review sorting and filtering
- RLS policies

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `database/test-reviews-backend-manual.sql`
3. Replace placeholder UUIDs with actual values from your database
4. Run each test section sequentially
5. Verify expected results after each test

### Method 2: API Endpoint Tests (Alternative)

**File:** `src/services/api/__tests__/reviews.manual-test.ts`

This TypeScript script tests all API endpoints programmatically.

**How to run:**
1. Update `TEST_CONFIG` section with actual IDs from your database
2. Run: `npx ts-node src/services/api/__tests__/reviews.manual-test.ts`
3. Review console output for test results

**Note:** This method requires proper Supabase authentication setup.

### Method 3: Existing Verification Scripts

**Schema Verification:**
```sql
-- Run in Supabase SQL Editor
-- File: database/migrations/verify_reviews_ratings_schema.sql
```

**RLS Policy Tests:**
```sql
-- Run in Supabase SQL Editor
-- File: database/migrations/test_reviews_ratings_rls.sql
```

## Verification Checklist

Use this checklist to track your verification progress:

### Database Schema
- [ ] All tables exist (reviews, helpful_votes, venue_responses, review_reports)
- [ ] Venues table has aggregate_rating and review_count columns
- [ ] All indexes are created
- [ ] All constraints are enforced (unique, check, foreign key)

### Database Triggers
- [ ] Insert review → aggregate_rating updates
- [ ] Update review rating → aggregate_rating recalculates
- [ ] Delete review → aggregate_rating recalculates and review_count decrements
- [ ] Add helpful vote → helpful_count increments
- [ ] Remove helpful vote → helpful_count decrements
- [ ] New review → is_verified set based on check-in history

### Content Moderation
- [ ] Normal content passes without filtering
- [ ] Mild profanity is censored with asterisks
- [ ] Severe content (hate speech/threats) is rejected
- [ ] Venue-specific terms (cocktails, breast) are whitelisted
- [ ] Empty/whitespace-only text is rejected
- [ ] Text exceeding 500 characters is rejected
- [ ] Valid text is trimmed and accepted

### Review Submission
- [ ] Valid review is created successfully
- [ ] Duplicate review is rejected (one per user per venue)
- [ ] Review with rating only (no text) is accepted
- [ ] Invalid rating (<1 or >5) is rejected
- [ ] Review with profanity is censored
- [ ] Review with severe content is rejected

### Review Fetching
- [ ] Get venue reviews returns correct data
- [ ] Sorting by "recent" works (created_at DESC)
- [ ] Sorting by "highest" works (rating DESC)
- [ ] Sorting by "lowest" works (rating ASC)
- [ ] Sorting by "helpful" works (helpful_count DESC)
- [ ] Filtering by rating works (e.g., 5 stars only)
- [ ] Filtering by verified only works
- [ ] Pagination works (limit/offset)
- [ ] Get user's review for venue works

### Review Update
- [ ] User can update their own review
- [ ] User cannot update someone else's review
- [ ] Updated timestamp is later than created timestamp
- [ ] Aggregate rating recalculates after update

### Review Deletion
- [ ] User can delete their own review
- [ ] User cannot delete someone else's review
- [ ] Aggregate rating recalculates after deletion
- [ ] Review count decrements after deletion

### Helpful Votes
- [ ] User can add helpful vote to review
- [ ] User can remove helpful vote (toggle off)
- [ ] User cannot vote on their own review
- [ ] Duplicate votes are prevented (one per user per review)
- [ ] Helpful count updates correctly

### Venue Owner Responses
- [ ] Venue owner can submit response to review
- [ ] Response text is limited to 300 characters
- [ ] Venue owner can update their response
- [ ] Venue owner can delete their response
- [ ] Non-owners cannot submit responses (RLS policy)
- [ ] Duplicate responses are prevented (one per review)

### Review Reporting
- [ ] User can report a review
- [ ] Duplicate reports are prevented (one per user per review)
- [ ] Reported review remains visible (not hidden)
- [ ] Report creates moderation ticket

### RLS Policies
- [ ] Anyone can view reviews (no auth required)
- [ ] Authenticated users can create reviews
- [ ] Users can only update their own reviews
- [ ] Users can only delete their own reviews
- [ ] Venue owners can create/update/delete responses
- [ ] Users can only view their own reports

## Expected Results

### Aggregate Rating Calculation

When you insert multiple reviews:
```sql
-- Example: 5 reviews with ratings 5, 4, 3, 5, 4
-- Expected aggregate_rating: 4.2
-- Expected review_count: 5
```

The trigger should automatically calculate:
- `aggregate_rating = ROUND(AVG(rating), 1)`
- `review_count = COUNT(*)`

### Helpful Count Updates

When you add/remove helpful votes:
```sql
-- Initial: helpful_count = 0
-- Add vote: helpful_count = 1
-- Remove vote: helpful_count = 0
```

The trigger should automatically update the count.

### Verified Status

When a review is created:
```sql
-- If user has checked in to venue: is_verified = true
-- If user has NOT checked in: is_verified = false
```

The trigger should automatically set this on INSERT.

## Common Issues and Solutions

### Issue 1: Triggers Not Firing

**Symptom:** Aggregate rating not updating after review submission

**Solution:**
1. Check if triggers exist:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%review%';
   ```
2. Verify trigger functions exist:
   ```sql
   SELECT * FROM pg_proc WHERE proname LIKE '%review%';
   ```
3. Re-run migration if needed

### Issue 2: RLS Policies Too Restrictive

**Symptom:** Cannot insert/update/delete even with correct permissions

**Solution:**
1. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'reviews';
   ```
2. Verify you're authenticated:
   ```sql
   SELECT auth.uid();
   ```
3. Check if RLS is enabled:
   ```sql
   SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'reviews';
   ```

### Issue 3: Content Moderation Not Working

**Symptom:** Profanity not being filtered

**Solution:**
1. Verify `bad-words` library is installed:
   ```bash
   npm list bad-words
   ```
2. Check ContentModerationService is being called in ReviewService
3. Test content moderation directly:
   ```typescript
   ContentModerationService.filterProfanity('test text');
   ```

### Issue 4: Duplicate Review Error

**Symptom:** Cannot submit review even though user hasn't reviewed venue

**Solution:**
1. Check if review already exists:
   ```sql
   SELECT * FROM reviews WHERE user_id = 'USER_ID' AND venue_id = 'VENUE_ID';
   ```
2. Delete existing review if it's a test:
   ```sql
   DELETE FROM reviews WHERE user_id = 'USER_ID' AND venue_id = 'VENUE_ID';
   ```

## Questions to Ask User

After completing verification, ask the user:

1. **Did all database schema tests pass?**
   - All tables created?
   - All indexes created?
   - All constraints working?

2. **Did all trigger tests pass?**
   - Aggregate rating updates correctly?
   - Helpful count updates correctly?
   - Verified status sets correctly?

3. **Did all API endpoint tests pass?**
   - Review submission works?
   - Review fetching works?
   - Review update/delete works?
   - Helpful votes work?
   - Venue responses work?
   - Review reporting works?

4. **Did content moderation tests pass?**
   - Normal content passes?
   - Mild profanity censored?
   - Severe content rejected?
   - Whitelist working?

5. **Are there any errors or unexpected behaviors?**
   - If yes, what are they?
   - Do you need help troubleshooting?

6. **Are you ready to proceed to frontend implementation?**
   - If yes, we'll move to Task 10 (ReviewSubmissionModal)
   - If no, what needs to be fixed?

## Next Steps

Once all verification tests pass:

1. ✅ Mark Task 9 as complete
2. 📝 Document any issues encountered and how they were resolved
3. 🚀 Proceed to Task 10: Create ReviewSubmissionModal component
4. 💾 Commit all changes to version control

## Additional Resources

- **Migration File:** `database/migrations/019_create_reviews_ratings_tables.sql`
- **Rollback Script:** `database/migrations/rollback_019_reviews_ratings.sql`
- **README:** `database/migrations/README_019_REVIEWS_RATINGS.md`
- **Schema Verification:** `database/migrations/verify_reviews_ratings_schema.sql`
- **RLS Tests:** `database/migrations/test_reviews_ratings_rls.sql`
- **Requirements:** `.kiro/specs/venue-reviews-ratings/requirements.md`
- **Design:** `.kiro/specs/venue-reviews-ratings/design.md`

---

**Last Updated:** January 18, 2026
**Status:** Ready for Verification
