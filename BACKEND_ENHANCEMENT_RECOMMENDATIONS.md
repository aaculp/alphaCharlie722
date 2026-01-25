# Backend Enhancement Recommendations

## Executive Summary

After reviewing your codebase, I've identified several strategic enhancements that would improve performance, maintainability, and scalability. Your current architecture is solid with good separation of concerns, but there are opportunities to consolidate redundant structures, optimize data models, and improve query efficiency.

---

## 1. Database Schema Consolidation

### 1.1 Merge Notification Tables

**Current State:**
- `notification_preferences` (flash offers, quiet hours, distance)
- `social_notifications` (in-app notifications)
- `device_tokens` (push notification tokens)
- Social notification preferences scattered across `notification_preferences`

**Recommendation:** Create a unified notification system

```sql
-- Consolidated notification_settings table
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY,
  
  -- Channel preferences
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  
  -- Category preferences (granular control)
  flash_offers BOOLEAN DEFAULT true,
  friend_requests BOOLEAN DEFAULT true,
  venue_shares BOOLEAN DEFAULT true,
  collection_activity BOOLEAN DEFAULT true,
  reviews_responses BOOLEAN DEFAULT true,
  check_in_nearby BOOLEAN DEFAULT true,
  
  -- Global settings
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  max_distance_miles DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified notifications table (replaces social_notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Notification details
  category VARCHAR(50) NOT NULL, -- 'flash_offer', 'friend_request', 'venue_share', etc.
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  
  -- Delivery tracking
  channels JSONB DEFAULT '{"push": false, "in_app": false, "email": false}'::jsonb,
  delivered_at JSONB, -- {"push": "2024-01-25T10:00:00Z", "in_app": "2024-01-25T10:00:01Z"}
  
  -- Interaction tracking
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  
  -- Reference data
  actor_id UUID, -- Who triggered this notification
  reference_id UUID, -- Related entity (offer_id, friend_request_id, etc.)
  reference_type VARCHAR(50), -- 'flash_offer', 'friend_request', etc.
  data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

**Benefits:**
- Single source of truth for notification preferences
- Easier to add new notification types
- Better tracking of multi-channel delivery
- Reduced JOIN complexity
- Cleaner API surface

---

### 1.2 Consolidate Activity Tracking

**Current State:**
- `activity_feed` (social activities)
- `flash_offer_events` (offer analytics)
- Check-in history scattered across queries
- No unified event tracking

**Recommendation:** Create a unified event stream

```sql
CREATE TABLE event_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_type VARCHAR(50) NOT NULL, -- 'check_in', 'review', 'flash_offer_claim', etc.
  category VARCHAR(20) NOT NULL, -- 'social', 'commerce', 'engagement'
  
  -- Actor and target
  user_id UUID NOT NULL,
  target_type VARCHAR(50), -- 'venue', 'user', 'collection', 'offer'
  target_id UUID,
  
  -- Privacy and visibility
  visibility VARCHAR(20) DEFAULT 'friends', -- 'public', 'friends', 'close_friends', 'private'
  
  -- Event data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Analytics flags
  is_analytics_event BOOLEAN DEFAULT false, -- For flash_offer_events replacement
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized indexes
CREATE INDEX idx_event_stream_user_created ON event_stream(user_id, created_at DESC);
CREATE INDEX idx_event_stream_type_created ON event_stream(event_type, created_at DESC);
CREATE INDEX idx_event_stream_target ON event_stream(target_type, target_id);
CREATE INDEX idx_event_stream_visibility ON event_stream(visibility) WHERE visibility != 'private';
CREATE INDEX idx_event_stream_analytics ON event_stream(target_id, event_type) WHERE is_analytics_event = true;
```

**Benefits:**
- Single table for all user activities
- Unified analytics pipeline
- Easier to build activity feeds
- Better privacy control
- Simplified queries for "recent activity"

---

### 1.3 Optimize Flash Offers Structure

**Current State:**
- `flash_offers` (offer details)
- `flash_offer_claims` (user claims)
- `flash_offer_events` (analytics)
- `flash_offer_rate_limits` (rate limiting)

**Recommendation:** Denormalize for performance

```sql
-- Enhanced flash_offers table
CREATE TABLE flash_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL,
  
  -- Offer details
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  value_cap VARCHAR(50),
  
  -- Claim tracking (denormalized for performance)
  max_claims INTEGER NOT NULL,
  claimed_count INTEGER DEFAULT 0,
  redeemed_count INTEGER DEFAULT 0, -- NEW: track redemptions separately
  
  -- Time constraints
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Targeting
  radius_miles DECIMAL(5,2) DEFAULT 1.0,
  target_favorites_only BOOLEAN DEFAULT false,
  
  -- Status (computed field)
  status VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN NOW() < start_time THEN 'scheduled'
      WHEN NOW() > end_time THEN 'expired'
      WHEN claimed_count >= max_claims THEN 'full'
      ELSE 'active'
    END
  ) STORED,
  
  -- Analytics (denormalized)
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Notification tracking
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  push_recipient_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simplified claims table
CREATE TABLE flash_offer_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES flash_offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Token
  token VARCHAR(6) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  -- Redemption
  redeemed_at TIMESTAMPTZ,
  redeemed_by_user_id UUID,
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_offer UNIQUE(offer_id, user_id),
  CONSTRAINT unique_offer_token UNIQUE(offer_id, token)
);
```

**Benefits:**
- Computed status field eliminates manual updates
- Denormalized counts reduce JOIN overhead
- Simpler queries for offer listings
- Better performance for high-traffic offers
- Eliminate `flash_offer_events` table (use `event_stream` instead)

---

## 2. Structural Improvements

### 2.1 Introduce Polymorphic Relationships

**Current Problem:**
- Multiple tables reference venues: `check_ins`, `reviews`, `favorites`, `collections`, `flash_offers`
- No unified way to track "user interactions with venues"
- Difficult to build comprehensive venue analytics

**Recommendation:** Add interaction tracking table

```sql
CREATE TABLE venue_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  venue_id UUID NOT NULL,
  
  -- Interaction summary (denormalized for performance)
  check_in_count INTEGER DEFAULT 0,
  last_check_in_at TIMESTAMPTZ,
  
  review_count INTEGER DEFAULT 0, -- Should be 0 or 1
  last_review_at TIMESTAMPTZ,
  current_rating INTEGER,
  
  is_favorited BOOLEAN DEFAULT false,
  favorited_at TIMESTAMPTZ,
  
  collection_count INTEGER DEFAULT 0, -- How many collections include this venue
  
  flash_offer_claim_count INTEGER DEFAULT 0,
  last_claim_at TIMESTAMPTZ,
  
  -- Engagement score (computed)
  engagement_score INTEGER GENERATED ALWAYS AS (
    (check_in_count * 10) + 
    (review_count * 50) + 
    (CASE WHEN is_favorited THEN 100 ELSE 0 END) +
    (collection_count * 25) +
    (flash_offer_claim_count * 5)
  ) STORED,
  
  -- Timestamps
  first_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_venue UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_venue_interactions_user ON venue_interactions(user_id, last_interaction_at DESC);
CREATE INDEX idx_venue_interactions_venue ON venue_interactions(venue_id, engagement_score DESC);
CREATE INDEX idx_venue_interactions_engagement ON venue_interactions(engagement_score DESC);
```

**Benefits:**
- Single query to get user's relationship with venue
- Easy to build "recommended venues" based on engagement
- Simplified analytics queries
- Better user insights

---

### 2.2 Normalize Privacy Settings

**Current Problem:**
- Privacy settings scattered across multiple columns
- Hard to add new privacy-controlled features
- Inconsistent privacy level names

**Recommendation:** Use JSONB for flexible privacy

```sql
CREATE TABLE user_privacy (
  user_id UUID PRIMARY KEY,
  
  -- Privacy levels per feature (JSONB for flexibility)
  visibility JSONB DEFAULT '{
    "profile": "public",
    "check_ins": "friends",
    "favorites": "friends",
    "collections": "friends",
    "reviews": "public",
    "activity_feed": "friends"
  }'::jsonb,
  
  -- Privacy flags
  allow_friend_requests BOOLEAN DEFAULT true,
  show_activity_status BOOLEAN DEFAULT true,
  allow_venue_tagging BOOLEAN DEFAULT true,
  
  -- Blocked users
  blocked_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for JSONB queries
CREATE INDEX idx_user_privacy_visibility ON user_privacy USING GIN (visibility);
```

**Benefits:**
- Easy to add new privacy-controlled features
- Flexible privacy levels per feature
- Simpler API for privacy updates
- Better blocked user management

---

## 3. Performance Optimizations

### 3.1 Add Materialized Views for Analytics

**Recommendation:** Pre-compute expensive aggregations

```sql
-- Venue statistics materialized view
CREATE MATERIALIZED VIEW venue_stats AS
SELECT 
  v.id as venue_id,
  v.name,
  
  -- Check-in stats
  COUNT(DISTINCT ci.user_id) as total_unique_visitors,
  COUNT(ci.id) as total_check_ins,
  COUNT(ci.id) FILTER (WHERE ci.checked_in_at > NOW() - INTERVAL '7 days') as check_ins_last_7_days,
  COUNT(ci.id) FILTER (WHERE ci.is_active = true) as active_check_ins,
  
  -- Review stats
  COUNT(r.id) as review_count,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) FILTER (WHERE r.is_verified = true) as verified_review_count,
  
  -- Social stats
  COUNT(DISTINCT f.user_id) as favorite_count,
  COUNT(DISTINCT cv.collection_id) as collection_count,
  
  -- Flash offer stats
  COUNT(DISTINCT fo.id) as flash_offer_count,
  COUNT(DISTINCT foc.user_id) as flash_offer_claim_count,
  
  -- Engagement score
  (
    COUNT(ci.id) * 1.0 +
    COUNT(r.id) * 5.0 +
    COUNT(DISTINCT f.user_id) * 3.0 +
    COUNT(DISTINCT foc.user_id) * 2.0
  ) as engagement_score,
  
  -- Timestamps
  MAX(ci.checked_in_at) as last_check_in_at,
  MAX(r.created_at) as last_review_at
  
FROM venues v
LEFT JOIN check_ins ci ON v.id = ci.venue_id
LEFT JOIN reviews r ON v.id = r.venue_id
LEFT JOIN favorites f ON v.id = f.venue_id
LEFT JOIN collection_venues cv ON v.id = cv.venue_id
LEFT JOIN flash_offers fo ON v.id = fo.venue_id
LEFT JOIN flash_offer_claims foc ON fo.id = foc.offer_id
GROUP BY v.id, v.name;

-- Refresh strategy
CREATE INDEX idx_venue_stats_engagement ON venue_stats(engagement_score DESC);
CREATE INDEX idx_venue_stats_venue ON venue_stats(venue_id);

-- Refresh every 5 minutes
CREATE OR REPLACE FUNCTION refresh_venue_stats()
RETURNS void AS $
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY venue_stats;
END;
$ LANGUAGE plpgsql;
```

**Benefits:**
- Instant venue analytics queries
- Reduced load on primary tables
- Better dashboard performance
- Easy to add new metrics

---

### 3.2 Optimize Check-In Queries

**Current Problem:**
- Multiple queries to get check-in stats
- N+1 queries for venue lists
- No caching strategy for active check-ins

**Recommendation:** Add computed columns and better indexes

```sql
-- Add computed column to venues
ALTER TABLE venues 
ADD COLUMN active_check_in_count INTEGER DEFAULT 0,
ADD COLUMN total_check_in_count INTEGER DEFAULT 0,
ADD COLUMN last_check_in_at TIMESTAMPTZ;

-- Trigger to maintain counts
CREATE OR REPLACE FUNCTION update_venue_check_in_stats()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE venues SET
      active_check_in_count = active_check_in_count + 1,
      total_check_in_count = total_check_in_count + 1,
      last_check_in_at = NEW.checked_in_at
    WHERE id = NEW.venue_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE venues SET
      active_check_in_count = GREATEST(active_check_in_count - 1, 0)
    WHERE id = NEW.venue_id;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_venue_check_in_stats
AFTER INSERT OR UPDATE ON check_ins
FOR EACH ROW
EXECUTE FUNCTION update_venue_check_in_stats();
```

**Benefits:**
- Eliminate separate stats queries
- Faster venue list rendering
- Real-time check-in counts
- Reduced database load

---

### 3.3 Implement Partitioning for Large Tables

**Recommendation:** Partition by time for historical data

```sql
-- Partition check_ins by month
CREATE TABLE check_ins_partitioned (
  LIKE check_ins INCLUDING ALL
) PARTITION BY RANGE (checked_in_at);

-- Create partitions
CREATE TABLE check_ins_2024_01 PARTITION OF check_ins_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE check_ins_2024_02 PARTITION OF check_ins_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition reviews by created_at
CREATE TABLE reviews_partitioned (
  LIKE reviews INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Partition event_stream by created_at
CREATE TABLE event_stream_partitioned (
  LIKE event_stream INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

**Benefits:**
- Faster queries on recent data
- Easier archival of old data
- Better vacuum performance
- Reduced index bloat

---

## 4. API Layer Improvements

### 4.1 Consolidate Service Methods

**Current Problem:**
- Similar methods across multiple services
- Inconsistent error handling
- No unified caching strategy

**Recommendation:** Create base service class

```typescript
// src/services/api/BaseService.ts
export abstract class BaseService {
  protected static cache = new Map<string, { data: any; expires: number }>();
  
  protected static async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const data = await queryFn();
    this.cache.set(key, { data, expires: Date.now() + ttl });
    return data;
  }
  
  protected static invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  protected static async handleError<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[${this.name}] ${operation} failed:`, error);
      throw new ServiceError(operation, error);
    }
  }
}

// Usage in services
export class VenueService extends BaseService {
  static async getFeaturedVenues(limit: number = 10): Promise<Venue[]> {
    return this.handleError('getFeaturedVenues', async () => {
      return this.cachedQuery(
        `venues:featured:${limit}`,
        async () => {
          const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('is_featured', true)
            .limit(limit);
          
          if (error) throw error;
          return data;
        },
        600000 // 10 minutes
      );
    });
  }
}
```

**Benefits:**
- Consistent caching across services
- Unified error handling
- Easier to add logging/monitoring
- Reduced code duplication

---

### 4.2 Batch Operations

**Recommendation:** Add batch endpoints

```typescript
// src/services/api/BatchService.ts
export class BatchService {
  // Batch fetch venues with all related data
  static async getVenuesWithDetails(
    venueIds: string[],
    userId: string
  ): Promise<VenueWithDetails[]> {
    const [venues, stats, reviews, userInteractions] = await Promise.all([
      supabase.from('venues').select('*').in('id', venueIds),
      supabase.from('venue_stats').select('*').in('venue_id', venueIds),
      supabase.from('reviews')
        .select('*')
        .in('venue_id', venueIds)
        .order('helpful_count', { ascending: false })
        .limit(3),
      supabase.from('venue_interactions')
        .select('*')
        .eq('user_id', userId)
        .in('venue_id', venueIds)
    ]);
    
    // Merge data
    return venues.data.map(venue => ({
      ...venue,
      stats: stats.data.find(s => s.venue_id === venue.id),
      topReviews: reviews.data.filter(r => r.venue_id === venue.id),
      userInteraction: userInteractions.data.find(i => i.venue_id === venue.id)
    }));
  }
}
```

**Benefits:**
- Reduce API round trips
- Better mobile performance
- Easier to optimize queries
- Consistent data structure

---

## 5. Migration Strategy

### Phase 1: Non-Breaking Changes (Week 1-2)
1. Add new computed columns to existing tables
2. Create materialized views
3. Implement BaseService class
4. Add batch endpoints

### Phase 2: New Tables (Week 3-4)
1. Create `event_stream` table
2. Create `venue_interactions` table
3. Create `notification_settings` table
4. Migrate data from old tables

### Phase 3: Deprecation (Week 5-6)
1. Update frontend to use new endpoints
2. Run old and new systems in parallel
3. Verify data consistency
4. Remove old tables

### Phase 4: Optimization (Week 7-8)
1. Implement partitioning
2. Optimize indexes
3. Add monitoring
4. Performance testing

---

## 6. Monitoring & Observability

### Recommendation: Add query performance tracking

```sql
-- Query performance log
CREATE TABLE query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name VARCHAR(100) NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  row_count INTEGER,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_perf_name ON query_performance_log(query_name, created_at DESC);
CREATE INDEX idx_query_perf_slow ON query_performance_log(execution_time_ms DESC) 
WHERE execution_time_ms > 1000;
```

---

## 7. Priority Recommendations

### High Priority (Do First)
1. **Consolidate notification tables** - Immediate maintainability win
2. **Add venue_interactions table** - Better analytics and recommendations
3. **Implement BaseService** - Consistent caching and error handling
4. **Add computed columns for check-in counts** - Eliminate N+1 queries

### Medium Priority (Do Next)
1. **Create event_stream table** - Unified activity tracking
2. **Optimize flash offers structure** - Better performance
3. **Add materialized views** - Faster analytics
4. **Implement batch endpoints** - Better mobile performance

### Low Priority (Nice to Have)
1. **Implement partitioning** - Only needed at scale
2. **Normalize privacy settings** - Current structure works
3. **Add query performance logging** - For monitoring

---

## Conclusion

Your backend is well-structured with good separation of concerns. The main opportunities are:

1. **Consolidation** - Merge similar tables (notifications, events)
2. **Denormalization** - Add computed columns for frequently accessed data
3. **Caching** - Unified caching strategy across services
4. **Batch Operations** - Reduce API round trips

These changes will improve performance, reduce complexity, and make the system easier to maintain as you scale.
