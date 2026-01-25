# Backend Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [API Services](#api-services)
- [Edge Functions](#edge-functions)
- [Database Migrations](#database-migrations)
- [Performance Optimization](#performance-optimization)
- [Security & RLS Policies](#security--rls-policies)
- [Monitoring & Analytics](#monitoring--analytics)

---

## Overview

The OTW (On The Way) app uses **Supabase** as its backend platform, providing:

- **PostgreSQL Database** - Primary data store with PostGIS for location queries
- **Authentication** - Built-in auth with JWT tokens
- **Row Level Security (RLS)** - Database-level authorization
- **Edge Functions** - Serverless Deno functions for background tasks
- **Realtime** - WebSocket subscriptions for live updates
- **Storage** - File storage for user avatars and venue images

### Technology Stack

- **Database**: PostgreSQL 15+ with PostGIS extension
- **Backend**: Supabase (hosted PostgreSQL + Auth + Storage)
- **Edge Functions**: Deno runtime
- **ORM**: Supabase JS Client (direct SQL queries)
- **Caching**: React Query (frontend) + Materialized Views (backend)

---

## Database Schema

### Core Tables

#### `profiles`

User profile information extending Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  username VARCHAR(30) UNIQUE,              -- 🆕 Added 2025-01-25
  display_name VARCHAR(100),                -- 🆕 Added 2025-01-25
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_format CHECK (
    username IS NULL OR (
      username ~ '^[a-z0-9_]{3,30}$'
    )
  )
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_display_name ON profiles USING gin(
  to_tsvector('english', COALESCE(display_name, ''))
);

-- Triggers
CREATE TRIGGER trigger_enforce_lowercase_username
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_lowercase_username();
```

**Username Requirements** (Added 2025-01-25):
- Lowercase alphanumeric and underscore only (`[a-z0-9_]`)
- 3-30 characters
- Unique across all users
- Automatically converted to lowercase via trigger
- Used for @ search functionality

**Display Name** (Added 2025-01-25):
- User-friendly name shown in UI
- Can include spaces and mixed case
- Up to 100 characters
- Full-text search enabled via GIN index
- Falls back to username if not set

---

#### `venues`

Venue/business locations.

```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  
  -- Ratings
  rating DECIMAL(2,1) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  
  -- Media
  image_url TEXT,
  
  -- Features
  amenities TEXT[] DEFAULT '{}',
  hours JSONB DEFAULT '{}',
  price_range TEXT DEFAULT '$',
  max_capacity INTEGER,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Ownership
  owner_id UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_location ON venues(location);
CREATE INDEX idx_venues_rating ON venues(rating DESC);
CREATE INDEX idx_venues_location_gist ON venues 
  USING GIST(ST_Point(longitude, latitude));
```

---

#### `check_ins`

User check-ins to venues.

```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_checkins_venue ON check_ins(venue_id, checked_in_at DESC);
CREATE INDEX idx_checkins_user ON check_ins(user_id, checked_in_at DESC);
CREATE INDEX idx_checkins_active ON check_ins(is_active) WHERE is_active = true;
```

---

#### `reviews`

Venue reviews and ratings.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT CHECK (LENGTH(review_text) <= 500),
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_venue_review UNIQUE(user_id, venue_id)
);

-- Indexes
CREATE INDEX idx_reviews_venue ON reviews(venue_id, created_at DESC);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_helpful ON reviews(helpful_count DESC);
CREATE INDEX idx_reviews_verified ON reviews(is_verified) WHERE is_verified = true;
```

---

#### `flash_offers`

Time-limited promotional offers from venues.

```sql
CREATE TABLE flash_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  value_cap VARCHAR(50),
  max_claims INTEGER NOT NULL,
  claimed_count INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  radius_miles DECIMAL(5,2) DEFAULT 1.0,
  target_favorites_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_flash_offers_venue ON flash_offers(venue_id);
CREATE INDEX idx_flash_offers_active ON flash_offers(start_time, end_time) 
  WHERE end_time > NOW();
```

---

#### `friendships`

Social connections between users.

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Indexes
CREATE INDEX idx_friendships_user ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);
```

---

#### `collections`

User-created venue collections.

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_collection_venue UNIQUE(collection_id, venue_id)
);
```

---

#### `device_tokens`

Push notification device tokens.

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_token UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id) 
  WHERE is_active = true;
CREATE INDEX idx_device_tokens_cleanup ON device_tokens(last_used_at) 
  WHERE is_active = true;
```

---

#### `notification_preferences`

User notification settings.

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Flash offer preferences
  flash_offers_enabled BOOLEAN DEFAULT true,
  max_distance_miles DECIMAL(5,2) DEFAULT 5.0,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Rate limiting
  max_notifications_per_day INTEGER DEFAULT 10,
  last_notification_sent_at TIMESTAMPTZ,
  notifications_sent_today INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Database Functions

#### `get_nearby_venues`

Finds venues within a radius using PostGIS.

```sql
CREATE OR REPLACE FUNCTION get_nearby_venues(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 10,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  distance_km DECIMAL,
  -- ... other venue fields
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    v.*,
    (6371 * acos(
      cos(radians(lat)) * cos(radians(v.latitude)) * 
      cos(radians(v.longitude) - radians(lng)) + 
      sin(radians(lat)) * sin(radians(v.latitude))
    ))::DECIMAL as distance_km
  FROM venues v
  WHERE v.latitude IS NOT NULL 
    AND v.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(lat)) * cos(radians(v.latitude)) * 
      cos(radians(v.longitude) - radians(lng)) + 
      sin(radians(lat)) * sin(radians(v.latitude))
    )) <= radius_km
  ORDER BY distance_km
  LIMIT result_limit;
END;
$ LANGUAGE plpgsql;
```

#### `enforce_lowercase_username` 🆕

Automatically converts usernames to lowercase.

```sql
CREATE OR REPLACE FUNCTION enforce_lowercase_username()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username = LOWER(NEW.username);
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

---

## Authentication & Authorization

### Authentication Flow

1. **Sign Up**: User creates account via Supabase Auth
2. **Profile Creation**: Trigger automatically creates profile record
3. **JWT Token**: Supabase issues JWT with user ID
4. **Session Management**: Token stored in AsyncStorage (mobile)

### Row Level Security (RLS)

All tables have RLS enabled with policies:

#### Profile Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Authenticated users can search profiles 🆕
CREATE POLICY "Authenticated users can search profiles" ON profiles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    username IS NOT NULL
  );
```

#### Venue Policies

```sql
-- Anyone can view venues
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (true);

-- Authenticated users can create venues
CREATE POLICY "Authenticated users can create venues" ON venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Venue owners can update their venues
CREATE POLICY "Owners can update venues" ON venues
  FOR UPDATE USING (auth.uid() = owner_id);
```

#### Review Policies

```sql
-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);
```

---

## API Services

All API services are located in `src/services/api/` and follow a consistent pattern.

### Service Architecture

```
src/services/api/
├── auth.ts              # Authentication
├── venues.ts            # Venue operations
├── checkins.ts          # Check-in management
├── reviews.ts           # Review CRUD
├── favorites.ts         # Favorites management
├── feedback.ts          # User tags/feedback
├── social.ts            # Social features
└── notifications.ts     # Push notifications
```

### Common Patterns

All services follow these patterns:

1. **Error Handling**: Try-catch with descriptive errors
2. **Type Safety**: Full TypeScript types for requests/responses
3. **RLS Enforcement**: Rely on database policies
4. **Batch Operations**: Support for bulk queries where applicable

Example service method:

```typescript
export class VenueService {
  static async getVenueById(id: string): Promise<Venue> {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Venue not found');
      
      return data;
    } catch (error) {
      console.error('[VenueService] getVenueById failed:', error);
      throw error;
    }
  }
}
```

For complete API reference, see [API Reference](./api-reference.md).

---

## Edge Functions

Edge Functions are serverless Deno functions deployed to Supabase.

### Available Functions

#### `send-flash-offer-push`

Sends push notifications for new flash offers.

**Location**: `supabase/functions/send-flash-offer-push/`

**Trigger**: Database webhook on `flash_offers` INSERT

**Flow**:
1. Receive flash offer creation event
2. Query eligible users (within radius, preferences enabled)
3. Batch send FCM notifications
4. Log delivery results

**Environment Variables**:
- `FIREBASE_SERVER_KEY`: FCM server key for push notifications

**Deployment**:
```bash
supabase functions deploy send-flash-offer-push
```

---

## Database Migrations

### Migration Strategy

Migrations are stored in two locations:

1. **Supabase Migrations**: `supabase/migrations/` (version controlled)
2. **Database Scripts**: `database/migrations/` (manual execution)

### Recent Migrations

#### 2025-01-25: Username and Display Name

**File**: `supabase/migrations/20250125000000_add_username_display_name.sql`

**Changes**:
- Added `username` column (VARCHAR(30), UNIQUE)
- Added `display_name` column (VARCHAR(100))
- Added CHECK constraint for username format
- Created indexes for search performance
- Added trigger to enforce lowercase usernames

**Purpose**: Enable @ search functionality for finding users

**Requirements Addressed**:
- 1.1: Username field with validation
- 1.2: Display name field
- 1.3: Username format validation (lowercase alphanumeric + underscore)
- 1.4: Username length validation (3-30 characters)
- 1.5: Automatic lowercase conversion
- 1.6: Search performance indexes
- 1.7: Unique username constraint

**Migration Command**:
```bash
supabase db push
```

**Rollback** (if needed):
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS username;
ALTER TABLE profiles DROP COLUMN IF EXISTS display_name;
DROP TRIGGER IF EXISTS trigger_enforce_lowercase_username ON profiles;
DROP FUNCTION IF EXISTS enforce_lowercase_username();
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_display_name;
```

---

#### 2025-01-25: User Search RLS Policy

**File**: `supabase/migrations/20250125000001_add_user_search_rls_policy.sql`

**Changes**:
- Added RLS policy allowing authenticated users to search profiles
- Restricted to profiles with usernames set

**Purpose**: Enable user search while maintaining privacy

**Requirements Addressed**:
- 2.7: Authenticated user search access
- 9.1: Privacy protection
- 9.2: RLS enforcement

---

#### 2025-01-18: Reviews and Ratings System

**File**: `supabase/migrations/20250118000000_create_reviews_ratings_tables.sql`

**Changes**:
- Created `reviews` table
- Created `review_helpful_votes` table
- Created `venue_responses` table
- Added aggregate rating triggers
- Added RLS policies

**Purpose**: Full review and rating system with venue owner responses

---

### Migration Best Practices

1. **Always test in development first**
2. **Use transactions for multi-step migrations**
3. **Include rollback scripts**
4. **Document breaking changes**
5. **Version migrations with timestamps**
6. **Test RLS policies thoroughly**

### Data Validation Scripts

#### @ Search Feature Validation

**Quick Reference**: See `database/mockdata/README-VALIDATION.md` for usage guide

**Available Scripts**:
- `test-at-search-now.sql` - Quick 30-second validation check
- `quick-at-search-check.sql` - Detailed 1-minute comprehensive check

**Purpose**: Validate @ search feature data integrity and readiness

**Quick Check** (`test-at-search-now.sql`):
- User counts (with/without usernames)
- Sample searchable users
- Test search results
- Instant readiness verdict
- Takes ~30 seconds

**Detailed Check** (`quick-at-search-check.sql`):
- Comprehensive user profile analysis
- Username format validation
- Invalid username detection
- Display name analysis
- Search performance verification
- Data quality recommendations
- Takes ~1 minute

**Usage**:
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste script content
3. Click Run
4. Review results

**Creating Test Data**:
```sql
INSERT INTO profiles (id, email, username, display_name, avatar_url)
VALUES 
  (gen_random_uuid(), 'john@test.com', 'john_doe', 'John Doe', 'https://i.pravatar.cc/150?img=1'),
  (gen_random_uuid(), 'sarah@test.com', 'sarah_smith', 'Sarah Smith', 'https://i.pravatar.cc/150?img=2')
ON CONFLICT (email) DO NOTHING;
```

**When to Run**:
- Before deploying @ search feature to production
- After username/display_name migration
- When investigating search issues
- During data quality audits

**Documentation**: See `database/mockdata/README-VALIDATION.md` for complete guide

---

## Performance Optimization

### Indexing Strategy

#### B-Tree Indexes (Default)

Used for equality and range queries:

```sql
CREATE INDEX idx_checkins_user ON check_ins(user_id, checked_in_at DESC);
CREATE INDEX idx_reviews_venue ON reviews(venue_id, created_at DESC);
```

#### GIN Indexes

Used for full-text search and JSONB:

```sql
CREATE INDEX idx_profiles_display_name ON profiles 
  USING gin(to_tsvector('english', COALESCE(display_name, '')));
```

#### GIST Indexes

Used for spatial queries (PostGIS):

```sql
CREATE INDEX idx_venues_location_gist ON venues 
  USING GIST(ST_Point(longitude, latitude));
```

#### Partial Indexes

Used for filtered queries:

```sql
CREATE INDEX idx_checkins_active ON check_ins(is_active) 
  WHERE is_active = true;
```

### Query Optimization

#### Use Specific Columns

```typescript
// ❌ Bad: Select all columns
const { data } = await supabase.from('venues').select('*');

// ✅ Good: Select only needed columns
const { data } = await supabase
  .from('venues')
  .select('id, name, rating, location');
```

#### Batch Queries

```typescript
// ❌ Bad: N+1 queries
for (const venueId of venueIds) {
  await getVenueStats(venueId);
}

// ✅ Good: Single batch query
const { data } = await supabase
  .from('venue_stats')
  .select('*')
  .in('venue_id', venueIds);
```

#### Use Pagination

```typescript
const { data } = await supabase
  .from('reviews')
  .select('*')
  .range(offset, offset + limit - 1);
```

### Caching Strategy

#### Frontend Caching (React Query)

```typescript
// Cache venue data for 5 minutes
useQuery({
  queryKey: ['venue', venueId],
  queryFn: () => VenueService.getVenueById(venueId),
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
});
```

#### Database Caching

- Use materialized views for expensive aggregations
- Refresh materialized views on schedule or trigger
- Cache computed values in denormalized columns

---

## Security & RLS Policies

### Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Users only access what they need
3. **RLS First**: Database-level authorization
4. **Input Validation**: Validate all user input
5. **Content Moderation**: Filter inappropriate content

### RLS Policy Patterns

#### Owner-Only Access

```sql
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### Public Read, Authenticated Write

```sql
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create venues" ON venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Friend-Only Access

```sql
CREATE POLICY "Users can view friends' activity" ON activity_feed
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() AND friend_id = activity_feed.user_id)
         OR (friend_id = auth.uid() AND user_id = activity_feed.user_id)
      AND status = 'accepted'
    )
  );
```

### Content Moderation

Reviews and user-generated content are filtered for:

- Profanity
- Spam patterns
- Inappropriate content
- Length limits

See `src/services/compliance/` for implementation.

---

## Monitoring & Analytics

### Database Monitoring

#### Query Performance

```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

#### Table Sizes

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Index Usage

```sql
-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

#### Data Quality Monitoring

For @ search feature data quality:

```sql
-- Check username data quality
SELECT 
  COUNT(*) FILTER (WHERE username IS NOT NULL) AS users_with_username,
  COUNT(*) FILTER (WHERE username IS NULL) AS users_without_username,
  COUNT(*) FILTER (WHERE username !~ '^[a-z0-9_]{3,30}$') AS invalid_usernames,
  COUNT(*) AS total_users
FROM profiles;

-- Check for duplicate usernames (should be 0)
SELECT username, COUNT(*) as duplicate_count
FROM profiles
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;
```

See `database/mockdata/check-at-search-data.sql` for comprehensive validation.

### Application Monitoring

- **Error Tracking**: Console logs + error boundaries
- **Performance**: React Query DevTools
- **Analytics**: Custom event tracking
- **Push Notifications**: Delivery reports in `notification_reports` table

---

## Best Practices

### Database

1. **Always use transactions for multi-step operations**
2. **Add indexes for frequently queried columns**
3. **Use partial indexes for filtered queries**
4. **Implement soft deletes for audit trails**
5. **Use JSONB for flexible schema fields**
6. **Add CHECK constraints for data validation**
7. **Use triggers sparingly (performance impact)**

### API Services

1. **Handle errors gracefully with try-catch**
2. **Use TypeScript types for all requests/responses**
3. **Implement batch operations for bulk queries**
4. **Cache frequently accessed data**
5. **Validate input before database queries**
6. **Use RLS policies instead of manual authorization checks**

### Security

1. **Never expose sensitive data in API responses**
2. **Always use RLS policies for authorization**
3. **Validate and sanitize all user input**
4. **Use environment variables for secrets**
5. **Implement rate limiting for expensive operations**
6. **Log security-relevant events**

---

## Related Documentation

- [API Reference](./api-reference.md) - Complete API documentation
- [Supabase Setup](./supabase-setup.md) - Initial setup guide
- [Database README](../database/README.md) - Database scripts and migrations
- [Backend Enhancement Recommendations](../BACKEND_ENHANCEMENT_RECOMMENDATIONS.md) - Future improvements
- [@ Search Feature Documentation](./at-search-feature.md) - @ search implementation details
- [@ Search Validation Guide](../database/mockdata/README-VALIDATION.md) - Data validation scripts and usage

---

**Last Updated**: January 25, 2026

**Migration Version**: 20250125000001

**@ Search Feature**: Implemented (validation scripts added)
