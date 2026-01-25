# @ Search Validation Scripts

Quick validation scripts to check if your database is ready for @ search.

## Quick Check (30 seconds)

**File**: `test-at-search-now.sql`

Copy/paste into Supabase SQL Editor and run. Shows:
- How many users have usernames
- Sample usernames to test
- Instant verdict: Ready or Not

## Detailed Check (1 minute)

**File**: `quick-at-search-check.sql`

More comprehensive validation including:
- User counts and samples
- Invalid username detection
- Test search results
- Display name analysis

## Usage

1. Open Supabase Dashboard → SQL Editor
2. Copy/paste one of the scripts above
3. Click Run
4. Review results

## Creating Test Users

If you need test data:

```sql
INSERT INTO profiles (id, email, username, display_name, avatar_url)
VALUES 
  (gen_random_uuid(), 'john@test.com', 'john_doe', 'John Doe', 'https://i.pravatar.cc/150?img=1'),
  (gen_random_uuid(), 'sarah@test.com', 'sarah_smith', 'Sarah Smith', 'https://i.pravatar.cc/150?img=2')
ON CONFLICT (email) DO NOTHING;
```

Then test in app with: `@john`, `@sarah`

## More Info

See full documentation: `docs/at-search-feature.md`
