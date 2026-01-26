# Migration: Add last_timezone_check Column

## Overview

This migration adds the `last_timezone_check` column to the `notification_preferences` table to support timezone change detection functionality. This column tracks when the user's timezone was last checked, enabling a 7-day cooldown period for timezone change prompts.

## Migration Details

- **File:** `20260125000000_add_last_timezone_check.sql`
- **Date:** 2026-01-25
- **Requirements:** 5.7 (Auto-Detect User Timezone spec)
- **Type:** Schema addition (non-breaking)

## Changes

### New Column

```sql
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS last_timezone_check TIMESTAMPTZ DEFAULT NULL;
```

**Column Details:**
- **Name:** `last_timezone_check`
- **Type:** `TIMESTAMPTZ` (timestamp with timezone)
- **Default:** `NULL`
- **Nullable:** Yes
- **Purpose:** Track when timezone was last checked for change detection

### New Index

```sql
CREATE INDEX IF NOT EXISTS idx_notification_prefs_last_tz_check 
  ON notification_preferences(last_timezone_check) 
  WHERE last_timezone_check IS NOT NULL;
```

**Index Details:**
- **Name:** `idx_notification_prefs_last_tz_check`
- **Type:** Partial index (only indexes non-NULL values)
- **Purpose:** Optimize queries checking if 7 days have passed since last check

## Testing

### Prerequisites

1. **Local Supabase Running:**
   ```bash
   supabase start
   ```

2. **Verify Supabase Status:**
   ```bash
   supabase status
   ```

### Running the Migration

#### Option 1: Automatic Migration (Recommended)

When you start Supabase, it automatically applies all pending migrations:

```bash
supabase start
```

#### Option 2: Manual Migration

Apply the migration manually:

```bash
supabase db reset
```

Or apply just this migration:

```bash
supabase migration up
```

### Verification

Run the test script to verify the migration:

```bash
# Connect to local database
supabase db reset

# Run test script
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/test_last_timezone_check.sql
```

Or use Supabase Studio:

1. Open Supabase Studio: http://localhost:54323
2. Go to SQL Editor
3. Copy and paste contents of `test_last_timezone_check.sql`
4. Click **Run**

### Expected Results

The test script should verify:

1. ✅ Column `last_timezone_check` exists
2. ✅ Column type is `timestamptz`
3. ✅ Column is nullable with default NULL
4. ✅ Column comment is set correctly
5. ✅ Index `idx_notification_prefs_last_tz_check` exists
6. ✅ Existing rows have NULL value for new column
7. ✅ No data loss or corruption in existing columns

## Usage

### Application Code

The column will be used by the timezone change detection feature:

```typescript
// Check if enough time has passed since last check (7 days)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const { data: prefs } = await supabase
  .from('notification_preferences')
  .select('timezone, last_timezone_check')
  .eq('user_id', userId)
  .single();

const shouldCheckTimezone = 
  !prefs.last_timezone_check || 
  new Date(prefs.last_timezone_check) < sevenDaysAgo;

if (shouldCheckTimezone) {
  // Check for timezone changes and prompt user if needed
  // Update last_timezone_check after check
  await supabase
    .from('notification_preferences')
    .update({ last_timezone_check: new Date().toISOString() })
    .eq('user_id', userId);
}
```

### Database Queries

```sql
-- Get users who haven't been checked in 7+ days
SELECT user_id, timezone, last_timezone_check
FROM notification_preferences
WHERE last_timezone_check IS NULL 
   OR last_timezone_check < NOW() - INTERVAL '7 days';

-- Update last check timestamp
UPDATE notification_preferences
SET last_timezone_check = NOW()
WHERE user_id = 'user-uuid-here';
```

## Rollback

If you need to rollback this migration:

```sql
-- Remove the index
DROP INDEX IF EXISTS idx_notification_prefs_last_tz_check;

-- Remove the column
ALTER TABLE notification_preferences
DROP COLUMN IF EXISTS last_timezone_check;
```

**Note:** Rollback is safe as this is an additive change. No existing data will be affected.

## Impact Assessment

### Performance Impact

- **Minimal:** Adding a nullable column with default NULL is a metadata-only operation in PostgreSQL
- **No table rewrite:** Existing rows are not modified
- **Index overhead:** Partial index only indexes non-NULL values, minimal storage impact

### Data Impact

- **No data loss:** Existing columns and data remain unchanged
- **Backward compatible:** Applications not using this column will continue to work
- **Default behavior:** All existing rows will have NULL for this column

### Application Impact

- **Non-breaking:** Existing queries and code continue to work
- **Optional feature:** Applications can choose when to start using this column
- **Gradual adoption:** Column will be populated as users open the app

## Related Files

- **Migration:** `supabase/migrations/20260125000000_add_last_timezone_check.sql`
- **Test Script:** `supabase/migrations/test_last_timezone_check.sql`
- **Spec:** `.kiro/specs/auto-detect-timezone/`
- **Requirements:** `.kiro/specs/auto-detect-timezone/requirements.md` (Requirement 5.7)
- **Design:** `.kiro/specs/auto-detect-timezone/design.md`

## Next Steps

After this migration is deployed:

1. **Task 7:** Create Timezone Migration Hook
2. **Task 10:** Create Timezone Change Detection Hook
3. **Task 12:** Integrate Timezone Change Detection in App

## Support

For questions or issues with this migration:

1. Check the test script results
2. Review the design document for context
3. Verify Supabase is running: `supabase status`
4. Check migration logs: `supabase db logs`

## Changelog

- **2026-01-25:** Initial migration created
  - Added `last_timezone_check` column
  - Added partial index for performance
  - Created test script and documentation
