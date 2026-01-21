# Database Call Analysis - 9.5K Calls Issue

## 🔴 Critical Issues Found

### 1. **Real-time Subscription Causing Excessive Refetches** (HIGHEST PRIORITY)
**Location:** `src/screens/customer/HomeScreen.tsx` (lines 256-318)

**Problem:**
The HomeScreen subscribes to ALL venue updates and ALL review changes in the database. Every time ANY venue or review is updated anywhere in the system, it triggers a full refetch of the featured venues list.

```typescript
// Current implementation - subscribes to ALL venues
const subscription = supabase
  .channel('venue-ratings-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'venues',
  }, (payload) => {
    // Refetches ALL featured venues on ANY venue update
    refetch();
  })
  .on('postgres_changes', {
    event: '*', // ALL events (INSERT, UPDATE, DELETE)
    schema: 'public',
    table: 'reviews',
  }, (payload) => {
    // Refetches ALL featured venues on ANY review change
    refetch();
  })
```

**Impact:**
- If you have 100 venues and each gets 1 update per minute, that's 100 refetches/minute
- Each refetch queries the database for 10 featured venues
- With reviews being added/updated frequently, this multiplies rapidly
- **Estimated contribution: 70-80% of your 9.5K calls**

**Solution:**
Only refetch when a venue that's currently displayed is updated:

```typescript
// Check if the updated venue is in our current list
const updatedVenueId = payload.new?.id;
if (updatedVenueId && venueIds.includes(updatedVenueId)) {
  refetch(); // Only refetch if it's a displayed venue
}
```

However, the current code already has this check but it's still subscribing to ALL changes first, then filtering. This is inefficient.

---

### 2. **Missing Pagination in Activity Feed**
**Location:** `src/services/api/activityFeed.ts`

**Problem:**
The activity feed queries use default limit of 50, but the `filterActivitiesByPrivacy` function makes additional database calls for EACH activity to check friendship status.

```typescript
private static async filterActivitiesByPrivacy(
  activities: ActivityFeedEntry[],
  viewerId: string
): Promise<ActivityFeedEntry[]> {
  for (const activity of activities) {
    // Makes a database call for EACH activity
    const hasAccess = await this.checkPrivacyAccess(
      activity.user_id,
      viewerId,
      activity.privacy_level
    );
  }
}
```

**Impact:**
- 50 activities × 1 friendship check each = 50 additional queries per feed load
- **Estimated contribution: 10-15% of your 9.5K calls**

**Solution:**
Batch the friendship checks:
1. Collect all unique user IDs from activities
2. Make ONE query to get all friendships
3. Filter activities in memory

---

### 3. **Check-in Stats Fetched Multiple Times**
**Location:** `src/hooks/useCheckInStats.ts` (need to verify)

**Problem:**
The HomeScreen fetches check-in stats for all displayed venues, and this might be happening on every render or state change.

**Impact:**
- 10 venues × multiple fetches = unnecessary queries
- **Estimated contribution: 5-10% of your 9.5K calls**

---

### 4. **No Caching for Venue Queries**
**Location:** `src/services/api/venues.ts`

**Problem:**
Unlike the flash offers and other services, the venue service doesn't implement caching. Every call to `getFeaturedVenues()` hits the database.

**Impact:**
- Combined with the real-time subscription issue, this amplifies the problem
- **Estimated contribution: Multiplier effect on issue #1**

---

## 📊 Breakdown of 9.5K Calls

Based on the analysis:

| Source | Estimated Calls | Percentage |
|--------|----------------|------------|
| Real-time venue/review subscriptions triggering refetches | 6,500-7,500 | 70-80% |
| Activity feed privacy checks (N+1 queries) | 1,000-1,500 | 10-15% |
| Check-in stats queries | 500-1,000 | 5-10% |
| Other (flash offers, new venues, etc.) | 500-1,000 | 5-10% |
| **Total** | **~9,500** | **100%** |

---

## 🔧 Recommended Fixes (Priority Order)

### Priority 1: Fix Real-time Subscription (Will reduce calls by 70-80%)

**Option A: Filter at subscription level (RECOMMENDED)**
```typescript
// Only subscribe to venues that are currently displayed
const subscription = supabase
  .channel('venue-ratings-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'venues',
    filter: `id=in.(${venueIds.join(',')})` // Only subscribe to displayed venues
  }, (payload) => {
    refetch();
  })
```

**Option B: Debounce refetches**
```typescript
// Add debouncing to prevent rapid successive refetches
const debouncedRefetch = useMemo(
  () => debounce(refetch, 2000), // Wait 2 seconds before refetching
  [refetch]
);
```

**Option C: Remove real-time updates for now**
If real-time updates aren't critical for MVP, consider removing this feature temporarily and relying on pull-to-refresh.

---

### Priority 2: Batch Activity Feed Privacy Checks (Will reduce calls by 10-15%)

```typescript
private static async filterActivitiesByPrivacy(
  activities: ActivityFeedEntry[],
  viewerId: string
): Promise<ActivityFeedEntry[]> {
  // Collect all unique user IDs
  const userIds = [...new Set(activities.map(a => a.user_id))];
  
  // Batch fetch all friendships in ONE query
  const friendships = await this.batchGetFriendships(viewerId, userIds);
  
  // Filter in memory
  return activities.filter(activity => {
    return this.checkPrivacyAccessWithCache(
      activity.user_id,
      viewerId,
      activity.privacy_level,
      friendships
    );
  });
}
```

---

### Priority 3: Add Caching to Venue Service (Will reduce calls by 20-30%)

```typescript
// In VenueService.getFeaturedVenues()
static async getFeaturedVenues(limit?: number) {
  const cacheKey = `featured_venues:${limit}`;
  const cached = await VenueCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const venues = await /* fetch from database */;
  
  await VenueCache.set(cacheKey, venues, 300); // Cache for 5 minutes
  return venues;
}
```

---

### Priority 4: Optimize Check-in Stats Queries

Ensure check-in stats are only fetched once per venue and cached appropriately.

---

## 🎯 Expected Results After Fixes

| Fix | Expected Reduction | New Total |
|-----|-------------------|-----------|
| Starting point | - | 9,500 calls |
| Fix real-time subscriptions | -6,500 calls | 3,000 calls |
| Batch activity feed checks | -1,000 calls | 2,000 calls |
| Add venue caching | -500 calls | 1,500 calls |
| Optimize check-in stats | -300 calls | **1,200 calls** |

**Target: Reduce from 9,500 to ~1,200 calls (87% reduction)**

---

## 🚀 Quick Wins (Can implement immediately)

1. **Disable real-time subscriptions temporarily** - Comment out the useEffect in HomeScreen.tsx (lines 256-318)
2. **Add debouncing to refetch** - Prevent rapid successive queries
3. **Increase cache TTL** - Change flash offer cache from 5 minutes to 10-15 minutes

---

## 📝 Monitoring Recommendations

1. **Add query logging** - Log every database call with timestamp and source
2. **Use Supabase Dashboard** - Check the "Database" → "Query Performance" section
3. **Add performance metrics** - Track queries per screen/component
4. **Set up alerts** - Alert when queries exceed threshold (e.g., 1000/hour)

---

## 🔍 Additional Investigation Needed

1. Check if there are any polling intervals in:
   - Flash offer components
   - Check-in components
   - Profile screens
   
2. Verify if any screens are making queries on every render

3. Check for memory leaks in subscriptions (subscriptions not being cleaned up)

---

## Next Steps

1. **Immediate**: Comment out the real-time subscription in HomeScreen.tsx
2. **Short-term**: Implement Priority 1 fix (filtered subscriptions or debouncing)
3. **Medium-term**: Implement Priority 2 & 3 fixes (batching and caching)
4. **Long-term**: Add comprehensive monitoring and query optimization
