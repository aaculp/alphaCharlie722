# Profile Personalization Testing Guide

## Quick Testing Checklist

### 1. Basic Profile Load
- [ ] Profile loads without errors
- [ ] Core stats display correctly (check-ins, venues, monthly, favorites)
- [ ] User info displays (name, email, photo)

### 2. Flash Offers Metric
**Test Case: User with redeemed offers**
```sql
-- Check if user has redeemed offers
SELECT COUNT(*) FROM flash_offer_claims 
WHERE user_id = 'YOUR_USER_ID' AND status = 'redeemed';
```
- [ ] "Offers Redeemed" card appears if count > 0
- [ ] Card does NOT appear if count = 0
- [ ] Count matches database

### 3. Reviews & Ratings Metrics
**Test Case: User with reviews**
```sql
-- Check user's reviews and average rating
SELECT 
  COUNT(*) as review_count,
  AVG(rating) as avg_rating
FROM reviews 
WHERE user_id = 'YOUR_USER_ID';
```
- [ ] "Avg Rating" card appears if user has reviews
- [ ] Rating displays with 1 decimal place (e.g., "4.2")
- [ ] Rating matches calculated average

**Test Case: Helpful votes**
```sql
-- Check helpful votes on user's reviews
SELECT COUNT(*) as helpful_votes
FROM helpful_votes hv
JOIN reviews r ON hv.review_id = r.id
WHERE r.user_id = 'YOUR_USER_ID';
```
- [ ] "Helpful Votes" card appears if count > 0
- [ ] Count matches database
- [ ] Subtitle shows "On your reviews"

### 4. Streak Metrics
**Test Case: Active streak**
- [ ] Check in today → Current streak should be ≥ 1
- [ ] Check in yesterday → Current streak should be ≥ 1
- [ ] No check-in for 2+ days → Current streak should be 0
- [ ] "Current Streak" card only appears if streak > 0

**Test Case: Longest streak**
- [ ] "Longest Streak" card appears if user has had any streak
- [ ] Longest streak ≥ current streak
- [ ] Value persists even if current streak is 0

**Manual Test Scenarios:**
1. **New user** (no check-ins)
   - Current streak: 0 (hidden)
   - Longest streak: 0 (hidden)

2. **User with check-in today**
   - Current streak: 1+
   - Card visible

3. **User with consecutive check-ins**
   - Check in Mon, Tue, Wed
   - Current streak: 3
   - Longest streak: 3

4. **User with broken streak**
   - Check in Mon, Tue, skip Wed, check in Thu
   - Current streak: 1
   - Longest streak: 2

### 5. Top Venue Metric
**Test Case: User with check-ins**
```sql
-- Find user's top venue
SELECT 
  v.id,
  v.name,
  COUNT(*) as visit_count
FROM check_ins ci
JOIN venues v ON ci.venue_id = v.id
WHERE ci.user_id = 'YOUR_USER_ID'
GROUP BY v.id, v.name
ORDER BY visit_count DESC
LIMIT 1;
```
- [ ] "Top Venue" card appears if user has check-ins
- [ ] Venue name displays in subtitle
- [ ] Visit count matches database
- [ ] Card does NOT appear for users with no check-ins

### 6. Activity Pattern Metrics
**Test Case: Most active day**
- [ ] "Most Active" card appears if user has check-ins
- [ ] Shows day name (Monday, Tuesday, etc.)
- [ ] Day matches the day with most check-ins

**Test Case: Most active time**
- [ ] "Favorite Time" card appears if user has check-ins
- [ ] Shows time period: Morning, Afternoon, Evening, or Night
- [ ] Time period matches check-in patterns

**Time Period Definitions:**
- Morning: 5am - 11am
- Afternoon: 11am - 5pm
- Evening: 5pm - 9pm
- Night: 9pm - 5am

### 7. Error Handling
**Test Cases:**
- [ ] Profile loads even if some metrics fail to fetch
- [ ] Console shows warnings (not errors) for failed metrics
- [ ] Failed metrics default to 0 or undefined (hidden)
- [ ] No app crashes from missing data

### 8. Performance Testing
**Test with different user profiles:**
- [ ] New user (0 check-ins) - loads quickly
- [ ] Light user (10-50 check-ins) - loads quickly
- [ ] Active user (100-500 check-ins) - loads reasonably
- [ ] Power user (1000+ check-ins) - monitor load time

**Performance Benchmarks:**
- New user: < 1 second
- Light user: < 2 seconds
- Active user: < 3 seconds
- Power user: < 5 seconds

### 9. Visual Testing
**Layout checks:**
- [ ] Cards display in 2-column grid
- [ ] Cards have consistent sizing
- [ ] Icons are color-coded and visible
- [ ] Text is readable on all backgrounds
- [ ] Subtitles display correctly when present
- [ ] Scrolling works smoothly with many cards

**Responsive checks:**
- [ ] Works on small phones (iPhone SE)
- [ ] Works on large phones (iPhone Pro Max)
- [ ] Works on tablets
- [ ] Cards resize appropriately

### 10. Edge Cases
**Test scenarios:**
- [ ] User with exactly 1 check-in
- [ ] User with check-ins at same venue only
- [ ] User with check-ins on same day only
- [ ] User with reviews but no helpful votes
- [ ] User with claimed but not redeemed offers
- [ ] User with very long venue name (truncation)

## Sample Test Data

### Create Test User with Full Data
```sql
-- Assuming user_id = 'test-user-123'

-- Add check-ins (for streaks and top venue)
INSERT INTO check_ins (user_id, venue_id, checked_in_at)
VALUES 
  ('test-user-123', 'venue-1', NOW() - INTERVAL '0 days'),
  ('test-user-123', 'venue-1', NOW() - INTERVAL '1 days'),
  ('test-user-123', 'venue-2', NOW() - INTERVAL '2 days'),
  ('test-user-123', 'venue-1', NOW() - INTERVAL '3 days'),
  ('test-user-123', 'venue-3', NOW() - INTERVAL '7 days');

-- Add favorites
INSERT INTO favorites (user_id, venue_id)
VALUES 
  ('test-user-123', 'venue-1'),
  ('test-user-123', 'venue-2');

-- Add flash offer claim
INSERT INTO flash_offer_claims (user_id, offer_id, status, token, expires_at, redeemed_at)
VALUES 
  ('test-user-123', 'offer-1', 'redeemed', '123456', NOW() + INTERVAL '1 day', NOW());

-- Add reviews
INSERT INTO reviews (user_id, venue_id, rating, review_text)
VALUES 
  ('test-user-123', 'venue-1', 5, 'Great place!'),
  ('test-user-123', 'venue-2', 4, 'Good vibes');

-- Add helpful votes
INSERT INTO helpful_votes (user_id, review_id)
SELECT 'other-user-456', id FROM reviews WHERE user_id = 'test-user-123' LIMIT 1;
```

### Expected Results for Test User
- Check-ins: 5
- Unique Venues: 3
- Monthly Check-ins: 4 (if all in current month)
- Favorites: 2
- Redeemed Offers: 1
- Average Rating: 4.5
- Helpful Votes: 1
- Current Streak: 4 (consecutive days)
- Longest Streak: 4
- Top Venue: venue-1 (3 visits)
- Most Active Day: (depends on dates)
- Most Active Time: (depends on times)

## Debugging Tips

### Check Console Logs
Look for these log messages:
```
🔍 ProfileService: Fetching profile for userId: ...
✅ ProfileService: Profile data fetched
📊 ProfileService: Check-ins count: X
📊 ProfileService: Redeemed offers count: X
📊 ProfileService: Average rating given: X
📊 ProfileService: Helpful votes received: X
📊 ProfileService: Current streak: X, Longest: X
📊 ProfileService: Top venue: ...
📊 ProfileService: Most active day: ..., time: ...
✅ ProfileService: Complete profile constructed
```

### Common Issues

**Issue: Metrics not appearing**
- Check console for warnings
- Verify data exists in database
- Check conditional rendering logic

**Issue: Incorrect counts**
- Verify database queries
- Check for duplicate data
- Verify user_id matches

**Issue: Slow loading**
- Check number of check-ins
- Monitor network tab
- Consider adding indexes

**Issue: Streak calculation wrong**
- Check timezone settings
- Verify check-in timestamps
- Test with known data

## Automated Testing

### Unit Test Example
```typescript
describe('ProfileService.calculateStreaks', () => {
  it('should calculate current streak correctly', () => {
    const dates = [
      new Date().toISOString(), // today
      new Date(Date.now() - 86400000).toISOString(), // yesterday
      new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    ];
    
    const result = ProfileService['calculateStreaks'](dates);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('should return 0 for broken streak', () => {
    const dates = [
      new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    ];
    
    const result = ProfileService['calculateStreaks'](dates);
    expect(result.current).toBe(0);
  });
});
```

## Rollout Strategy

### Phase 1: Internal Testing
- [ ] Test with development accounts
- [ ] Verify all metrics display correctly
- [ ] Check performance with various data sizes
- [ ] Fix any bugs found

### Phase 2: Beta Testing
- [ ] Deploy to beta users
- [ ] Monitor error rates
- [ ] Collect user feedback
- [ ] Optimize slow queries

### Phase 3: Full Rollout
- [ ] Deploy to all users
- [ ] Monitor performance metrics
- [ ] Track engagement with new metrics
- [ ] Iterate based on data

## Success Metrics

Track these metrics post-launch:
- Profile screen load time
- Error rate for metric calculations
- User engagement with profile screen
- Time spent on profile screen
- Feature adoption rate
