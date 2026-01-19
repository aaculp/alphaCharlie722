# Review System Index Strategy

## Overview

This document outlines the indexing strategy for the venue reviews and ratings system, ensuring optimal query performance for all common access patterns.

## Requirements

- **Requirement 14.8**: Index the reviews table on venue_id, created_at, and rating for efficient queries
- **Requirement 18.3**: Implement database indexes on frequently queried fields

## Index Coverage

### Reviews Table

#### Single-Column Indexes

1. **idx_reviews_venue_id** - `venue_id`
   - **Purpose**: Filter reviews by venue
   - **Queries**: All venue-specific review queries
   - **Cardinality**: High (many venues)
   - **Usage**: Very frequent

2. **idx_reviews_user_id** - `user_id`
   - **Purpose**: Find all reviews by a user
   - **Queries**: User profile, "My Reviews" section
   - **Cardinality**: High (many users)
   - **Usage**: Moderate

3. **idx_reviews_rating** - `rating`
   - **Purpose**: Filter by star rating
   - **Queries**: Rating distribution, filter by rating
   - **Cardinality**: Low (1-5 values)
   - **Usage**: Moderate

4. **idx_reviews_created_at** - `created_at DESC`
   - **Purpose**: Sort by most recent
   - **Queries**: Default review list sort
   - **Cardinality**: High (unique timestamps)
   - **Usage**: Very frequent

5. **idx_reviews_helpful_count** - `helpful_count DESC`
   - **Purpose**: Sort by most helpful
   - **Queries**: "Most Helpful" sort option
   - **Cardinality**: Medium
   - **Usage**: Moderate

6. **idx_reviews_verified** - `is_verified WHERE is_verified = true` (Partial)
   - **Purpose**: Filter verified reviews only
   - **Queries**: "Verified Only" filter
   - **Cardinality**: Medium (subset of reviews)
   - **Usage**: Low to moderate
   - **Note**: Partial index saves space by only indexing verified reviews

#### Composite Indexes

1. **idx_reviews_venue_rating** - `(venue_id, rating)`
   - **Purpose**: Filter reviews by venue AND rating
   - **Queries**: "Show me all 5-star reviews for this venue"
   - **Usage**: Frequent (rating filter is common)
   - **Benefit**: Avoids index merge, single index scan

2. **idx_reviews_venue_created** - `(venue_id, created_at DESC)`
   - **Purpose**: Get recent reviews for a venue
   - **Queries**: Default venue review list
   - **Usage**: Very frequent (most common query)
   - **Benefit**: Covers both filter and sort in one index

3. **idx_reviews_venue_helpful** - `(venue_id, helpful_count DESC)`
   - **Purpose**: Get most helpful reviews for a venue
   - **Queries**: "Most Helpful" sort for venue
   - **Usage**: Moderate
   - **Benefit**: Optimizes helpful sort without separate index scan

#### Unique Constraints (Act as Indexes)

1. **unique_user_venue_review** - `(user_id, venue_id)`
   - **Purpose**: Enforce one review per user per venue
   - **Queries**: Check if user already reviewed venue
   - **Usage**: Frequent (before every review submission)
   - **Benefit**: Prevents duplicates AND provides fast lookup

### Helpful Votes Table

1. **idx_helpful_votes_review_id** - `review_id`
   - **Purpose**: Count helpful votes for a review
   - **Queries**: Calculate helpful_count
   - **Usage**: Frequent (trigger updates)

2. **idx_helpful_votes_user_id** - `user_id`
   - **Purpose**: Find all votes by a user
   - **Queries**: User activity tracking
   - **Usage**: Low

3. **unique_user_review_vote** - `(user_id, review_id)`
   - **Purpose**: Prevent duplicate votes
   - **Queries**: Check if user already voted
   - **Usage**: Frequent (before every vote toggle)

### Venue Responses Table

1. **idx_venue_responses_review_id** - `review_id`
   - **Purpose**: Find response for a review
   - **Queries**: Display response with review
   - **Usage**: Frequent

2. **idx_venue_responses_venue_id** - `venue_id`
   - **Purpose**: Find all responses by venue owner
   - **Queries**: Venue dashboard, response management
   - **Usage**: Moderate

3. **unique_review_response** - `review_id`
   - **Purpose**: One response per review
   - **Queries**: Check if review has response
   - **Usage**: Frequent

### Review Reports Table

1. **idx_review_reports_review_id** - `review_id`
   - **Purpose**: Count reports for a review
   - **Queries**: Moderation dashboard
   - **Usage**: Low to moderate

2. **idx_review_reports_status** - `status`
   - **Purpose**: Filter by moderation status
   - **Queries**: Pending reports queue
   - **Usage**: Moderate (admin only)

3. **idx_review_reports_pending** - `status WHERE status = 'pending'` (Partial)
   - **Purpose**: Optimize pending reports query
   - **Queries**: Moderation queue
   - **Usage**: Moderate (admin only)
   - **Benefit**: Smaller index, faster scans

4. **unique_user_review_report** - `(reporter_user_id, review_id)`
   - **Purpose**: Prevent duplicate reports
   - **Queries**: Check if user already reported
   - **Usage**: Low

### Venues Table (Updated)

1. **idx_venues_aggregate_rating** - `aggregate_rating DESC`
   - **Purpose**: Sort venues by rating
   - **Queries**: "Top Rated Venues" lists
   - **Usage**: Moderate
   - **Benefit**: Fast sorting for leaderboards

## Query Patterns and Index Usage

### Common Query 1: Get Recent Reviews for Venue

```sql
SELECT * FROM reviews 
WHERE venue_id = $1 
ORDER BY created_at DESC 
LIMIT 20;
```

**Index Used**: `idx_reviews_venue_created` (composite)
- Single index scan covers both filter and sort
- No additional sorting needed
- Optimal performance

### Common Query 2: Get Reviews by Rating for Venue

```sql
SELECT * FROM reviews 
WHERE venue_id = $1 AND rating = $2 
ORDER BY created_at DESC 
LIMIT 20;
```

**Index Used**: `idx_reviews_venue_rating` (composite) + sort
- Index scan filters by venue and rating
- Additional sort by created_at (small result set)
- Good performance

**Alternative**: Could add `idx_reviews_venue_rating_created (venue_id, rating, created_at DESC)` if this query is very frequent, but current indexes are sufficient.

### Common Query 3: Get Most Helpful Reviews for Venue

```sql
SELECT * FROM reviews 
WHERE venue_id = $1 
ORDER BY helpful_count DESC 
LIMIT 20;
```

**Index Used**: `idx_reviews_venue_helpful` (composite)
- Single index scan covers both filter and sort
- Optimal performance

### Common Query 4: Check if User Reviewed Venue

```sql
SELECT * FROM reviews 
WHERE user_id = $1 AND venue_id = $2;
```

**Index Used**: `unique_user_venue_review` (unique constraint)
- Unique constraint acts as index
- Very fast lookup (unique = at most 1 row)
- Optimal performance

### Common Query 5: Get User's All Reviews

```sql
SELECT * FROM reviews 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

**Index Used**: `idx_reviews_user_id` + sort
- Index scan on user_id
- Additional sort by created_at
- Good performance (typically small result set per user)

### Common Query 6: Count Helpful Votes for Review

```sql
SELECT COUNT(*) FROM helpful_votes 
WHERE review_id = $1;
```

**Index Used**: `idx_helpful_votes_review_id`
- Index-only scan (count from index)
- Very fast

### Common Query 7: Check if User Voted on Review

```sql
SELECT * FROM helpful_votes 
WHERE user_id = $1 AND review_id = $2;
```

**Index Used**: `unique_user_review_vote` (unique constraint)
- Unique constraint acts as index
- Very fast lookup
- Optimal performance

## Index Maintenance

### Statistics Updates

Run `ANALYZE` regularly to keep query planner statistics up to date:

```sql
ANALYZE public.reviews;
ANALYZE public.helpful_votes;
ANALYZE public.venue_responses;
ANALYZE public.review_reports;
```

**Frequency**: 
- After bulk data loads
- Weekly for production systems
- Automatically via autovacuum (default enabled)

### Index Bloat Monitoring

Monitor index bloat and rebuild if necessary:

```sql
-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'reviews'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Rebuild bloated indexes
REINDEX INDEX CONCURRENTLY idx_reviews_venue_created;
```

**When to Rebuild**:
- Index size grows disproportionately to table size
- Query performance degrades over time
- After large batch deletions

### Unused Index Detection

Identify and remove unused indexes:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports')
AND idx_scan < 100  -- Adjust threshold based on traffic
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Action**: Consider dropping indexes with very low scan counts after verifying they're not needed.

## Performance Targets

Based on Requirements 18.1 and 18.2:

- **Review Fetch Time**: < 300ms (target: < 100ms with indexes)
- **Review Submission Time**: < 500ms (target: < 200ms with indexes)
- **Aggregate Rating Update**: < 50ms (trigger execution)

## Verification

Run the verification script to check index usage:

```bash
psql -f database/verify-review-indexes.sql
```

Expected results:
- All EXPLAIN plans show "Index Scan" or "Bitmap Index Scan"
- No "Seq Scan" on large tables
- `idx_scan` values > 0 in pg_stat_user_indexes
- Query costs < 100 for typical queries

## Future Optimizations

### Potential Additional Indexes

Consider adding these indexes if specific query patterns emerge:

1. **idx_reviews_venue_rating_created** - `(venue_id, rating, created_at DESC)`
   - **When**: If filtering by rating + sorting by date is very frequent
   - **Trade-off**: Larger index size vs. faster queries

2. **idx_reviews_user_venue_created** - `(user_id, venue_id, created_at DESC)`
   - **When**: If user review history queries are very frequent
   - **Trade-off**: Redundant with unique constraint

3. **idx_helpful_votes_user_review** - `(user_id, review_id)`
   - **When**: Already covered by unique constraint
   - **Not needed**: Unique constraint serves as index

### Partitioning Strategy

For very large datasets (millions of reviews), consider partitioning:

```sql
-- Partition by created_at (monthly or yearly)
CREATE TABLE reviews_2024_01 PARTITION OF reviews
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

**When to Partition**:
- Table size > 10GB
- Query patterns favor time-based filtering
- Archive old reviews to separate partitions

## Conclusion

The current index strategy provides comprehensive coverage for all common query patterns in the reviews system. The combination of single-column, composite, and unique constraint indexes ensures optimal performance for:

- Venue review lists (all sort orders)
- User review history
- Helpful vote tracking
- Venue owner responses
- Content moderation

Regular monitoring and maintenance will ensure continued optimal performance as the system scales.
