# Social Friend System Database Migrations

This directory contains SQL migration files for the Social Friend System feature.

## Migration Files

The migrations should be applied in the following order:

1. **001_create_friendships_tables.sql** - Creates friendships and friend_requests tables
2. **002_create_collections_tables.sql** - Creates collections and collection_venues tables
3. **003_create_venue_shares_activity_feed.sql** - Creates venue_shares and activity_feed tables
4. **004_create_privacy_notifications.sql** - Creates privacy_settings and social_notifications tables with default privacy trigger
5. **005_rls_friendships.sql** - Implements RLS policies for friendships
6. **006_rls_collections.sql** - Implements RLS policies for collections
7. **007_rls_activity_feed.sql** - Implements RLS policies for activity_feed and related tables
8. **008_helper_functions.sql** - Creates database helper functions

## How to Apply Migrations

### Using Supabase Dashboard

1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file in order
4. Execute each migration

### Using Supabase CLI

```bash
# Apply all migrations
supabase db push

# Or apply individual migrations
psql $DATABASE_URL -f database/migrations/001_create_friendships_tables.sql
psql $DATABASE_URL -f database/migrations/002_create_collections_tables.sql
# ... and so on
```

## Prerequisites

These migrations assume the following tables already exist:
- `profiles` - User profiles table (from Supabase Auth)
- `venues` - Venues table (from existing OTW schema)

**Note:** The `activity_feed` table includes a `group_outing_id` field for future use, but it's not constrained with a foreign key since the `group_outings` table is part of post-MVP features and will be created later.

## Features Implemented

### Tables
- **friendships** - Bidirectional friend relationships with close friend designation
- **friend_requests** - Pending friend requests
- **collections** - User-created venue collections with privacy levels
- **collection_venues** - Many-to-many relationship between collections and venues
- **venue_shares** - Venue recommendations shared between friends
- **activity_feed** - Social activity stream with privacy filtering
- **privacy_settings** - User privacy preferences (4-tier system)
- **social_notifications** - In-app social notifications

### Row Level Security (RLS)
All tables have RLS policies that enforce:
- Users can only view/modify their own data
- Privacy levels are respected (public, friends, close_friends, private)
- Friend and close friend relationships control access

### Helper Functions
- `are_friends(user1_id, user2_id)` - Check if two users are friends
- `is_close_friend(user1_id, user2_id)` - Check if user1 marked user2 as close friend
- `get_mutual_friends(user1_id, user2_id)` - Get mutual friends between two users
- `get_activity_feed(viewer_id, limit, offset)` - Get privacy-filtered activity feed
- `get_friend_count(user_id)` - Get friend count for a user
- `get_friends(user_id)` - Get all friends for a user

## Testing

After applying migrations, verify:

1. All tables are created: `\dt` in psql
2. RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
3. Functions are created: `\df` in psql
4. Trigger is working: Insert a new profile and check privacy_settings table

## Rollback

To rollback these migrations, drop tables in reverse order:

```sql
DROP TABLE IF EXISTS social_notifications CASCADE;
DROP TABLE IF EXISTS privacy_settings CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS venue_shares CASCADE;
DROP TABLE IF EXISTS collection_venues CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS are_friends(UUID, UUID);
DROP FUNCTION IF EXISTS is_close_friend(UUID, UUID);
DROP FUNCTION IF EXISTS get_mutual_friends(UUID, UUID);
DROP FUNCTION IF EXISTS get_activity_feed(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_friend_count(UUID);
DROP FUNCTION IF EXISTS get_friends(UUID);
DROP FUNCTION IF EXISTS create_default_privacy_settings();
```

## Notes

- The `friendships` table uses a bidirectional structure with `user_id_1 < user_id_2` constraint for consistency
- Close friend designation is asymmetric - each user can independently mark the other as a close friend
- Privacy settings are automatically created for new users via trigger
- All foreign keys use `ON DELETE CASCADE` for automatic cleanup
